import React, { useState, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUpRight, X, Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

interface SummaryChatProps {
  isOpen: boolean;
  onClose: () => void;
  summary: string;
  activityTitle?: string;
}

export function SummaryChat({
  isOpen,
  onClose,
  summary,
  activityTitle,
}: SummaryChatProps) {
  const { data: session } = authClient.useSession();
  const user = session?.user as { id: string; [key: string]: any } | undefined;

  const [inputValue, setInputValue] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage, isLoading } = useChat({
    transport: new DefaultChatTransport({
      api: `${import.meta.env.VITE_SERVER_URL}/chat/summary`,
    }),
    onFinish: ({ message }) => {
      // Handle conversation completion if needed
      console.log("Summary chat message completed:", message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user || isLoading) return;

    const message = inputValue.trim();
    setInputValue("");

    try {
      await sendMessage({
        message,
        summary,
        activityTitle,
        model: "gemini-2.0-flash-exp",
        userId: user.id,
      });
    } catch (error) {
      console.error("Error sending summary chat message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed bg-black border border-zinc-800 rounded-lg shadow-2xl transition-all z-50 ${
        isExpanded
          ? "inset-4"
          : "bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-4rem)] max-w-4xl h-[500px]"
      }`}
    >
      {/* Chat Header */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="h-4 w-4">
            {isExpanded ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            )}
          </div>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Chat Content */}
      <div className="h-full flex flex-col p-8 pt-16">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-6 mb-6">
          {messages.length === 0 ? (
            <div className="text-center text-zinc-400">
              <p className="text-lg font-medium mb-2">Ask about this summary</p>
              <p className="text-sm">
                I can help you understand, analyze, or answer questions about
                this activity summary.
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`${
                  message.role === "user" ? "flex justify-end" : ""
                }`}
              >
                {message.role === "user" ? (
                  <div className="bg-zinc-800 text-white px-4 py-2 rounded-2xl max-w-md">
                    {message.content}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 h-8 px-2"
                      onClick={() => copyMessage(message.content)}
                    >
                      <Copy className="h-3 w-3 mr-2" />
                      Copy message
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="relative">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this summary..."
            className="w-full backdrop-blur-md pr-12 border rounded-full h-8 px-4 !bg-transparent text-xs text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-300 placeholder:text-muted-foreground hover:!bg-muted"
            disabled={isLoading}
          />
          <Button
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-zinc-800 hover:bg-zinc-700"
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isLoading}
            type="submit"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

