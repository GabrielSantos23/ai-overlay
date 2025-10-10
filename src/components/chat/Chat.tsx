"use client";

import { X, Globe } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { UserMessage } from "@/components/chat/user-message";
import { AIMessage } from "@/components/chat/ai-message";
import { toast } from "sonner";

const models = [
  { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
  { id: "gemini-1.0-pro", name: "Gemini 1.0 Pro" },
];

interface ChatProps {
  askModal: boolean;
  setAskModal: (askModal: boolean) => void;
  onHasMessagesChange?: (hasMessages: boolean) => void;
}

const Chat = ({ askModal, setAskModal, onHasMessagesChange }: ChatProps) => {
  const [text, setText] = useState<string>("");
  const [model, setModel] = useState<string>(models[0].id);
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const { messages, status, sendMessage, error } = useChat();

  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (onHasMessagesChange) {
      onHasMessagesChange(hasMessages);
    }
  }, [hasMessages, onHasMessagesChange]);

  useEffect(() => {
    if (error) {
      toast.error(
        <>
          <div>
            <strong>Error:</strong> {error.message}
          </div>
          <div>
            <small>Make sure the API route is working correctly</small>
          </div>
        </>
      );
    }
  }, [error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) {
      return;
    }

    sendMessage(
      { text: text },
      {
        body: {
          model: model,
          webSearch: useWebSearch,
        },
      }
    );
    setText("");
  };

  const handleTellMeMore = () => {
    sendMessage(
      { text: "Tell me more" },
      {
        body: {
          model: model,
          webSearch: useWebSearch,
        },
      }
    );
  };

  const handleEdit = (messageId: string, content: string) => {
    console.log("Edit message:", messageId, content);
  };

  const handleRegenerate = () => {
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((m) => m.role === "user");

    if (lastUserMessage) {
      const textContent = lastUserMessage.parts.find((p) => p.type === "text");
      if (textContent && textContent.type === "text") {
        sendMessage(
          { text: textContent.text },
          {
            body: {
              model: model,
              webSearch: useWebSearch,
            },
          }
        );
      }
    }
  };

  const handleChatClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hasMessages) {
      console.log("has messages");
      e.stopPropagation();
    } else {
      console.log("no messages");
      if (e.target === e.currentTarget) {
        setAskModal(!askModal);
      }
    }
  };

  return (
    <div
      data-interactive="true"
      ref={chatRef}
      onClick={handleChatClick}
      className={`backdrop-blur-md rounded-2xl w-[600px] flex flex-col z-40 ${
        hasMessages ? "h-[420px]" : "h-auto"
      }`}
    >
      {hasMessages && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setAskModal(!askModal);
          }}
          className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-colors z-10"
          aria-label="Close chat"
        >
          <X
            size={20}
            className="text-muted-foreground hover:text-foreground"
          />
        </button>
      )}

      <div
        className={`flex flex-col p-4 ${
          hasMessages
            ? "h-full bg-background/70 py-1 border-2 border-border rounded-2xl"
            : ""
        }`}
      >
        {hasMessages ? (
          <>
            <Conversation className="flex-1">
              <ConversationContent>
                {messages.map((message, index) => {
                  const transformedMessage = {
                    _id: message.id,
                    content:
                      message.parts.find((p) => p.type === "text")?.text || "",
                    role: message.role,
                    isComplete: true,
                    thinking: message.parts.find((p) => p.type === "reasoning")
                      ?.text,
                    attachments: message.parts
                      .filter((p) => p.type === "file")
                      .map((p) => ({
                        url: (p as any).file?.url,
                        name: (p as any).file?.name,
                      })),
                  };

                  const isLastMessage = index === messages.length - 1;
                  const canRegenerate =
                    message.role === "assistant" &&
                    isLastMessage &&
                    status !== "streaming";

                  if (message.role === "user") {
                    return (
                      <UserMessage
                        key={message.id}
                        message={transformedMessage}
                        onEdit={handleEdit}
                      />
                    );
                  } else {
                    return (
                      <AIMessage
                        key={message.id}
                        message={transformedMessage}
                        onRegenerate={handleRegenerate}
                        canRegenerate={canRegenerate}
                      />
                    );
                  }
                })}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>

            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={handleTellMeMore}
                disabled={status === "streaming"}
                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm font-medium transition-colors"
              >
                Tell me more
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setAskModal(!askModal);
                }}
                className="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md text-sm font-medium transition-colors"
              >
                Copy conversation
              </button>
            </div>
          </>
        ) : (
          <AnimatePresence mode="wait">
            <motion.form
              key="chat-form"
              onSubmit={handleSubmit}
              className="w-full"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.3,
              }}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setUseWebSearch(!useWebSearch)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                        useWebSearch
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <Globe size={12} />
                      <span>Search</span>
                    </button>

                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs border-none outline-none"
                    >
                      {models.map((modelOption) => (
                        <option key={modelOption.id} value={modelOption.id}>
                          {modelOption.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-full px-4 bg-background/70 py-1 border-2 border-border">
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    placeholder="Ask about your screen"
                    className="flex-1 bg-transparent border-none outline-none resize-none text-sm placeholder:text-muted-foreground"
                    rows={1}
                    style={{ maxHeight: "120px" }}
                  />

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={!text.trim() || status === "streaming"}
                      className="px-2 py-0.5 bg-transparent text-primary hover:bg-muted/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-full"
                    >
                      <span>Submit</span>
                      <span>↵</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.form>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default Chat;
