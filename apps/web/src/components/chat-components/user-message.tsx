"use client";

import { memo, useCallback } from "react";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipPositioner,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { type Message as MessageType } from "@/lib/types";

interface UserMessageProps {
  message: MessageType;
  onEdit?: (messageId: string, content: string) => void;
}

export const UserMessage = memo(function UserMessage({
  message,
  onEdit,
}: UserMessageProps) {
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

  return (
    <Message
      from="user"
      key={message._id}
      data-message-id={message._id}
      className="w-full [&>div]:max-w-none"
    >
      <MessageContent
        className={cn(
          "ml-auto max-w-[85%] sm:max-w-[400px]",
          "group-[.is-user]:border-muted-foreground/20",
          "rounded-2xl group-[.is-user]:rounded-br-sm",
          "text-sm sm:text-[15px] leading-5 sm:leading-6"
        )}
        style={{
          background: "linear-gradient(to bottom, #0441a3, #062b66)",
        }}
      >
        <div className="space-y-2">
          {/* Message Content */}
          <div className="whitespace-pre-wrap wrap-break-word">
            {message.content}
          </div>

          {/* Attachments/Images */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="space-y-2 pt-2">
              {message.attachments.map((attachment, index) => (
                <div key={index} className="relative">
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="max-w-full h-auto rounded-md border border-muted-foreground/20 cursor-pointer hover:opacity-90 transition-opacity"
                      />
                    </HoverCardTrigger>
                    <HoverCardContent className="w-auto max-w-md p-2 rounded-lg overflow-hidden">
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="w-full h-auto max-h-[400px] object-contain rounded-md"
                      />
                    </HoverCardContent>
                  </HoverCard>
                  {attachment.name && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {attachment.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Legacy image support (if using base64) */}
          {message.image && (
            <div className="pt-2">
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Button
                    variant="link"
                    className="text-xs text-muted-foreground hover:text-foreground h-auto p-0"
                  >
                    Sent with screenshot
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80 p-2 rounded-lg overflow-hidden">
                  <img
                    src={`data:image/png;base64,${message.image}`}
                    alt="Screenshot"
                    className="w-full h-auto max-h-[200px] object-cover rounded-md border border-border"
                  />
                </HoverCardContent>
              </HoverCard>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-2 sm:mt-3 flex items-center justify-end text-xs text-muted-foreground/80">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 sm:py-1 hover:bg-muted/60 min-h-[32px] sm:min-h-[28px] touch-manipulation"
              disabled={!message.content}
            >
              <Copy className="size-3.5" />
            </button>

            {/* Add Edit button if needed */}
            {/* {onEdit && (
              <Tooltip>
                <TooltipTrigger>
                  <button
                    type="button"
                    onClick={() => onEdit(message._id, message.content)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 sm:py-1 hover:bg-muted/60 min-h-[32px] sm:min-h-[28px] touch-manipulation"
                  >
                    <Edit className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipPositioner>
                  <TooltipContent>Edit</TooltipContent>
                </TooltipPositioner>
              </Tooltip>
            )} */}
          </div>
        </div>
      </MessageContent>
    </Message>
  );
});
