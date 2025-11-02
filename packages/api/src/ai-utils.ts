import { generateObject, convertToModelMessages } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

interface SimpleMessage {
  role: "user" | "assistant";
  content: string;
}

const SummarySchema = z.object({
  title: z
    .string()
    .max(100)
    .describe(
      "A concise title (max 100 chars) representing the main theme of the conversation."
    ),
  keyPoints: z
    .array(z.string())
    .max(3)
    .describe(
      "A list of 3 key takeaways or the most important insights from the conversation."
    ),
  topics: z
    .array(z.string())
    .max(4)
    .describe(
      "A list of 4 main topics or sub-topics discussed, in order of relevance."
    ),
  fullSummary: z
    .string()
    .describe(
      "The complete and detailed summary of the conversation, focused on decisions and actions."
    ),
});

export type ConversationSummary = z.infer<typeof SummarySchema>;

export async function generateSummary(
  messages: SimpleMessage[]
): Promise<ConversationSummary> {
  const modelName = process.env.GOOGLE_MODEL || "gemini-2.0-flash";

  const systemPrompt = `You are a conversation summarization assistant specialized in generating structured JSON responses. Your task is to analyze the provided message history (in chronological order) and fill the required JSON schema.
    The summary must focus on main topics, decisions made, and action items. Keep the 'title' concise, and limit the 'keyPoints' and 'topics' lists to 3 and 4 items, respectively.`;

  const modelMessages = convertToModelMessages(messages as any);

  try {
    const result = await generateObject({
      model: google(modelName),
      system: systemPrompt,
      messages: modelMessages,
      schema: SummarySchema,
      temperature: 0.2,
    });

    return result.object;
  } catch (error) {
    console.error("Error generating or validating AI summary:", error);
    throw new Error(
      "Could not generate the summary. Check the API Key or the returned AI structure."
    );
  }
}
