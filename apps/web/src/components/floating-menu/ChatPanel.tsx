"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // <-- Import AlertDialog components
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useRef } from "react";
import type { Message } from "./types";

type ChatPanelProps = {
  show: boolean;
  messages: Message[];
  isLoading: boolean;
  onClose: () => void;
};

export default function ChatPanel({
  show,
  messages,
  isLoading,
  onClose,
}: ChatPanelProps) {
  const chatRef = useRef<HTMLDivElement>(null);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          ref={chatRef}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-background/70 rounded-2xl p-4 shadow-2xl border border-[#4a4a4a] min-w-[580px] max-h-[500px] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-4 sticky top-0 pb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-xs">AI Response</h3>
            </div>
            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-[#4a4a4a] text-[#b0b0b0] hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will close the chat panel and you will lose the
                      current conversation.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onClose}>
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    delay: index * 0.1,
                  }}
                >
                  {message.role === "user" ? (
                    <div className="flex justify-end">
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="bg-[#0ea5e9] text-white rounded-2xl px-4 py-3 max-w-[80%]"
                      >
                        <p className="text-sm">{message.content}</p>
                      </motion.div>
                    </div>
                  ) : (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={{
                        visible: { transition: { staggerChildren: 0.05 } },
                      }}
                      className="text-[#e0e0e0] text-sm space-y-2"
                    >
                      {message.content.split("\n").map((line, idx) => {
                        if (
                          line.trim().startsWith("•") ||
                          line.trim().startsWith("-")
                        ) {
                          return (
                            <motion.div
                              key={idx}
                              variants={{
                                hidden: { opacity: 0, x: -20 },
                                visible: { opacity: 1, x: 0 },
                              }}
                              className="flex gap-2"
                            >
                              <span>•</span>
                              <span>{line.replace(/^[•-]\s*/, "")}</span>
                            </motion.div>
                          );
                        }
                        return line.trim() ? (
                          <motion.p
                            key={idx}
                            variants={{
                              hidden: { opacity: 0, x: -20 },
                              visible: { opacity: 1, x: 0 },
                            }}
                          >
                            {line}
                          </motion.p>
                        ) : null;
                      })}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-[#888]"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 0.6,
                    delay: 0,
                  }}
                >
                  ●
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 0.6,
                    delay: 0.2,
                  }}
                >
                  ●
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 0.6,
                    delay: 0.4,
                  }}
                >
                  ●
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* View Latest Button */}
          <div className="flex justify-center mt-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                className="bg-[#4a4a4a] hover:bg-[#5a5a5a] text-white rounded-lg px-6 h-9 text-sm font-medium"
              >
                View Latest
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
