import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@electron-tanstack-router/db";
import {
  conversation,
  message,
  conversationSummary,
  tag,
  conversationTag,
  conversationInsight,
} from "@electron-tanstack-router/db";
import { nanoid } from "nanoid";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

interface SummaryResult {
  title: string;
  summary: string;
  keyPoints: string[];
  topics: string[];
  tags: string[];
  sentiment: string;
  insights: Array<{
    type: string;
    content: string;
    messageIndex?: number;
  }>;
}

// Define the schema for structured output
const summarySchema = z.object({
  title: z
    .string()
    .max(100)
    .describe("A concise, descriptive title (max 100 characters)"),
  summary: z
    .string()
    .describe(
      "A comprehensive 2-3 paragraph summary of the conversation (do NOT include key points here)"
    ),
  keyPoints: z
    .array(z.string())
    .min(3)
    .max(7)
    .describe(
      "3-7 main points discussed in the conversation as separate array items"
    ),
  topics: z.array(z.string()).min(3).max(10).describe("Main topics/themes"),
  tags: z
    .array(z.string())
    .min(5)
    .max(15)
    .describe("Relevant tags for categorization"),
  sentiment: z
    .enum(["positive", "neutral", "negative", "mixed"])
    .describe("Overall sentiment"),
  insights: z
    .array(
      z.object({
        type: z.enum(["question", "solution", "decision", "action_item"]),
        content: z.string(),
        messageIndex: z.number().optional(),
      })
    )
    .describe("Important questions, solutions, decisions, or action items"),
});

/**
 * Generate a comprehensive summary for a conversation
 */
