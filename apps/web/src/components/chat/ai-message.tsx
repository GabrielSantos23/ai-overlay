"use client";

import { memo, useCallback } from "react";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning";
import { RefreshCw, Copy } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipPositioner,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/ui/mardown";

import { BiSolidCopy } from "react-icons/bi";
export const AIMessage = memo(function AIMessage({
  message,
  onRegenerate,
  canRegenerate = false,
}: any) {
  const hasThinking = Boolean(message.thinking);
  const isStreaming = !message.isComplete;

  const handleCopy = useCallback(async () => {
    if (message.content) {
      try {
        await navigator.clipboard.writeText(message.content);
        toast.success("Copied to clipboard");
      } catch (err) {
        console.error("Copy failed", err);
        toast.error("Copy failed");
      }
    }
  }, [message.content]);

  const handleRegenerate = useCallback(() => {
    if (onRegenerate) {
      onRegenerate();
    }
  }, [onRegenerate]);

  return (
    <Message
      from="assistant"
      key={message._id}
      data-message-id={message._id}
      className="w-full [&>div]:max-w-none"
    >
      <MessageContent
        className={cn(
          "w-full",
          "group-[.is-assistant]:bg-transparent group-[.is-assistant]:border-transparent group-[.is-assistant]:w-full",
          "rounded-2xl group-[.is-assistant]:rounded-bl-sm",
          "text-sm sm:text-[15px] leading-5 sm:leading-6",
          "streaming-text",
        )}
      >
        <div className="space-y-2 sm:space-y-3">
          {hasThinking && (
            <div className="reasoning-container">
              <Reasoning
                isStreaming={isStreaming}
                duration={message.thinkingDuration || 0}
              >
                <ReasoningTrigger className="hover:text-foreground text-muted-foreground cursor-pointer" />
                <ReasoningContent className="whitespace-pre-wrap text-muted-foreground bg-sidebar rounded-md border px-2">
                  {message.thinking || ""}
                </ReasoningContent>
              </Reasoning>
            </div>
          )}

          {message.content && (
            <Markdown animated className="streaming-text">
              {message.content}
            </Markdown>
          )}

          {message.attachments && message.attachments.length > 0 && (
            <div className="space-y-2">
              {message.attachments.map((attachment: any, index: number) => (
                <img
                  key={index}
                  src={attachment.url}
                  alt={attachment.name}
                  className="h-auto max-w-full overflow-hidden rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(attachment.url, "_blank")}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-2 sm:mt-3 flex items-center gap-1 sm:gap-1.5 text-xs text-muted-foreground/80">
          <Tooltip>
            <TooltipTrigger>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 sm:py-1 hover:bg-muted/60 min-h-[32px] sm:min-h-[28px] touch-manipulation"
                disabled={!message.content}
              >
                <BiSolidCopy className="h-5 w-5 border-background fill-muted-foreground  shrink-0" />
              </button>
            </TooltipTrigger>
            <TooltipPositioner>
              <TooltipContent>Copy</TooltipContent>
            </TooltipPositioner>
          </Tooltip>

          {canRegenerate && (
            <Tooltip>
              <TooltipTrigger>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 sm:py-1 hover:bg-muted/60 min-h-[32px] sm:min-h-[28px] touch-manipulation"
                >
                  <RefreshCw className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipPositioner>
                <TooltipContent>Regenerate</TooltipContent>
              </TooltipPositioner>
            </Tooltip>
          )}
        </div>
      </MessageContent>
    </Message>
  );
});
