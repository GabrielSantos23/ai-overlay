import "dotenv/config";
import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@electron-tanstack-router/api/context";
import { appRouter } from "@electron-tanstack-router/api/routers/index";
import { auth } from "@electron-tanstack-router/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { streamText, convertToModelMessages } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@electron-tanstack-router/db";
import {
  conversation,
  message,
  attachment,
  conversationSummary,
  tag,
  conversationTag,
} from "@electron-tanstack-router/db";
import { nanoid } from "nanoid";
import {
  generateConversationSummary,
  getConversationsByTag,
  getConversationSummary,
} from "@electron-tanstack-router/api/lib/summary";
import { eq, desc, sql } from "drizzle-orm";

// Debug API key
console.log(
  "Google API Key:",
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ? "Set" : "Not set"
);

// removed unused SummaryResult interface

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: process.env.CORS_ORIGIN || "",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  })
);

app.post("/chat/summary", async (c) => {
  const body = await c.req.json();
  const { message, summary, activityTitle, model, userId } = body;

  if (!message || !summary) {
    return c.json({ error: "message and summary are required" }, 400);
  }

  const conversationId = nanoid();

  // Create a new conversation for this summary chat
  await db.insert(conversation).values({
    id: conversationId,
    userId,
    title: `Summary Chat: ${activityTitle || "Activity"}`,
    model: model || "gemini-2.0-flash-exp",
  });

  // Save user message
  const messageId = nanoid();
  await db.insert(message).values({
    id: messageId,
    conversationId: conversationId,
    role: "user",
    content: message,
    metadata: { summaryChat: true },
  });

  // Create system message with summary context
  const systemMessage = `You are an AI assistant helping users understand and work with activity summaries. 

Activity Summary:
${summary}

The user is asking about this summary. Please provide helpful, accurate responses based on the summary content. You can:
- Explain key points in detail
- Answer specific questions about the summary
- Provide insights or analysis
- Suggest follow-up actions
- Help with understanding complex topics mentioned

Always be helpful and reference the summary content when relevant.`;

  const stream = streamText({
    model: google(model || "gemini-2.0-flash-exp"),
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: message },
    ],
    abortSignal: c.req.raw.signal,
  });

  const response = stream.toUIMessageStreamResponse({
    onFinish: async ({ isAborted, responseMessage }) => {
      if (isAborted) {
        console.warn("Summary chat stream aborted, not saving AI message");
        return;
      }

      const textPart = responseMessage.parts.find(
        (p: any) => p.type === "text"
      );
      const textContent = textPart && "text" in textPart ? textPart.text : "";

      if (textContent.trim()) {
        const aiMessageId = nanoid();
        await db.insert(message).values({
          id: aiMessageId,
          conversationId: conversationId,
          role: "assistant",
          content: textContent.trim(),
        });
        console.log("Summary chat AI message saved successfully:", aiMessageId);
      }
    },
  });

  response.headers.set("X-Conversation-ID", conversationId);
  return response;
});