export async function generateConversationSummary(
  conversationId: string,
  model: string = "gemini-2.0-flash-exp"
): Promise<SummaryResult> {
  // 1. Fetch all messages from the conversation
  const messages = await (db as any)
    .select()
    .from(message as any)
    .where(eq((message as any).conversationId as any, conversationId) as any)
    .orderBy((message as any).createdAt as any);

  if (messages.length === 0) {
    throw new Error("No messages found in conversation");
  }

  // 2. Build conversation context for AI
  const conversationContext = messages
    .map((msg: any, idx: number) => {
      return `[${idx + 1}] ${msg.role.toUpperCase()}: ${msg.content}`;
    })
    .join("\n\n");

  // 3. Generate summary using AI with structured output
  const prompt = `Analyze the following conversation and provide a comprehensive summary.

CONVERSATION:
${conversationContext}

Guidelines:
- Title should capture the essence of the conversation (max 100 characters)
- Summary should be informative and well-structured (2-3 paragraphs ONLY)
- CRITICAL: The summary field MUST NOT contain "KEY POINTS:", bullet points, or dashes
- CRITICAL: The summary should be prose paragraphs only, no lists or formatting
- Key points must be provided separately in the keyPoints array (3-7 items)
- Each key point should be a single concise sentence
- Topics should be broad themes (e.g., "debugging", "API design", "database schema")
- Tags should be specific keywords (e.g., "typescript", "hono", "trpc", "ai", "streaming")
- Sentiment should reflect the overall tone
- Insights should capture important questions, solutions, decisions, or action items
- Always create the summary in the same language that the user is speaking

WRONG format (DO NOT do this):
{
  "summary": "This is a summary.\n\nKEY POINTS:\n- Point 1\n- Point 2"
}

CORRECT format (DO this):
{
  "title": "AI Chat Application Development",
  "summary": "This conversation covered the development of an AI chat application using Electron and React. The discussion focused on implementing real-time messaging features and handling user authentication. The team explored various approaches to state management and API integration.",
  "keyPoints": [
    "Implemented WebSocket connections for real-time messaging",
    "Added user authentication with JWT tokens",
    "Integrated React Query for efficient data fetching",
    "Set up proper error handling and loading states"
  ],
  "topics": ["electron", "react", "real-time", "authentication"],
  "tags": ["typescript", "websocket", "jwt", "react-query"],
  "sentiment": "positive"
}`;

  let summaryData: SummaryResult;

  try {
    // Use generateObject for structured output
    const { object } = await generateObject({
      model: google(model),
      schema: summarySchema,
      prompt,
      temperature: 0.3,
    });

    summaryData = object as SummaryResult;
  } catch (error) {
    console.error("Failed to generate structured summary:", error);

    // Create a more intelligent fallback based on conversation content
    const firstMessage = messages[0]?.content || "";

    // Try to extract a meaningful title from the first message
    let fallbackTitle = "Conversation Summary";
    if (firstMessage.length > 0) {
      const words = firstMessage.split(" ").slice(0, 8); // First 8 words
      fallbackTitle = words.join(" ");
      if (fallbackTitle.length > 100) {
        fallbackTitle = fallbackTitle.substring(0, 97) + "...";
      }
    }

    // Generate basic key points from message content
    const keyPoints = messages
      .slice(0, 5) // First 5 messages
      .map((msg: any, idx: number) => {
        const content = msg.content.substring(0, 100);
        return `Message ${idx + 1}: ${content}${
          content.length >= 100 ? "..." : ""
        }`;
      })
      .filter((point: string) => point.length > 10);

    summaryData = {
      title: fallbackTitle,
      summary: `This conversation contained ${
        messages.length
      } messages discussing various topics. The conversation started with: "${firstMessage.substring(
        0,
        200
      )}${firstMessage.length > 200 ? "..." : ""}"`,
      keyPoints: keyPoints.length > 0 ? keyPoints : ["General discussion"],
      topics: ["General Discussion"],
      tags: ["conversation"],
      sentiment: "neutral",
      insights: [],
    };
  }

  // 5. Save or update summary in database
  // Check if summary already exists
  const existingSummary = await (db as any)
    .select()
    .from(conversationSummary as any)
    .where(
      eq(
        (conversationSummary as any).conversationId as any,
        conversationId
      ) as any
    )
    .limit(1);

  try {
    if (existingSummary.length > 0) {
      // Update existing summary
      console.log("Summary exists, updating for conversation:", conversationId);

      await (db as any)
        .update(conversationSummary as any)
        .set({
          title: summaryData.title,
          summary: summaryData.summary,
          keyPoints: summaryData.keyPoints,
          topics: summaryData.topics,
          sentiment: summaryData.sentiment,
          messageCount: messages.length,
          updatedAt: new Date(),
        } as any)
        .where(
          eq(
            (conversationSummary as any).conversationId as any,
            conversationId
          ) as any
        );

      console.log("Updated existing summary for conversation:", conversationId);
    } else {
      // Create new summary
      const summaryId = nanoid();

      await (db as any).insert(conversationSummary as any).values({
        id: summaryId,
        conversationId,
        title: summaryData.title,
        summary: summaryData.summary,
        keyPoints: summaryData.keyPoints,
        topics: summaryData.topics,
        sentiment: summaryData.sentiment,
        messageCount: messages.length,
      } as any);

      console.log("Created new summary for conversation:", conversationId);
    }
  } catch (dbError) {
    console.error("Database error while saving summary:", dbError);
    throw new Error(
      `Failed to save summary to database: ${
        dbError instanceof Error ? dbError.message : "Unknown error"
      }`
    );
  }

  // 6. Handle tags (create if they don't exist, then link to conversation)
  try {
    // First, remove existing conversation tags to avoid duplicates
    await (db as any)
      .delete(conversationTag as any)
      .where(
        eq(
          (conversationTag as any).conversationId as any,
          conversationId
        ) as any
      );

    // Then add new tags
    for (const tagName of summaryData.tags) {
      try {
        // Check if tag exists
        const existingTag = await (db as any)
          .select()
          .from(tag as any)
          .where(eq((tag as any).name as any, tagName.toLowerCase()) as any)
          .limit(1);

        let tagId: number;
        if (existingTag.length > 0) {
          tagId = existingTag[0].id;
        } else {
          // Create new tag
          const [newTag] = await (db as any)
            .insert(tag as any)
            .values({
              name: tagName.toLowerCase(),
              category: categorizeTag(tagName),
            })
            .returning();
          tagId = newTag.id;
        }

        // Link tag to conversation
        await (db as any).insert(conversationTag as any).values({
          conversationId,
          tagId,
        });
      } catch (tagError) {
        console.warn(`Failed to process tag "${tagName}":`, tagError);
        // Continue with other tags
      }
    }
  } catch (tagsError) {
    console.error("Error handling tags:", tagsError);
    // Don't throw here, tags are not critical for summary generation
  }

  // 7. Save insights
  try {
    // First, remove existing insights to avoid duplicates
    await (db as any)
      .delete(conversationInsight as any)
      .where(
        eq(
          (conversationInsight as any).conversationId as any,
          conversationId
        ) as any
      );

    // Then add new insights
    for (const insight of summaryData.insights) {
      try {
        const insightId = nanoid();
        let messageId: string | undefined;

        // Try to map messageIndex to actual messageId
        if (insight.messageIndex !== undefined) {
          const msgIndex = insight.messageIndex - 1;
          if (msgIndex >= 0 && msgIndex < messages.length) {
            messageId = messages[msgIndex].id;
          }
        }

        await db.insert(conversationInsight).values({
          id: insightId,
          conversationId,
          insightType: insight.type,
          content: insight.content,
          messageId,
        });
      } catch (insightError) {
        console.warn(`Failed to process insight:`, insightError);
        // Continue with other insights
      }
    }
  } catch (insightsError) {
    console.error("Error handling insights:", insightsError);
    // Don't throw here, insights are not critical for summary generation
  }

  // 8. Update conversation title if needed
  try {
    const [conv] = await (db as any)
      .select()
      .from(conversation as any)
      .where(eq((conversation as any).id as any, conversationId) as any)
      .limit(1);

    if (
      conv &&
      (!conv.title || conv.title === "New Chat" || conv.title.length < 10)
    ) {
      await (db as any)
        .update(conversation as any)
        .set({ title: summaryData.title })
        .where(eq((conversation as any).id as any, conversationId) as any);
    }
  } catch (titleError) {
    console.error("Error updating conversation title:", titleError);
    // Don't throw here, title update is not critical
  }

  return summaryData;
}

