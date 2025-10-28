import { type Message, type ToolCall } from "@/lib/types";

interface MessageState {
  isComplete: boolean;
  content: string;
  thinking: string;
  toolCalls: ToolCall[];
}

export function isLoading(state: MessageState): boolean {
  return !state.isComplete;
}

export function hasThinking(state: MessageState): boolean {
  return state.thinking !== undefined && state.thinking.length > 0;
}

export function hasTools(state: MessageState): boolean {
  return state.toolCalls !== undefined && state.toolCalls.length > 0;
}

export function isReasoningStreaming(state: MessageState): boolean {
  return !state.isComplete && hasThinking(state);
}

export function getSearchUrls(state: MessageState): string[] {
  if (!hasTools(state)) return [];

  const urls: string[] = [];

  state.toolCalls.forEach((toolCall) => {
    if (
      toolCall.type === "function" &&
      toolCall.function?.name === "web_search"
    ) {
      try {
        const result = toolCall.result;
        if (result && typeof result === "object") {
          // Extract URLs from search results
          if (result.results && Array.isArray(result.results)) {
            result.results.forEach((r: any) => {
              if (r.url) urls.push(r.url);
            });
          }
          // Alternative structure
          if (result.web_results && Array.isArray(result.web_results)) {
            result.web_results.forEach((r: any) => {
              if (r.url) urls.push(r.url);
            });
          }
        }
      } catch (e) {
        console.error("Error parsing search results:", e);
      }
    }
  });

  return urls;
}

export function getToolCallsByType(
  state: MessageState,
  type: string,
): ToolCall[] {
  if (!hasTools(state)) return [];
  return state.toolCalls.filter(
    (tc) => tc.function?.name === type || tc.type === type,
  );
}

export function isToolCallComplete(toolCall: ToolCall): boolean {
  return toolCall.result !== undefined && toolCall.result !== null;
}
