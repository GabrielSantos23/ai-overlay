// src/components/chat/ChatInputArea.tsx

import React, { useRef, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  GlobeIcon,
  Paperclip,
  Mic,
  Send,
  X,
  Loader2Icon,
  Camera,
  CameraOff,
  Zap,
} from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Navigation03Icon } from "@hugeicons/core-free-icons";

interface ModelOption {
  id: string;
  name: string;
}

interface ChatInputAreaProps {
  text: string;
  setText: (text: string) => void;
  model: string;
  setModel: (model: string) => void;
  useWebSearch: boolean;
  setUseWebSearch: (useWebSearch: (prev: boolean) => boolean) => void; // Using functional update
  attachments: File[];
  removeAttachment: (index: number) => void;
  isRecording: boolean;
  toggleRecording: () => void;
  isSubmitting: boolean;
  handleSubmit: (
    e:
      | React.FormEvent<HTMLFormElement>
      | React.KeyboardEvent<HTMLTextAreaElement>,
  ) => Promise<void>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => Promise<void>;
  models: ModelOption[];
  screenshotEnabled: boolean;
  toggleScreenshot: () => void;
}

const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  text,
  setText,
  model,
  setModel,
  useWebSearch,
  setUseWebSearch,
  attachments,
  removeAttachment,
  isRecording,
  toggleRecording,
  isSubmitting,
  handleSubmit,
  handleFileSelect,
  handlePaste,
  screenshotEnabled,
  toggleScreenshot,
}) => {
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isSmart, setIsSmart] = useState(false);

  const inputAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSendDisabled = useMemo(() => {
    return (!text.trim() && attachments.length === 0) || isSubmitting;
  }, [text, attachments.length, isSubmitting]);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isSendDisabled) {
      handleSubmit(e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
  };

  const handlePanelBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const related = e.relatedTarget as Node | null;
    if (related && inputAreaRef.current?.contains(related)) {
      return;
    }
    setIsInputFocused(false);
  };

  return (
    <div className="p-4 pt-0">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 mb-2 border border-muted rounded-xl bg-background">
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
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        ref={inputAreaRef}
        tabIndex={-1}
        onBlur={handlePanelBlur}
        className="relative"
      >
        <motion.form
          onSubmit={handleFormSubmit}
          animate={{
            paddingBottom: isInputFocused ? "3rem" : "0rem", // Increased padding for the focus bar
          }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className={`bg-background/70 backdrop-blur-xl border border-muted rounded-xl transition-all shadow-md`}
        >
          <div className="flex items-center gap-2 px-4 py-3 relative">
            <textarea
              value={text}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setText(e.target.value)
              }
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onFocus={handleInputFocus}
              placeholder="Ask about your screen or conversation..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none overflow-y-auto max-h-[100px] min-h-[20px] p-0 border-none"
              rows={1}
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
            className="absolute bottom-0 left-0 right-0"
          >
            <div className="border-t border-muted w-full flex items-center justify-between px-3 py-1.5">
              <div className="flex items-center gap-1">
                {/* 1. Smart Toggle (Aesthetic match from ChatPanel2) */}
                <button
                  type="button"
                  className={`flex items-center gap-1 text-gray-400 hover:text-gray-200 px-2 py-0.5 rounded-full transition-colors ${
                    isSmart
                      ? "bg-[#453e1c] text-yellow-300"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setIsSmart(!isSmart)}
                  title="Toggle Smart Mode"
                >
                  <Zap
                    className={isSmart ? "fill-yellow-300" : "fill-gray-400"}
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
                  onClick={toggleScreenshot}
                  className={`p-1 hover:bg-muted/50 rounded-full transition-colors ${
                    screenshotEnabled
                      ? "text-green-500"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title={
                    screenshotEnabled
                      ? "Disable screenshot capture"
                      : "Enable screenshot capture"
                  }
                >
                  {screenshotEnabled ? (
                    <Camera size={16} />
                  ) : (
                    <CameraOff size={16} />
                  )}
                </button>
              </div>

              <button
                type="submit"
                disabled={isSendDisabled}
                className="h-8 w-8 rounded-full text-white shrink-0 disabled:opacity-50 transition-opacity"
                style={{
                  background: "linear-gradient(to bottom, #0441a3, #062b66)", // Matching the gradient from ChatPanel2
                }}
              >
                {isSubmitting ? (
                  <Loader2Icon size={16} className="animate-spin mx-auto" />
                ) : (
                  <HugeiconsIcon
                    icon={Navigation03Icon}
                    className="fill-white"
                  />
                )}
              </button>
            </div>
          </motion.div>
        </motion.form>
      </div>
    </div>
  );
};

export default ChatInputArea;
