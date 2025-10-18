import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { handleOpenAppWindow } from "../header";
import { HugeiconsIcon } from "@hugeicons/react";
import { Navigation03Icon, Home08Icon } from "@hugeicons/core-free-icons";
import { Zap, Loader2Icon, Camera, CameraOff, Paperclip } from "lucide-react";
import { UserMessage } from "../chat/user-message";
import { AIMessage } from "../chat/ai-message";
import { useChatContext } from "../../contexts/ChatContext";
import { useChatConversation } from "../../hooks/useChatConversation";

export function ChatPanel2() {
  const {
    text,
    setText,
    attachments,
    removeAttachment,
    handlePaste,
    handleFileSelect,
    sendMessage,
    isSubmitting,
    status,
    screenshotEnabled,
    setScreenshotEnabled,
    handleEdit,
    handleRegenerate,
  } = useChatContext();

  const { messages, conversationId, isLoadingMessages } = useChatConversation();

  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isSmart, setIsSmart] = useState(false);

  // Ref for the whole interactive panel (input + toolbar)
  const panelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSend = async () => {
    if (!text.trim() && attachments.length === 0) return;
    await sendMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // When input receives focus, only toggle the focused state.
  // Do NOT call panelRef.current?.focus() here — that steals focus from the input.
  const handleInputFocus = () => {
    setIsInputFocused(true);
  };

  // Handle blur on the panel container. If focus moved outside the panel, close.
  const handlePanelBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const related = e.relatedTarget as Node | null;
    if (related && panelRef.current?.contains(related)) {
      // Focus moved to an element inside the panel — keep open
      return;
    }
    setIsInputFocused(false);
  };

  return (
    <div className="w-[550px]">
      <motion.div
        animate={{
          height: messages.length > 0 ? 450 : "auto",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-background/70 backdrop-blur-xl border border-muted rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-4 py-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md !hover:bg-transparent !hover:text-white group"
            onClick={handleOpenAppWindow}
          >
            <HugeiconsIcon
              icon={Home08Icon}
              className="group-hover:fill-white fill-muted-foreground text-muted-foreground group-hover:text-white"
            />
          </Button>
        </div>

        {isLoadingMessages ? (
          <div className="px-4 pb-4 h-[calc(100%-140px)] flex items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2Icon size={16} className="animate-spin" />
              <span>Loading conversation...</span>
            </div>
          </div>
        ) : messages.length > 0 ? (
          <div className="px-4 pb-4 h-[calc(100%-140px)]  scrollbar-thumb-muted scrollbar-track-background bg-transparent scrollbar-thin overflow-y-auto space-y-4">
            {messages.map((message, index) => {
              const isLast = index === messages.length - 1;
              const canRegenerate =
                message.role === "assistant" &&
                isLast &&
                status !== "streaming";

              return (
                <div key={message._id}>
                  {message.role === "user" ? (
                    <UserMessage message={message} onEdit={handleEdit} />
                  ) : (
                    <AIMessage
                      message={message}
                      canRegenerate={canRegenerate}
                      onRegenerate={handleRegenerate}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : null}

        {attachments.length > 0 && (
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-md text-sm text-foreground"
                >
                  <span className="truncate max-w-[200px]">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className="hover:text-destructive"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 pt-0">
          {/* Panel wrapper handles blur for the whole area */}
          <div ref={panelRef} tabIndex={-1} onBlur={handlePanelBlur}>
            <motion.div
              animate={{
                paddingBottom: isInputFocused ? "2.75rem" : "0rem",
              }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className={`${
                messages.length > 0
                  ? "absolute bottom-3 left-0 right-0 mx-3"
                  : "relative"
              } bg-background/70 border border-muted rounded-xl overflow-hidden `}
            >
              <div className="flex items-center gap-2 px-4 py-3 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={handleInputFocus}
                  onPaste={handlePaste as any}
                  placeholder="Ask about your screen or conversation..."
                  className="flex-1 bg-transparent text-sm text-gray-300 placeholder:text-gray-500 outline-none"
                />
              </div>

              <motion.div
                initial={false}
                animate={{
                  opacity: isInputFocused ? 1 : 0,
                  y: isInputFocused ? 0 : 10,
                  pointerEvents: isInputFocused ? "auto" : "none",
                }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="absolute bottom-0 left-0 right-0 flex items-center justify-between mt-10 "
              >
                <div className="border-t border-muted w-full flex items-center justify-between px-4 py-1">
                  <div className="flex items-center gap-2">
                    <button
                      className={`flex items-center gap-1 text-gray-400 hover:text-gray-200 px-2 py-0.5 rounded-full transition-colors ${
                        isSmart ? "bg-[#453e1c] text-yellow-300" : ""
                      }`}
                      onClick={() => setIsSmart(!isSmart)}
                    >
                      <Zap
                        className={
                          isSmart ? "fill-yellow-300" : "fill-gray-400"
                        }
                        style={{ width: "12px", height: "12px" }}
                      />
                      <span className="text-xs">Smart</span>
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1 hover:bg-muted/50 rounded-full transition-colors text-gray-400 hover:text-gray-200"
                      title="Add attachments"
                    >
                      <Paperclip size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setScreenshotEnabled(!screenshotEnabled)}
                      className={`p-1 hover:bg-muted/50 rounded-full transition-colors ${
                        screenshotEnabled
                          ? "text-green-500"
                          : "text-gray-400 hover:text-gray-200"
                      }`}
                      title={
                        screenshotEnabled
                          ? "Disable screenshot capture"
                          : "Enable screenshot capture"
                      }
                    >
                      {screenshotEnabled ? (
                        <Camera size={14} />
                      ) : (
                        <CameraOff size={14} />
                      )}
                    </button>
                  </div>
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={
                      isSubmitting || (!text.trim() && attachments.length === 0)
                    }
                    className="h-8 w-8 rounded-full text-white shrink-0 disabled:opacity-50"
                    style={{
                      background:
                        "linear-gradient(to bottom, #0441a3, #062b66)",
                    }}
                  >
                    {isSubmitting ? (
                      <Loader2Icon size={16} className="animate-spin" />
                    ) : (
                      <HugeiconsIcon
                        icon={Navigation03Icon}
                        className="fill-white"
                      />
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
