import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useScreenshot } from "@/components/floating-menu/menu";
import { ImageViewer } from "@/components/chat-components/image-viewer";
import { ChatInput } from "@/components/chat-components/chat-input";
import { useApp } from "@/hooks/useApp";
import { useWindowResize } from "@/hooks/useWindow";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ChatPopover } from "@/components/chat-components/chat-popover";
import { ChatMessages } from "@/components/chat-components/ChatMessages";
import { nanoid } from "nanoid";

export const Route = createFileRoute("/chat/$chatId")({
  component: ChatPage,
  validateSearch: (search: Record<string, unknown>) => ({
    initialMessage: (search.initialMessage as string) || undefined,
    screenshotData: (search.screenshotData as ScreenshotImage[]) || undefined,
  }),
});

export interface ScreenshotImage {
  id: string;
  name: string;
  base64: string;
  type: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  images?: ScreenshotImage[];
  parts?: any[];
}

function ChatPage() {
  const { chatId } = Route.useParams();
  const { initialMessage, screenshotData } = Route.useSearch();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [screenshotImages, setScreenshotImages] = useState<ScreenshotImage[]>(
    screenshotData || []
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(
    chatId
  );
  const [hasProcessedInitialMessage, setHasProcessedInitialMessage] =
    useState(false);
  const { screenshotEnabled } = useScreenshot();
  const { isHidden } = useApp();
  const { resizeWindow } = useWindowResize();

  const {
    messages: aiMessages,
    sendMessage,
    status,
  } = useChat({
    transport: new DefaultChatTransport({
      api: `${
        (import.meta as any).env.VITE_SERVER_URL || "http://localhost:3000"
      }/ai`,
      fetch: async (input, init) => {
        // Add conversationId to the request body
        const body = init?.body ? JSON.parse(init.body as string) : {};
        if (conversationId) {
          body.conversationId = conversationId;
        }

        const response = await fetch(input as any, {
          ...(init || {}),
          credentials: "include",
          body: JSON.stringify(body),
        });

        // Extract conversationId from response headers
        const convId = response.headers.get("X-Conversation-Id");
        if (convId && convId !== conversationId) {
          setConversationId(convId);
        }

        return response;
      },
    }),
  });

  const handleScreenshot = (base64: string) => {
    const newImage: ScreenshotImage = {
      id: Date.now().toString(),
      name: `screenshot_${Date.now()}.png`,
      base64,
      type: "image/png",
    };
    setScreenshotImages((prev) => [...prev, newImage]);
  };

  const handleRemoveScreenshot = (id: string) => {
    setScreenshotImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const convertScreenshotImagesToParts = useCallback(async () => {
    if (screenshotImages.length === 0) return [];
    return screenshotImages.map((img) => ({
      type: "file" as const,
      url: `data:image/png;base64,${img.base64}`,
      mediaType: "image/png",
      filename: img.name,
    }));
  }, [screenshotImages]);

  const handleSubmitWithExpand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() && screenshotImages.length === 0) return;

    setIsSubmitting(true);

    // Expand the chat first
    if (!isExpanded) {
      setIsExpanded(true);
      resizeWindow(true);
    }

    // Adiciona a mensagem do usuário imediatamente
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: input.trim(),
        timestamp: new Date(),
      },
      {
        id: `assistant-${Date.now()}`, // placeholder da IA
        role: "assistant",
        content: "", // vazio no começo
        timestamp: new Date(),
        parts: [],
      },
    ]);

    try {
      const fileParts = await convertScreenshotImagesToParts();

      await sendMessage({
        text: input.trim() || "Sent with attachments",
        files: fileParts,
      });

      setInput("");
      setScreenshotImages([]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const transformMessage = useCallback((message: any): Message => {
    const textPart = message.parts?.find(
      (p: any) => p.type === "text" && typeof p.text === "string"
    ) as { type: "text"; text: string } | undefined;

    const content = textPart?.text || message.content || "";

    // Extrai imagens, se houver
    const imageParts = (message.parts || []).filter(
      (p: any) => p.type === "file" && p.mediaType?.startsWith("image/")
    );

    const imageData =
      imageParts.length > 0 ? imageParts[0].url?.split(",")[1] : undefined;

    return {
      id: message.id as string,
      content: content,
      role: message.role as "user" | "assistant",
      timestamp: new Date(),
      images: imageData
        ? [
            {
              id: message.id,
              name: "image",
              base64: imageData,
              type: "image/png",
            },
          ]
        : undefined,
      parts: message.parts,
    };
  }, []);

  // Send initial message if provided
  useEffect(() => {
    if (initialMessage && !isSubmitting && !hasProcessedInitialMessage) {
      const sendInitialMessage = async () => {
        setIsSubmitting(true);
        setHasProcessedInitialMessage(true);

        // Expand the chat when sending initial message
        if (!isExpanded) {
          setIsExpanded(true);
          resizeWindow(true);
        }

        try {
          const fileParts = await convertScreenshotImagesToParts();
          await sendMessage({
            text: initialMessage,
            files: fileParts,
          });
        } catch (err) {
          console.error("Failed to send initial message:", err);
        } finally {
          setIsSubmitting(false);
        }
      };
      sendInitialMessage();
    }
  }, [
    initialMessage,
    isSubmitting,
    hasProcessedInitialMessage,
    isExpanded,
    sendMessage,
    convertScreenshotImagesToParts,
    resizeWindow,
  ]);

  // atualiza messages sempre que aiMessages mudar
  useEffect(() => {
    const transformed = aiMessages.map(transformMessage);
    setMessages(transformed);
  }, [aiMessages, transformMessage]);

  useEffect(() => {
    setMessages((prev) => {
      // substitui a última mensagem assistant placeholder pelo streaming atual
      const newMessages = prev.map((msg) => {
        if (msg.role === "assistant" && msg.content === "") {
          // pegar conteúdo da IA
          const latestAiMessage = aiMessages[aiMessages.length - 1];
          const textPart = latestAiMessage?.parts?.find(
            (p: any) => p.type === "text" && typeof p.text === "string"
          );
          return { ...msg, content: (textPart as any)?.text || "" };
        }
        return msg;
      });
      return newMessages;
    });
  }, [aiMessages]);

  return (
    <div className="w-screen h-screen flex flex-col items-center ">
      <div className="bg-background rounded-3xl border max-h-[150px] w-full max-w-xl p-4">
        <ImageViewer
          images={screenshotImages}
          onRemove={handleRemoveScreenshot}
        />
        <ChatInput
          onScreenshot={handleScreenshot}
          images={screenshotImages}
          value={input}
          onChange={handleInputChange}
          onSubmit={handleSubmitWithExpand}
          isLoading={isSubmitting || status === "streaming"}
        />
      </div>

      {(isExpanded || messages.length > 0) && (
        <div className="flex-1 mt-4 border rounded-3xl bg-background w-full overflow-y-auto">
          <ChatMessages
            messages={messages}
            onClose={() => {
              setIsExpanded(false);
              resizeWindow(false);
              // Reset the chat by navigating to a new chat ID
              const newChatId = nanoid();
              navigate({
                to: "/chat/$chatId",
                params: { chatId: newChatId },
                search: {
                  initialMessage: undefined,
                  screenshotData: [],
                },
              });
            }}
          />
        </div>
      )}
    </div>
  );
}
