import React from "react";
import type { Message, ScreenshotImage } from "@/routes/chat";
import { ImageViewer } from "@/components/chat-components/image-viewer";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react"; // ícone de X

interface ChatMessagesProps {
  messages: Message[];
  onClose?: () => void; // função chamada ao clicar no X
}

const ChatMessageItem = ({ message }: { message: Message }) => {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-2 my-2 px-2 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[70%] p-3 rounded-xl break-words whitespace-pre-wrap
          ${isUser ? "bg-blue-500 text-white rounded-br-none" : "bg-gray-700 text-white rounded-bl-none"}
        `}
      >
        <div>{message.content}</div>

        {message.images && message.images.length > 0 && (
          <div className="mt-2">
            <ImageViewer
              images={message.images.map((img: ScreenshotImage) => ({
                ...img,
              }))}
              onRemove={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export const ChatMessages = ({ messages, onClose }: ChatMessagesProps) => {
  return (
    <div className="flex flex-col w-full h-full overflow-y-auto p-2 relative">
      {/* Botão fechar */}
      {onClose && (
        <button
          className="absolute top-2 right-2 p-1 hover:bg-gray-600 rounded-full text-white"
          onClick={onClose}
        >
          <XIcon className="h-4 w-4" />
        </button>
      )}
      {messages.map((msg) => (
        <ChatMessageItem key={msg.id} message={msg} />
      ))}

      {status === "streaming" && (
        <div className="px-2 py-1 text-gray-400 italic">
          IA está digitando...
        </div>
      )}
    </div>
  );
};
