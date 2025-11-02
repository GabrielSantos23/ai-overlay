import { streamText, convertToModelMessages } from "ai";
import { google } from "@ai-sdk/google";
import { nanoid } from "nanoid";
import { conversation, message, attachments } from "../../db/src/schema/auth";
import { db, eq } from "../../db/src";

interface UIMessage {
  role: "user" | "assistant" | "system";
  content?: string;
  parts?: any[];
}

interface CreateChatStreamOptions {
  userId: string;
  uiMessages: UIMessage[];
  conversationId?: string;
  onFinish?: (params: {
    text: string;
    usage: any;
    conversationId: string;
  }) => Promise<void>;
}

export async function createChatStream({
  userId,
  uiMessages,
  conversationId,
  onFinish,
}: CreateChatStreamOptions) {
  const extractText = (msg: any): string => {
    if (!msg) return "";
    if (typeof msg.content === "string" && msg.content.length > 0)
      return msg.content;
    const parts: any[] = Array.isArray(msg.parts) ? msg.parts : [];
    const textPart = parts.find(
      (p) => p && p.type === "text" && typeof p.text === "string"
    );
    if (textPart?.text) return textPart.text as string;
    return "";
  };

  // Create or get conversation
  let convId = conversationId;
  console.log(`[ChatUtils] Received conversationId: ${conversationId}`);
  if (!convId) {
    convId = nanoid();
    await db.insert(conversation).values({
      id: convId,
      userId: userId,
      title:
        extractText(uiMessages[0])?.substring(0, 100) || "New Conversation",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`[AI] Created new conversation: ${convId}`);
  } else {
    // Check if conversation exists before trying to update
    const existingConversation = await db
      .select({ id: conversation.id })
      .from(conversation)
      .where(eq(conversation.id, convId))
      .limit(1);

    if (existingConversation.length === 0) {
      console.log(`[AI] Conversation ${convId} not found, creating new one`);
      // Create the conversation if it doesn't exist
      await db.insert(conversation).values({
        id: convId,
        userId: userId,
        title:
          extractText(uiMessages[0])?.substring(0, 100) || "New Conversation",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      console.log(`[AI] Continuing existing conversation: ${convId}`);
      await db
        .update(conversation)
        .set({ updatedAt: new Date() })
        .where(eq(conversation.id, convId));
    }
  }

  // Store user message (the last message in the array)
  const lastUserMessage = uiMessages[uiMessages.length - 1];
  if (lastUserMessage && lastUserMessage.role === "user") {
    const contentText = extractText(lastUserMessage);
    const userMessageId = nanoid();
    await db.insert(message).values({
      id: userMessageId,
      conversationId: convId,
      role: lastUserMessage.role,
      content: contentText || "(no text)",
      metadata: {
        timestamp: new Date().toISOString(),
      },
      createdAt: new Date(),
    });

    // Persist attachments (file parts) if present
    const parts = Array.isArray(lastUserMessage.parts)
      ? (lastUserMessage.parts as any[])
      : [];
    const fileParts = parts.filter(
      (p) => p && p.type === "file" && typeof p.url === "string"
    );
    if (fileParts.length > 0) {
      const toRows = fileParts.map((p) => {
        const url: string = p.url;
        const commaIdx = url.indexOf(",");
        const base64 = commaIdx !== -1 ? url.slice(commaIdx + 1) : url;
        return {
          id: nanoid(),
          messageId: userMessageId,
          filename: p.filename || null,
          mediaType: p.mediaType || "application/octet-stream",
          data64: base64,
          size: typeof p.size === "number" ? p.size : null,
          createdAt: new Date(),
        };
      });
      await db.insert(attachments).values(toRows);
    }
    console.log(`[AI] Stored user message in conversation ${convId}`);
  }

  // Stream AI response
  const modelName = process.env.GOOGLE_MODEL || "gemini-2.0-flash";
  const result = streamText({
    model: google(modelName),
    messages: convertToModelMessages(uiMessages as any),
    temperature: 0.7,
    onFinish: async ({ text, usage }) => {
      // Store assistant response after streaming completes
      try {
        await db.insert(message).values({
          id: nanoid(),
          conversationId: convId,
          role: "assistant",
          content: text,
          metadata: {
            model: modelName,
            usage: usage,
            timestamp: new Date().toISOString(),
          },
          createdAt: new Date(),
        });
        console.log(`[AI] Stored assistant response in conversation ${convId}`);

        // Call custom onFinish handler if provided
        if (onFinish) {
          await onFinish({ text, usage, conversationId: convId });
        }
      } catch (error) {
        console.error("[AI] Error storing assistant message:", error);
      }
    },
  });

  return { result, conversationId: convId, modelName };
}
