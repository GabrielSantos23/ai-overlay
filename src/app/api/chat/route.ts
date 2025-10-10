import { streamText, UIMessage, convertToModelMessages } from "ai";
import { google } from "@ai-sdk/google";

export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    model,
    messages,
    webSearch,
  }: {
    messages: UIMessage[];
    model: string;
    webSearch?: boolean;
  } = await req.json();

  const result = streamText({
    model: webSearch ? "perplexity/sonar" : google(model),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
