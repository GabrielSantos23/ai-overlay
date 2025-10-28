import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useScreenshot } from "@/components/floating-menu/menu";
import { ImageViewer } from "@/components/chat-components/image-viewer";
import { ChatInput } from "@/components/chat-components/chat-input";
import { useApp } from "@/hooks/useApp";
import { useWindowResize } from "@/hooks/useWindow";
import { nanoid } from "nanoid";

export const Route = createFileRoute("/chat/")({
  component: ChatEntryPage,
});

export interface ScreenshotImage {
  id: string;
  name: string;
  base64: string;
  type: string;
}

function ChatEntryPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [screenshotImages, setScreenshotImages] = useState<ScreenshotImage[]>(
    [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { screenshotEnabled } = useScreenshot();
  const { isHidden } = useApp();
  const { resizeWindow } = useWindowResize();

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

  const convertScreenshotImagesToParts = async () => {
    if (screenshotImages.length === 0) return [];
    return screenshotImages.map((img) => ({
      type: "file" as const,
      url: `data:image/png;base64,${img.base64}`,
      mediaType: "image/png",
      filename: img.name,
    }));
  };

  const handleSubmitWithExpand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() && screenshotImages.length === 0) return;

    setIsSubmitting(true);

    try {
      // Generate a new chat ID
      const chatId = nanoid();

      // Navigate to the chat page with the new ID
      navigate({
        to: "/chat/$chatId",
        params: { chatId },
        search: {
          initialMessage: input.trim() || "Sent with attachments",
          screenshotData: screenshotImages.length > 0 ? screenshotImages : [],
        },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center">
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
          isLoading={isSubmitting}
        />
      </div>
    </div>
  );
}
