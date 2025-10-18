import React, { useEffect, useState, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  GlobeIcon,
  Paperclip,
  Mic,
  Send,
  X,
  Loader2Icon,
  Sparkles,
  FileText,
  Tag,
  Camera,
  CameraOff,
} from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { UserMessage } from "@/components/chat/user-message";
import { AIMessage } from "@/components/chat/ai-message";
import { authClient } from "@/lib/auth-client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
// --- Import the new component (assuming the path based on your previous request)
import ChatInputArea from "@/components/chat/ChatInputArea";

const models = [
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
];

// --- Type Definitions (kept as is)
interface ConversationSummary {
  id: string;
  title: string;
  summary: string;
  keyPoints: string[];
  topics: string[];
  sentiment: string;
  messageCount: number;
  tags: Array<{ id: number; name: string; category: string }>;
  insights: Array<{
    id: string;
    insightType: string;
    content: string;
  }>;
}

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

interface MessagesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityId: string;
  activityTitle?: string;
  activitySummary?: string;
}

export function MessagesSheet({
  open,
  onOpenChange,
  activityId,
  activityTitle,
  activitySummary,
}: MessagesSheetProps) {
  const { data: session } = authClient.useSession();
  const user = session?.user as { id: string; [key: string]: any } | undefined;

  const [text, setText] = useState<string>("");
  const [model, setModel] = useState<string>(models[0].id);
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isCapturingScreenshot, setIsCapturingScreenshot] =
    useState<boolean>(false);
  const [screenshotEnabled, setScreenshotEnabled] = useState<boolean>(true);
  const [conversationId, setConversationId] = useState<string | null>(
    activityId
  );
  const [summary, setSummary] = useState<ConversationSummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] =
    useState<boolean>(false);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(true);

  // Removed textareaRef and fileInputRef as they are now internal to ChatInputArea

  useEffect(() => {
    setConversationId(activityId);
  }, [activityId]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!activityId) return;

      try {
        setIsLoadingMessages(true);
        const response = await fetch(
          `${import.meta.env.VITE_SERVER_URL}/api/messages/${activityId}`
        );
        if (response.ok) {
          const data = await response.json();
          setInitialMessages(data.messages || []);
        }
      } catch (error) {
        console.error("Error loading messages:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    if (open) {
      loadMessages();
    }
  }, [activityId, open]);

  const { messages, sendMessage, status } = useChat({
    id: conversationId || undefined,
    transport: new DefaultChatTransport({
      api: `${import.meta.env.VITE_SERVER_URL}/chat`,
    }),
    onFinish: ({ message }) => {
      if ((message as any).metadata?.conversationId) {
        setConversationId((message as any).metadata.conversationId);
      }
    },
  });

  const allMessages = useMemo(
    () => [...initialMessages, ...messages],
    [initialMessages, messages]
  );

  const captureAndAddScreenshot = async (): Promise<boolean> => {
    try {
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

  const generateSummary = async () => {
    if (!conversationId) {
      alert("No conversation to summarize yet!");
      return;
    }
    console.log("conversationId", conversationId);

    setIsGeneratingSummary(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/api/summary/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            model,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }

      await response.json();

      const fullSummaryResponse = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/api/summary/${conversationId}/auto`
      );

      if (fullSummaryResponse.ok) {
        const fullData = await fullSummaryResponse.json();
        setSummary(fullData.summary as ConversationSummary);
        setShowSummaryModal(true);
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      alert("Failed to generate summary. Please try again.");
    } finally {
      setIsGeneratingSummary(false);
    }
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

    setIsCapturingScreenshot(true);

    try {
      // Check for screenshotEnabled before attempting to capture
      if (screenshotEnabled) {
        await captureAndAddScreenshot();
        await new Promise((r) => setTimeout(r, 100));
      }

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
            conversationId,
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

  const handleEdit = (messageId: string, content: string) => {
    console.log("Edit message:", messageId, content);
  };

  const handleRegenerate = () => {
    const lastUserMessage = [...messages]
      .reverse()
      .find((m: any) => m.role === "user");
    if (!lastUserMessage) return;

    // type narrowing for .parts array
    const textContent = lastUserMessage.parts.find(
      (p: MessagePart) => p.type === "text"
    ) as { type: "text"; text: string } | undefined;
    if (textContent?.type === "text") {
      sendMessage(
        { text: textContent.text },
        {
          body: {
            model,
            webSearch: useWebSearch,
            userId: user?.id,
            conversationId,
          },
        }
      );
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) =>
    setAttachments((prev) => prev.filter((_, i) => i !== index));

  // The custom key down logic is now managed by ChatInputArea, but we keep the main handler here
  // const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  //   if (e.key === "Enter" && !e.shiftKey) {
  //     e.preventDefault();
  //     handleSubmit(e);
  //   }
  // };

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
  const toggleScreenshot = () => setScreenshotEnabled((prev) => !prev);

  if (!user) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-4xl">
          <SheetHeader>
            <SheetTitle>Messages</SheetTitle>
          </SheetHeader>
          <div className="text-center p-6">
            Please{" "}
            <a href="/login" className="text-blue-500">
              log in
            </a>{" "}
            to start chatting.
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl flex flex-col">
        {/* --- Sheet Header and Summary Button --- */}
        <SheetHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">
              Messages - **{activityTitle || "Activity"}**
            </SheetTitle>
            {conversationId && (
              <Button
                onClick={generateSummary}
                disabled={isGeneratingSummary}
                size="sm"
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
              >
                {isGeneratingSummary ? (
                  <>
                    <Loader2Icon size={16} className="animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Summary</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* --- Conversation Content Area --- */}
        <div className="flex-1 flex flex-col min-h-0">
          {isLoadingMessages ? (
            <div className="text-center p-6">Loading conversation...</div>
          ) : (
            <Conversation className="flex-1">
              <ConversationContent>
                {allMessages.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    <p>
                      No messages yet. Start a conversation about this activity!
                    </p>
                    {activitySummary && (
                      <div className="mt-4 p-4 bg-muted rounded-lg text-sm">
                        **Activity Context:** {activitySummary}
                      </div>
                    )}
                  </div>
                ) : (
                  allMessages.map((message: any, index: number) => {
                    // Message transformation logic remains here
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

                    const isLast = index === allMessages.length - 1;
                    const canRegenerate =
                      message.role === "assistant" &&
                      isLast &&
                      status !== "streaming";

                    return message.role === "user" ? (
                      <UserMessage
                        key={message.id}
                        message={transformed}
                        onEdit={handleEdit}
                      />
                    ) : (
                      <AIMessage
                        key={message.id}
                        message={transformed}
                        onRegenerate={handleRegenerate}
                        canRegenerate={canRegenerate}
                      />
                    );
                  })
                )}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>
          )}

          {/* --- Reusable Input Component Integration --- */}
          <ChatInputArea
            text={text}
            setText={setText}
            model={model}
            setModel={setModel}
            useWebSearch={useWebSearch}
            setUseWebSearch={setUseWebSearch}
            attachments={attachments}
            removeAttachment={removeAttachment}
            isRecording={isRecording}
            toggleRecording={toggleRecording}
            isSubmitting={isCapturingScreenshot} // Renamed prop to isSubmitting in ChatInputArea
            handleSubmit={handleSubmit}
            handleFileSelect={handleFileSelect}
            handlePaste={handlePaste}
            models={models}
            // Passing the screenshot control states and toggles down
            screenshotEnabled={screenshotEnabled}
            toggleScreenshot={toggleScreenshot}
          />
        </div>

        {/* --- Summary Modal (Remains in MessagesSheet) --- */}
        {showSummaryModal && summary && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowSummaryModal(false)}
          >
            <div
              className="bg-background rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText size={24} />
                    <h2 className="text-2xl font-bold">Conversation Summary</h2>
                  </div>
                  <button
                    onClick={() => setShowSummaryModal(false)}
                    className="hover:bg-white/20 p-2 rounded-md transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {summary.title}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>{summary.messageCount} messages</span>
                    <span className="px-2 py-1 bg-secondary rounded-md">
                      {summary.sentiment}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText size={18} />
                    Summary
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {summary.summary}
                  </p>
                </div>

                {summary.keyPoints && summary.keyPoints.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Key Points</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {summary.keyPoints.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {summary.topics && summary.topics.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {summary.topics.map((topic, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full text-sm"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {summary.tags && summary.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Tag size={18} />
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {summary.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="px-3 py-1 bg-secondary rounded-md text-sm"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {summary.insights && summary.insights.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Key Insights</h4>
                    <div className="space-y-3">
                      {summary.insights.map((insight) => (
                        <div
                          key={insight.id}
                          className="p-3 bg-secondary rounded-md"
                        >
                          <span className="text-xs font-semibold uppercase text-muted-foreground">
                            {insight.insightType.replace("_", " ")}
                          </span>
                          <p className="mt-1 text-sm">{insight.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