/**
 * Categorize a tag based on common patterns
 */
function categorizeTag(tagName: string): string {
  const technical = [
    "typescript",
    "javascript",
    "react",
    "nodejs",
    "api",
    "database",
    "sql",
    "code",
    "debugging",
    "programming",
  ];
  const ai = ["ai", "ml", "gemini", "openai", "chatgpt", "llm", "gpt"];
  const work = ["meeting", "project", "deadline", "task", "planning"];
  const personal = ["advice", "help", "question", "learning"];

  const lowerTag = tagName.toLowerCase();

  if (technical.some((t) => lowerTag.includes(t))) return "technical";
  if (ai.some((t) => lowerTag.includes(t))) return "ai";
  if (work.some((t) => lowerTag.includes(t))) return "work";
  if (personal.some((t) => lowerTag.includes(t))) return "personal";

  return "general";
}

/**
 * Get conversation summary with all related data
 */
export async function getConversationSummary(conversationId: string) {
  const [summary] = await (db as any)
    .select()
    .from(conversationSummary as any)
    .where(
      eq(
        (conversationSummary as any).conversationId as any,
        conversationId
      ) as any
    )
    .limit(1);

  if (!summary) {
    return null;
  }

  // Get tags
  const tags = await (db as any)
    .select({
      id: (tag as any).id,
      name: (tag as any).name,
      category: (tag as any).category,
    })
    .from(conversationTag as any)
    .innerJoin(
      tag as any,
      eq((conversationTag as any).tagId as any, (tag as any).id as any) as any
    )
    .where(
      eq((conversationTag as any).conversationId as any, conversationId) as any
    );

  // Get insights
  const insights = await (db as any)
    .select()
    .from(conversationInsight as any)
    .where(
      eq(
        (conversationInsight as any).conversationId as any,
        conversationId
      ) as any
    )
    .orderBy((conversationInsight as any).createdAt as any);

  return {
    ...summary,
    tags: tags.map((t: any) => ({
      id: t.id,
      name: t.name,
      category: t.category,
    })),
    insights,
  };
}

/**
 * Search conversations by tag
 */
export async function getConversationsByTag(tagName: string) {
  const conversations = await (db as any)
    .select({
      conversationId: (conversationTag as any).conversationId,
      title: (conversation as any).title,
      createdAt: (conversation as any).createdAt,
    })
    .from(conversationTag as any)
    .innerJoin(
      tag as any,
      eq((conversationTag as any).tagId as any, (tag as any).id as any) as any
    )
    .innerJoin(
      conversation as any,
      eq(
        (conversationTag as any).conversationId as any,
        (conversation as any).id as any
      ) as any
    )
    .where(eq((tag as any).name as any, tagName.toLowerCase()) as any)
    .orderBy(desc((conversation as any).createdAt as any) as any);

  return conversations;
}
