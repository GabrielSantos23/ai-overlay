"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import type React from "react";

type AskInputProps = {
  show: boolean;
  question: string;
  setQuestion: (value: string) => void;
  onSubmit: () => void;
};

export default function AskInput({
  show,
  question,
  setQuestion,
  onSubmit,
}: AskInputProps) {
  if (!show) return null;

  return (
    <motion."use client";

    import type React from "react";
    import { useState } from "react";
    import { Send } from "lucide-react";
    import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

    // NOTE: The following imports are placeholders for a typical shadcn/ui setup.
    // You would replace them with your actual component/utility paths.
    // For this example, we'll create simple stand-ins.

    // Placeholder for "@/components/ui/button"
    const Button = ({ children, className, ...props }: React.ComponentProps<"button"> & { size?: string }) => (
      <button className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium", className)} {...props}>
        {children}
      </button>
    );

    // Placeholder for "@/lib/utils"
    const cn = (...inputs: any[]) => {
      // A simple classname utility
      return inputs.filter(Boolean).join(" ");
    };


    interface Message {
      id: string;
      role: "user" | "assistant";
      content: string;
      metadata?: string;
    }

    export function ChatPanel2() {
      const [messages, setMessages] = useState<Message[]>([]);
      const [input, setInput] = useState("");
      const [isInputFocused, setIsInputFocused] = useState(false);

      const handleSend = () => {
        if (!input.trim()) return;

        const newMessage: Message = {
          id: Date.now().toString(),
          role: "user",
          content: input,
          metadata: "Sent with screenshot 📷",
        };

        setMessages([...messages, newMessage]);
        setInput("");

        // Simulate AI response
        setTimeout(() => {
          const aiResponse: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content:
              "You have Visual Studio Code open with a project named electron-tanstack-router. The file in focus is `menu.tsx` located in `apps/web/src/components/floating-menu/`. The code defines a React functional component called `Menu()` that conditionally renders UI elements like `LiveInsightsPanel` and `AskInput`. The terminal at the bottom shows a development server running with Vite and logs of API requests and hot module reload updates.",
          };
          setMessages((prev) => [...prev, aiResponse]);
        }, 1000);
      };

      const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      };

      return (
        <div className="w-full max-w-[550px] font-sans">

          <motion.div
            animate={{
              height: messages.length > 0 ? 450 : "auto",
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-background/70 backdrop-blur-xl border border-muted rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header - Kept for structure, can be populated if needed */}
            <div className="flex items-center justify-between p-4 pb-3"></div>

            {/* Messages Area */}
            <AnimatePresence>
              {messages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="px-4 pb-4 h-[calc(100%-140px)] overflow-y-auto space-y-4"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "flex flex-col",
                        message.role === "user" ? "items-end" : "items-start"
                      )}
                    >
                      {message.role === "user" ? (
                        <div className="flex flex-col items-end gap-1">
                          <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-[400px]">
                            {message.content}
                          </div>
                          {message.metadata && (
                            <span className="text-xs text-gray-500">
                              {message.metadata}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-200 text-sm leading-relaxed max-w-[480px]">
                          {message.content}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="p-4 pt-0">
              <motion.div
                layout
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-black/30 border border-white/10 rounded-xl"
              >
                <LayoutGroup>
                  {/* Input Row */}
                  <div className="flex items-center gap-2 px-4 py-3">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => setIsInputFocused(false)}
                      placeholder={"Ask about your screen or conversation..."}
                      className="flex-1 bg-transparent text-sm text-gray-300 placeholder:text-gray-500 outline-none"
                    />
                    {!isInputFocused && (
                      <motion.div layoutId="send-button">
                        <Button
                          size="icon"
                          onClick={handleSend}
                          className="h-8 w-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    )}
                  </div>

                  {/* Buttons Row */}
                  <AnimatePresence>
                    {isInputFocused && (
                      <motion.div
                        className="flex items-center justify-between px-4 pb-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                      >
                        <motion.button
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-300 transition-colors"
                        >
                          <span className="text-yellow-400">⚡</span>
                          <span>Smart</span>
                        </motion.button>
                        <motion.div layoutId="send-button">
                          <Button
                            size="icon"
                            onClick={handleSend}
                            className="h-8 w-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </LayoutGroup>
              </motion.div>
            </div>
          </motion.div>
        </div>
      );
    }


      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="bg-background/70 rounded-full px-1  border border-muted min-w-[580px]"
    >
      <div className="flex items-center gap-2">
        <motion.input
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if ((e as React.KeyboardEvent<HTMLInputElement>).key === "Enter") {
              onSubmit();
            }
          }}
          placeholder="ask anything about your screen"
          className="flex-1 bg-transparent text-white placeholder:text-sm rounded-full placeholder:text-[#888] px-2 py-2 outline-none focus:ring-2 focus:ring-transparent"
          autoFocus
        />
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={onSubmit}
            disabled={!question.trim()}
            className="bg-[#0070f3] hover:bg-[#0060d3] text-white rounded-full  w-8 h-8 p-2 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
