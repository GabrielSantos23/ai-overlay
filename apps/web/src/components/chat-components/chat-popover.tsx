import { useEffect, useRef } from "react";
import type { UIMessage } from "@ai-sdk/react";

interface ChatPopoverProps {
  messages: UIMessage[];
  isLoading: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  contentRef?: React.RefObject<HTMLDivElement>;
}

export const ChatPopover = ({
  messages = [],
  isLoading = false,
  contentRef,
}: ChatPopoverProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current && containerRef.current) {
      const container = containerRef.current;
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        100;

      if (isNearBottom || messages.length === 1) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages.length]);

  if (messages.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div
      ref={(node) => {
        if (contentRef) {
          (contentRef as any).current = node;
        }
        (containerRef as any).current = node;
      }}
      className="mt-2h-full bg-background rounded-3xl border p-4  overflow-y-auto"
      style={{
        transition: "none",
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
        perspective: 1000,
      }}
    >
      <div className="space-y-4">
        {messages.map((message, index) => {
          const textContent =
            message.parts
              ?.filter((p: any) => p.type === "text")
              .map((p: any) => p.text)
              .join("") ||
            message.content ||
            "";

          const imageAttachments = message.parts
            ?.filter(
              (p: any) => p.type === "file" && p.mediaType?.startsWith("image/")
            )
            .map((p: any) => p.url);

          return (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
              style={{
                transform: "translateZ(0)",
                willChange:
                  message.role === "assistant" &&
                  index === messages.length - 1 &&
                  isLoading
                    ? "contents"
                    : "auto",
              }}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
                style={{
                  transform: "translateZ(0)",
                }}
              >
                {imageAttachments && imageAttachments.length > 0 && (
                  <div className="mb-2 space-y-2">
                    {imageAttachments.map((url: string, idx: number) => (
                      <img
                        key={idx}
                        src={url}
                        alt="attachment"
                        className="rounded-lg max-w-full h-auto"
                        style={{ transform: "translateZ(0)" }}
                      />
                    ))}
                  </div>
                )}
                {textContent && (
                  <div
                    className="whitespace-pre-wrap break-words"
                    style={{
                      transform: "translateZ(0)",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                    }}
                  >
                    {textContent}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl px-4 py-3">
              <div className="flex space-x-2">
                <div
                  className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
