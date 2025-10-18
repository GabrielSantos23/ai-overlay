import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { nanoid } from "nanoid";
import { authClient } from "@/lib/auth-client";

// Types
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

type TransformedMessage = {
  _id: string;
  content: string;
  role: "user" | "assistant";
  isComplete: boolean;
  thinking?: string;
  attachments?: Array<{
    url?: string;
    name?: string;
  }>;
};

interface ChatContextType {
  // Messages
  messages: TransformedMessage[];
  initialMessages: TransformedMessage[];
  isLoadingMessages: boolean;

  // Chat state
  conversationId: string | null;
  isSubmitting: boolean;
  status:
    | "awaiting_message"
    | "in_progress"
    | "streaming"
    | "error"
    | "submitted"
    | "ready";

  // Input state
  text: string;
  setText: (text: string) => void;
  attachments: File[];
  setAttachments: (attachments: File[]) => void;

  // Settings
  model: string;
  setModel: (model: string) => void;
  useWebSearch: boolean;
  setUseWebSearch: (useWebSearch: boolean) => void;
  screenshotEnabled: boolean;
  setScreenshotEnabled: (enabled: boolean) => void;

  // Actions
  sendMessage: () => Promise<void>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeAttachment: (index: number) => void;
  handlePaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => Promise<void>;
  captureAndAddScreenshot: () => Promise<boolean>;
  startNewChat: () => void;
  loadConversation: (id: string) => Promise<void>;

  // Message actions
  handleEdit: (messageId: string, content: string) => void;
  handleRegenerate: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const models = [
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
];

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession();
  const user = session?.user as { id: string; [key: string]: any } | undefined;

  // State
  const [text, setText] = useState<string>("");
  const [model, setModel] = useState<string>(models[0].id);
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [initialMessages, setInitialMessages] = useState<TransformedMessage[]>(
    []
  );
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [screenshotEnabled, setScreenshotEnabled] = useState<boolean>(true);

  // Refs
  const chatIdRef = useRef<string | null>(null);

  // AI Chat hook
  const {
    messages: aiMessages,
    sendMessage: aiSendMessage,
    status,
  } = useChat({
    id: conversationId || undefined,
    transport: new DefaultChatTransport({
      api: `${
        (import.meta as any).env?.VITE_SERVER_URL || "http://localhost:3000"
      }/chat`,
    }),
    onFinish: ({ message }) => {
      if ((message as any).metadata?.conversationId) {
        setConversationId((message as any).metadata.conversationId);
      }
    },
  });

  // Transform AI messages to our format
  const transformMessage = useCallback(
    (message: Message): TransformedMessage => {
      const textPart = message.parts.find(
        (p: MessagePart) => p.type === "text"
      ) as { type: "text"; text: string } | undefined;
      const reasoningPart = message.parts.find(
        (p: MessagePart) => p.type === "reasoning"
      ) as { type: "reasoning"; text: string } | undefined;

      return {
        _id: message.id as string,
        content: textPart?.text || "",
        role: message.role as "user" | "assistant",
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
    },
    []
  );

  // Combined messages (initial + AI messages)
  const messages = React.useMemo(() => {
    return [
      ...initialMessages,
      ...aiMessages.map((msg: any) => transformMessage(msg as Message)),
    ];
  }, [initialMessages, aiMessages, transformMessage]);

  // Screenshot capture
  const captureAndAddScreenshot = useCallback(async (): Promise<boolean> => {
    if (!screenshotEnabled) return false;

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
  }, [screenshotEnabled]);

  // Convert blob URL to data URL
  const convertBlobUrlToDataUrl = useCallback(
    async (url: string): Promise<string> => {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    },
    []
  );

  // Send message
  const sendMessage = useCallback(async () => {
    if (!user) {
      alert("You must be logged in to chat.");
      return;
    }

    const hasText = text.trim().length > 0;
    const hasAttachments = attachments.length > 0;
    if (!(hasText || hasAttachments)) return;

    // Generate conversation ID on first message
    if (messages.length === 0 && !conversationId) {
      const newId = nanoid();
      setConversationId(newId);
      chatIdRef.current = newId;
    }

    setIsSubmitting(true);

    try {
      // Capture screenshot if enabled
      await captureAndAddScreenshot();
      await new Promise((r) => setTimeout(r, 100));

      // Get final attachments
      let finalAttachments: File[] = [];
      await new Promise<void>((resolve) => {
        setAttachments((prev) => {
          finalAttachments = prev;
          resolve();
          return prev;
        });
      });

      // Convert attachments to data URLs
      const convertedFiles = await Promise.all(
        finalAttachments.map(async (file) => {
          const url = URL.createObjectURL(file);
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

      // Send the message
      await aiSendMessage(
        {
          text: text.trim() || "Sent with attachments",
          files: convertedFiles,
        },
        {
          body: {
            model,
            webSearch: useWebSearch,
            userId: user.id,
            conversationId: conversationId || chatIdRef.current,
          },
        }
      );

      setText("");
      setAttachments([]);
    } catch (error) {
      console.error("Error in sendMessage:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    user,
    text,
    attachments,
    messages.length,
    conversationId,
    captureAndAddScreenshot,
    convertBlobUrlToDataUrl,
    aiSendMessage,
    model,
    useWebSearch,
  ]);

  // File handling
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
      }
    },
    []
  );

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
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
    },
    []
  );

  // Message actions
  const handleEdit = useCallback((messageId: string, content: string) => {
    console.log("Edit message:", messageId, content);
    // TODO: Implement message editing
  }, []);

  const handleRegenerate = useCallback(() => {
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");
    if (!lastUserMessage) return;

    // Find the original message parts for regeneration
    const originalMessage = aiMessages.find(
      (m) => m.id === lastUserMessage._id
    );
    if (!originalMessage) return;

    const textContent = originalMessage.parts.find(
      (p: MessagePart) => p.type === "text"
    ) as { type: "text"; text: string } | undefined;

    if (textContent?.type === "text") {
      aiSendMessage(
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
  }, [
    messages,
    aiMessages,
    aiSendMessage,
    model,
    useWebSearch,
    user?.id,
    conversationId,
  ]);

  // Conversation management
  const startNewChat = useCallback(() => {
    setConversationId(null);
    setInitialMessages([]);
    setText("");
    setAttachments([]);
    chatIdRef.current = null;
  }, []);

  const loadConversation = useCallback(
    async (id: string) => {
      if (!id) return;

      try {
        setIsLoadingMessages(true);
        const response = await fetch(
          `${
            (import.meta as any).env?.VITE_SERVER_URL || "http://localhost:3000"
          }/api/messages/${id}`
        );
        if (response.ok) {
          const data = await response.json();
          const transformedMessages = (data.messages || []).map(
            transformMessage
          );
          setInitialMessages(transformedMessages);
          setConversationId(id);
        }
      } catch (error) {
        console.error("Error loading messages:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [transformMessage]
  );

  const contextValue: ChatContextType = {
    // Messages
    messages,
    initialMessages,
    isLoadingMessages,

    // Chat state
    conversationId,
    isSubmitting,
    status,

    // Input state
    text,
    setText,
    attachments,
    setAttachments,

    // Settings
    model,
    setModel,
    useWebSearch,
    setUseWebSearch,
    screenshotEnabled,
    setScreenshotEnabled,

    // Actions
    sendMessage,
    handleFileSelect,
    removeAttachment,
    handlePaste,
    captureAndAddScreenshot,
    startNewChat,
    loadConversation,

    // Message actions
    handleEdit,
    handleRegenerate,
  };

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
