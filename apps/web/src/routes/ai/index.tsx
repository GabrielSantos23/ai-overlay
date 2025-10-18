import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { GlobeIcon, Paperclip, Mic, Send, X, Loader2Icon } from "lucide-react";
import React from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { UserMessage } from "@/components/chat/user-message";
import { AIMessage } from "@/components/chat/ai-message";
import { nanoid } from "nanoid";

export const Route = createFileRoute("/ai/")({
  component: RouteComponent,
});

const models = [
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
];

type MessagePart =
  | { type: "text"; text: string }
  | { type: "reasoning"; text: string }
  | { type: "file"; file: { url: string; name: string } }
  | { type: string; [key: string]: any };

type Message = {
  id: string;
  role: string;
  parts: MessagePart[];
  metadata?: { conversationId?: string };
};

function RouteComponent() {
  const navigate = useNavigate();
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const user = session?.user as { id: string; [key: string]: any } | undefined;

  const [text, setText] = useState<string>("");
  const [model, setModel] = useState<string>(models[0].id);
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isCapturingScreenshot, setIsCapturingScreenshot] =
    useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatIdRef = useRef<string | null>(null);
  const hasRedirectedRef = useRef<boolean>(false);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: `${import.meta.env.VITE_SERVER_URL}/chat`,
    }),
    onFinish: () => {
      // Redirect after first message is complete
      if (!hasRedirectedRef.current && chatIdRef.current) {
        hasRedirectedRef.current = true;
        navigate({ to: `/ai/${chatIdRef.current}`, replace: true });
      }
    },
  });

  const captureAndAddScreenshot = async (): Promise<boolean> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (window as any).electronAPI?.captureScreenshot?.();
      if (result?.ok) {
        await new Promise((resolve) => setTimeout(resolve, 150));
        const clipboardItems = await navigator.clipboard.read();
        const imageFiles: File[] = [];

        for (const item of clipboardItems) {
          for (const type of item.types) {
            if (type.startsWith("image/")) {
              const blob = await item.getType(type);
              const file = new File([blob], "screenshot.png", { type });
              imageFiles.push(file);
            }
          }
        }

        if (imageFiles.length > 0) {
          setAttachments((prev) => [...prev, ...imageFiles]);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Screenshot capture error:", error);
      return false;
    }
  };

  const convertBlobUrlToDataUrl = async (url: string): Promise<string> => {
    console.log("Converting blob URL to data URL:", url);
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSubmit = async (
    e:
      | React.FormEvent<HTMLFormElement>
      | React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    e.preventDefault();
    if (!user) {
      alert("You must be logged in to chat.");
      return;
    }

    const hasText = text.trim().length > 0;
    const hasAttachments = attachments.length > 0;
    if (!(hasText || hasAttachments)) return;

    // Generate chat ID on first message
    if (messages.length === 0) {
      chatIdRef.current = nanoid();
    }

    setIsCapturingScreenshot(true);

    try {
      await captureAndAddScreenshot();
      await new Promise((r) => setTimeout(r, 100));

      // TypeScript doesn't like setState with resolve inside, so fix with promise and ref.
      let finalAttachments: File[] = [];
      await new Promise<void>((resolve) => {
        setAttachments((prev) => {
          finalAttachments = prev;
          resolve();
          return prev;
        });
      });

      const convertedFiles = await Promise.all(
        finalAttachments.map(async (file) => {
          const url = URL.createObjectURL(file);
          console.log("Attachment file URL:", url);
          const dataUrl = await convertBlobUrlToDataUrl(url);
          URL.revokeObjectURL(url);
          return {
            type: "file" as const,
            url: dataUrl,
            mediaType: file.type,
            filename: file.name,
            size: file.size,
          };
        })
      );

      await sendMessage(
        {
          text: text.trim() || "Sent with attachments",
          files: convertedFiles,
        },
        {
          body: {
            model,
            webSearch: useWebSearch,
            userId: user.id,
            conversationId: chatIdRef.current, // Pass the generated chat ID
          },
        }
      );

      setText("");
      setAttachments([]);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) =>
    setAttachments((prev) => prev.filter((_, i) => i !== index));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      setAttachments((prev) => [...prev, ...imageFiles]);
    }
  };

  const toggleRecording = () => setIsRecording((prev) => !prev);

  if (sessionLoading)
    return <div className="text-center p-6">Loading session...</div>;

  if (!user)
    return (
      <div className="text-center p-6">
        Please{" "}
        <a href="/login" className="text-blue-500">
          log in
        </a>{" "}
        to start chatting.
      </div>
    );

  return (
    <div className="flex flex-col h-full">
      <Conversation>
        <ConversationContent>
          {messages.map((message: any, index: number) => {
            // Narrow types for transformed properties
            const textPart = message.parts.find(
              (p: MessagePart) => p.type === "text"
            ) as { type: "text"; text: string } | undefined;
            const reasoningPart = message.parts.find(
              (p: MessagePart) => p.type === "reasoning"
            ) as { type: "reasoning"; text: string } | undefined;

            const transformed = {
              _id: message.id as string,
              content: textPart?.text || "",
              role: message.role,
              isComplete: true,
              thinking: reasoningPart?.text,
              attachments: (message.parts as MessagePart[])
                .filter((p) => p.type === "file")
                .map((p) => {
                  // Try to get better typing
                  const fileInfo =
                    "file" in p && p.file
                      ? p.file
                      : { url: undefined, name: undefined };
                  return {
                    url: fileInfo.url,
                    name: fileInfo.name,
                  };
                }),
            };

            const isLast = index === messages.length - 1;
            const canRegenerate =
              message.role === "assistant" && isLast && status !== "streaming";

            return message.role === "user" ? (
              <UserMessage
                key={message.id}
                message={transformed}
                onEdit={() => {}}
              />
            ) : (
              <AIMessage
                key={message.id}
                message={transformed}
                onRegenerate={() => {}}
                canRegenerate={canRegenerate}
              />
            );
          })}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="border rounded-lg bg-background">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 border-b">
              {attachments.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-md text-sm"
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

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setText(e.target.value)
            }
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Type a message..."
            className="w-full p-3 resize-none bg-transparent outline-none min-h-[80px] max-h-[200px]"
            rows={3}
          />

          <div className="flex items-center justify-between p-2 border-t">
            <div className="flex items-center gap-2">
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
                className="p-2 hover:bg-secondary rounded-md transition-colors"
                title="Add attachments"
              >
                <Paperclip size={18} />
              </button>

              <button
                type="button"
                onClick={toggleRecording}
                className={`p-2 hover:bg-secondary rounded-md transition-colors ${
                  isRecording ? "text-red-500" : ""
                }`}
                title="Voice input"
              >
                <Mic size={18} />
              </button>

              <button
                type="button"
                onClick={() => setUseWebSearch((prev) => !prev)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  useWebSearch
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary"
                }`}
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </button>

              <select
                value={model}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setModel(e.target.value)
                }
                className="px-3 py-1.5 rounded-md text-sm bg-secondary hover:bg-secondary/80 outline-none cursor-pointer"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={
                (!text.trim() && attachments.length === 0) ||
                isCapturingScreenshot
              }
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCapturingScreenshot ? (
                <>
                  <Loader2Icon size={16} className="animate-spin" />
                  <span>Capturing...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Send</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default RouteComponent;