app.post("/chat", async (c) => {
  const body = await c.req.json();
  const uiMessages = body.messages || [];
  const { model, webSearch, conversationId, userId } = body;

  let convoId = conversationId;
  if (!convoId) {
    convoId = nanoid();
  }

  // Always try to create the conversation, ignore if it already exists
  try {
    await db.insert(conversation).values({
      id: convoId,
      userId,
      title: uiMessages[0]?.content?.slice(0, 50) || "New Chat",
      model,
    });
  } catch (error) {
    // Check if it's a duplicate key error (conversation already exists)
    const isDuplicateKeyError =
      error instanceof Error &&
      (error.message.includes("duplicate key") ||
        error.message.includes("unique constraint") ||
        error.message.includes("already exists") ||
        (error as any)?.cause?.code === "23505" ||
        (error as any)?.code === "23505");

    if (!isDuplicateKeyError) {
      // If it's not a duplicate key error, it's a real error
      console.error("Error creating conversation:", error);
      return c.json(
        {
          error: "Failed to create conversation",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        500
      );
    }
    // If it's a duplicate key error, just continue - conversation already exists
    console.log(
      "Conversation already exists, continuing with existing conversation:",
      convoId
    );
  }

  // Save user message
  const lastMessage = uiMessages[uiMessages.length - 1];
  const messageId = nanoid();
  await db.insert(message).values({
    id: messageId,
    conversationId: convoId,
    role: lastMessage.role,
    content: lastMessage.parts.find((p: any) => p.type === "text")?.text || "",
    thinking: lastMessage.parts.find((p: any) => p.type === "reasoning")?.text,
    metadata: { webSearch },
  } as any);

  const attachments = lastMessage.parts.filter((p: any) => p.type === "file");
  for (const file of attachments) {
    await db.insert(attachment).values({
      messageId,
      type: file.mediaType?.startsWith("image") ? "image" : "file",
      url: file.url,
      mediaType: file.mediaType,
      filename: file.filename,
      size:
        file.size !== undefined && file.size !== null
          ? String(file.size)
          : undefined,
    } as any);
  }

  const stream = streamText({
    model: google(model || "gemini-2.0-flash-exp"),
    messages: convertToModelMessages(uiMessages),
    abortSignal: c.req.raw.signal,
    system: `# AI Vision Assistant

You are an AI assistant with advanced vision capabilities, designed to analyze and interpret screenshots automatically provided with each user message.

## Core Capabilities

- **Automatic Screenshot Analysis**: Every user message includes a current screenshot that you can see and analyze
- **Visual Understanding**: You can interpret UI elements, text content, images, code, layouts, design patterns, and any other visible content
- **Comprehensive Assistance**: Help with debugging, explaining interfaces, reading text, analyzing designs, identifying errors, and completing screen-based tasks
- **Web Search Integration**: When enabled, you can search for additional information to provide more comprehensive answers

## Response Guidelines

### Screenshot Analysis
- **Always examine the screenshot first** before formulating your response
- **Be specific and precise** when describing what you observe (e.g., "the blue button in the top-right corner" rather than "the button")
- **Reference visible elements directly** when users say "this," "that," or "here"
- **Focus on the current screenshot** - each message contains a fresh capture

### Communication Style
- **Match the user's language**: Always respond in the same language the user is speaking (e.g., Portuguese for Portuguese, Spanish for Spanish)
- **Be concise yet thorough**: Provide complete information without unnecessary verbosity
- **Prioritize relevance**: If a user asks about previous messages or context unrelated to the current screenshot, focus on answering their question directly rather than describing the visible image

### Context Awareness
- When users reference "the last message" or previous conversation turns, prioritize their question over describing the current screenshot
- Distinguish between requests for screen analysis versus conversational follow-ups

## Response Workflow

1. Examine the provided screenshot
2. Identify the user's language and intent
3. Analyze relevant visual elements
4. Provide specific, actionable insights
5. Use web search if additional information would be helpful

Remember: Your primary value is translating visual information into helpful, contextual assistance tailored to each user's needs.`,
  });

  // Use `toUIMessageStreamResponse` to stream back to frontend
  const response = stream.toUIMessageStreamResponse({
    onFinish: async ({ isAborted, responseMessage }) => {
      if (isAborted) {
        console.warn("Stream aborted, not saving AI message");
        return;
      }

      // Extract the text content from the response message
      const textPart = responseMessage.parts.find(
        (p: any) => p.type === "text"
      );
      const textContent = textPart && "text" in textPart ? textPart.text : "";

      if (textContent.trim()) {
        const aiMessageId = nanoid();
        await db.insert(message).values({
          id: aiMessageId,
          conversationId: convoId,
          role: "assistant",
          content: textContent.trim(),
        });
        console.log("AI message saved successfully:", aiMessageId);
      } else {
        console.warn("AI response had no text content to save");
      }
    },
  });

  // Add conversation ID to response headers
  response.headers.set("X-Conversation-ID", convoId);
  return response;
});

/**
 * List conversations for a user
 * GET /api/conversations?userId=...
 */
app.get("/api/conversations", async (c) => {
  try {
    const userId = c.req.query("userId");
    if (!userId) {
      return c.json({ error: "userId is required" }, 400);
    }

    // Join conversations with their summaries to include summary data
    const conversations = await db
      .select({
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        userId: conversation.userId,
        model: conversation.model,
        summary: conversationSummary.summary,
      })
      .from(conversation)
      .leftJoin(
        conversationSummary,
        eq(conversation.id, conversationSummary.conversationId)
      )
      .where(eq(conversation.userId, userId))
      .orderBy(desc(conversation.createdAt));

    return c.json({ success: true, conversations });
  } catch (error) {
    console.error("Error fetching user conversations:", error);
    return c.json(
      {
        error: "Failed to fetch conversations",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * Get messages for a conversation
 * GET /api/messages/:conversationId
 */
app.get("/api/messages/:conversationId", async (c) => {
  try {
    const conversationId = c.req.param("conversationId");

    const messages = await db
      .select()
      .from(message)
      .where(eq(message.conversationId, conversationId))
      .orderBy(message.createdAt);

    // Transform messages to the format expected by useChat
    const transformedMessages = messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      parts: [
        { type: "text", text: msg.content },
        ...(msg.thinking ? [{ type: "reasoning", text: msg.thinking }] : []),
      ],
      metadata: msg.metadata,
    }));

    return c.json({
      success: true,
      messages: transformedMessages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return c.json(
      {
        error: "Failed to fetch messages",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * Get attachments for a conversation
 * GET /api/attachments/:conversationId
 */
app.get("/api/attachments/:conversationId", async (c) => {
  try {
    const conversationId = c.req.param("conversationId");

    // Get all attachments for messages in this conversation using raw SQL to avoid type conflicts
    const attachments = await (db as any)
      .select({
        id: (attachment as any).id,
        messageId: (attachment as any).messageId,
        type: (attachment as any).type,
        url: (attachment as any).url,
        mediaType: (attachment as any).mediaType,
        filename: (attachment as any).filename,
        size: (attachment as any).size,
        createdAt: (attachment as any).createdAt,
      })
      .from(attachment as any)
      .innerJoin(
        message as any,
        eq((attachment as any).messageId, (message as any).id) as any
      )
      .where(eq((message as any).conversationId, conversationId) as any)
      .orderBy((attachment as any).createdAt);

    // Filter for image attachments only
    const imageAttachments = attachments.filter(
      (attachment: any) => attachment.type === "image"
    );

    return c.json({
      success: true,
      attachments: imageAttachments,
    });
  } catch (error) {
    console.error("Error fetching attachments:", error);
    return c.json(
      {
        error: "Failed to fetch attachments",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

app.post("/api/summary/generate", async (c) => {
  try {
    const { conversationId, model } = await c.req.json();

    if (!conversationId) {
      return c.json({ error: "conversationId is required" }, 400);
    }

    const summary = await generateConversationSummary(
      conversationId,
      model || "gemini-2.0-flash-exp"
    );

    return c.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("Error generating summary:", error);
    return c.json(
      {
        error: "Failed to generate summary",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * Get existing summary for a conversation
 * GET /api/summary/:conversationId
 */
app.put("/api/summary/:conversationId", async (c) => {
  try {
    const conversationId = c.req.param("conversationId");
    const { summary, keyPoints, topics, tags } = await c.req.json();

    if (!conversationId) {
      return c.json({ error: "conversationId is required" }, 400);
    }

    // Update the conversation summary with new summary, key points, and topics
    await db
      .update(conversationSummary)
      .set({
        summary: summary || "",
        keyPoints: keyPoints || [],
        topics: topics || [],
        updatedAt: new Date(),
      })
      .where(eq(conversationSummary.conversationId, conversationId));

    // Handle tags - this is more complex as tags are in a separate table
    if (tags && Array.isArray(tags)) {
      // First, remove existing conversation tags
      await db
        .delete(conversationTag)
        .where(eq(conversationTag.conversationId, conversationId));

      // Then add new tags
      for (const tagName of tags) {
        if (tagName.trim()) {
          // Check if tag exists, if not create it
          let [existingTag] = await db
            .select()
            .from(tag)
            .where(eq(tag.name, tagName.trim()))
            .limit(1);

          if (!existingTag) {
            const [newTag] = await db
              .insert(tag)
              .values({
                name: tagName.trim(),
                category: "general", // Default category
              })
              .returning();
            existingTag = newTag;
          }

          // Link tag to conversation
          await db.insert(conversationTag).values({
            conversationId,
            tagId: existingTag.id,
          });
        }
      }
    }

    // Return updated summary
    const updatedSummary = await getConversationSummary(conversationId);

    return c.json({
      success: true,
      message: "Summary updated successfully",
      summary: updatedSummary,
    });
  } catch (error) {
    console.error("Error updating summary:", error);
    return c.json(
      {
        error: "Failed to update summary",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * Get or generate summary (convenient endpoint)
 * GET /api/summary/:conversationId/auto
 */
app.get("/api/summary/:conversationId/auto", async (c) => {
  try {
    const conversationId = c.req.param("conversationId");
    const model = c.req.query("model") || "gemini-2.0-flash-exp";

    // Try to get existing summary
    let summary = await getConversationSummary(conversationId);

    // If no summary exists, generate one
    if (!summary) {
      const generatedSummary = await generateConversationSummary(
        conversationId,
        model
      );
      summary = await getConversationSummary(conversationId);
    }

    return c.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("Error with auto summary:", error);
    return c.json(
      {
        error: "Failed to get/generate summary",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * Search conversations by tag
 * GET /api/summary/tag/:tagName
 */
app.get("/api/summary/tag/:tagName", async (c) => {
  try {
    const tagName = c.req.param("tagName");
    const conversations = await getConversationsByTag(tagName);

    return c.json({
      success: true,
      tag: tagName,
      conversations,
      count: conversations.length,
    });
  } catch (error) {
    console.error("Error searching by tag:", error);
    return c.json(
      {
        error: "Failed to search conversations",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * Get all tags with conversation counts
 * GET /api/summary/tags
 */
app.get("/api/summary/tags", async (c) => {
  try {
    const tags = await (db as any)
      .select({
        id: (tag as any).id,
        name: (tag as any).name,
        category: (tag as any).category,
        count: sql<number>`count(${
          (conversationTag as any).conversationId
        })::int`,
      })
      .from(tag as any)
      .leftJoin(
        conversationTag as any,
        eq((tag as any).id as any, (conversationTag as any).tagId as any) as any
      )
      .groupBy((tag as any).id, (tag as any).name, (tag as any).category)
      .orderBy(
        desc(sql`count(${(conversationTag as any).conversationId})`) as any
      );

    return c.json({
      success: true,
      tags,
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return c.json(
      {
        error: "Failed to fetch tags",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * Update summary data (key points, topics, tags)
 * PUT /api/summary/:conversationId
 */
app.put("/api/summary/:conversationId", async (c) => {
  try {
    const conversationId = c.req.param("conversationId");
    const { summary, topics, tags } = await c.req.json();

    if (!conversationId) {
      return c.json({ error: "conversationId is required" }, 400);
    }

    // Update the conversation summary with new summary and topics
    await db
      .update(conversationSummary)
      .set({
        summary: summary || "",
        topics: topics || [],
        updatedAt: new Date(),
      })
      .where(eq(conversationSummary.conversationId, conversationId));

    // Handle tags - this is more complex as tags are in a separate table
    if (tags && Array.isArray(tags)) {
      // First, remove existing conversation tags
      await db
        .delete(conversationTag)
        .where(eq(conversationTag.conversationId, conversationId));

      // Then add new tags
      for (const tagName of tags) {
        if (tagName.trim()) {
          // Check if tag exists, if not create it
          let [existingTag] = await db
            .select()
            .from(tag)
            .where(eq(tag.name, tagName.trim()))
            .limit(1);

          if (!existingTag) {
            const [newTag] = await db
              .insert(tag)
              .values({
                name: tagName.trim(),
                category: "general", // Default category
              })
              .returning();
            existingTag = newTag;
          }

          // Link tag to conversation
          await db.insert(conversationTag).values({
            conversationId,
            tagId: existingTag.id,
          });
        }
      }
    }

    // Return updated summary
    const updatedSummary = await getConversationSummary(conversationId);

    return c.json({
      success: true,
      message: "Summary updated successfully",
      summary: updatedSummary,
    });
  } catch (error) {
    console.error("Error updating summary:", error);
    return c.json(
      {
        error: "Failed to update summary",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * Update conversation/activity content
 * PUT /api/activities/:conversationId
 */
app.put("/api/activities/:conversationId", async (c) => {
  try {
    const conversationId = c.req.param("conversationId");
    const { summary, title } = await c.req.json();

    if (!conversationId) {
      return c.json({ error: "conversationId is required" }, 400);
    }

    // Update the conversation with new content
    const updateData: any = {};
    if (summary !== undefined) updateData.summary = summary;
    if (title !== undefined) updateData.title = title;
    updateData.updatedAt = new Date();

    await db
      .update(conversation)
      .set(updateData)
      .where(eq(conversation.id, conversationId));

    return c.json({
      success: true,
      message: "Activity updated successfully",
    });
  } catch (error) {
    console.error("Error updating activity:", error);
    return c.json(
      {
        error: "Failed to update activity",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * Regenerate summary (useful if conversation has new messages)
 * POST /api/summary/regenerate
 */
app.post("/api/summary/regenerate", async (c) => {
  try {
    const { conversationId, model } = await c.req.json();

    if (!conversationId) {
      return c.json({ error: "conversationId is required" }, 400);
    }

    // Delete existing summary and related data
    await db
      .delete(conversationSummary)
      .where(eq(conversationSummary.conversationId, conversationId));

    // Generate new summary
    const summary = await generateConversationSummary(
      conversationId,
      model || "gemini-2.0-flash-exp"
    );

    return c.json({
      success: true,
      message: "Summary regenerated successfully",
      summary,
    });
  } catch (error) {
    console.error("Error regenerating summary:", error);
    return c.json(
      {
        error: "Failed to regenerate summary",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

app.get("/", (c) => c.text("OK"));

const port = process.env.PORT || 3000;
console.log(`Server starting on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
