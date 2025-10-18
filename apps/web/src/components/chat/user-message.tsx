"use client";

import { memo, useCallback } from "react";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import { Button } from "../ui/button";

export const UserMessage = memo(function UserMessage({ message, onEdit }: any) {
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success("Copied to clipboard");
    } catch (err) {
      console.error("Copy failed", err);
      toast.error("Copy failed");
    }
  }, [message.content]);

  // The 'onEdit' callback wasn't being used in the copy button, so I removed it for clarity.
  // If you need it for another button, you can add it back.
  // const handleEdit = useCallback(() => {
  //   if (onEdit) onEdit(message._id, message.content);
  // }, [onEdit, message._id, message.content]);

  return (
    <Message
      from="user"
      key={message._id}
      className="group"
      data-message-id={message._id}
    >
      <div className="flex flex-col items-end gap-1">
        {/* ^-- KEY CHANGE HERE: This container now aligns its children to the right */}

        <MessageContent
          style={{
            background: "linear-gradient(to bottom, #0441a3, #062b66)",
          }}
          className={cn(
            "border border-muted-foreground/20 text-foreground",
            "rounded-2xl rounded-br-sm",
            "text-sm sm:text-[15px] leading-5 sm:leading-6 p-3",
            "pr-10 max-w-[400px] break-words text-xs",
          )}
        >
          <Response>{message.content}</Response>
        </MessageContent>

        {/* 2. Screenshot Link (Conditionally Rendered) */}
        {message.image && (
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
        )}
      </div>

      {/* Copy Button (mobile) */}
      <div className="block sm:hidden mt-2">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 hover:bg-background/60 text-xs min-h-[36px] touch-manipulation"
          >
            <Copy className="size-3.5" />
            <span>Copy</span>
          </button>
        </div>
      </div>
    </Message>
  );
});
