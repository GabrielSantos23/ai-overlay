"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import FloatingMenuBar from "./FloatingMenuBar";
import LiveInsightsPanel from "./LiveInsightsPanel";
import AskInput from "./AskInput";
import ChatPanel from "./ChatPanel";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { authClient } from "@/lib/auth-client";
import { useWindowInteraction } from "@/hooks/useWindowInteraction";
import { ChatPanel2 } from "./ChatPanel2";

export default function Menu() {
  const [showInsights, setShowInsights] = useState(false);
  const [showAskInput, setShowAskInput] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const { data: session } = authClient.useSession();
  const containerRef = useRef<HTMLDivElement>(null);
  const insightsRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const askInputRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai",
      body: {
        userId: session?.user?.id,
        conversationId: conversationId,
      },
    }),
    onFinish: async () => {},
  });

  useWindowInteraction({
    showChat,
    showInsights,
    showAskInput,
    setShowInsights,
    setShowAskInput,
    menuRef,
    chatRef,
    insightsRef,
    askInputRef,
  });

  // NOTE: The old useCallback hooks for enableInteraction and disableInteraction
  // have been removed from here.

  const handleMouseDown = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (position.x === 0 && position.y === 0) {
        setPosition({ x: rect.left, y: rect.top });
        setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      } else {
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      }
    }
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    };
    const handleMouseUp = () => {
      setIsDragging(false);

      // Check if menu is outside viewport bounds and adjust
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let adjustedX = position.x;
        let adjustedY = position.y;

        // Check left edge
        if (rect.left < 0) {
          adjustedX = position.x - rect.left;
        }

        // Check right edge
        if (rect.right > viewportWidth) {
          adjustedX = position.x - (rect.right - viewportWidth);
        }

        // Check top edge
        if (rect.top < 0) {
          adjustedY = position.y - rect.top;
        }

        // Check bottom edge
        if (rect.bottom > viewportHeight) {
          adjustedY = position.y - (rect.bottom - viewportHeight);
        }

        // Update position if adjustments were made
        if (adjustedX !== position.x || adjustedY !== position.y) {
          setPosition({ x: adjustedX, y: adjustedY });
        }
      }
    };
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart, position]);

  const handleAskQuestion = async () => {
    if (!question.trim()) return;
    setIsLoading(true);
    try {
      await sendMessage({
        text: question.trim(),
      });
      setQuestion("");
      setShowAskInput(false);
      setShowChat(true);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      ref={containerRef}
      className="fixed z-50"
      style={{
        top: position.y === 0 ? "5rem" : `${position.y}px`,
        left: position.x === 0 ? "50%" : `${position.x}px`,
        transform: position.x === 0 ? "translateX(-50%)" : "none",
      }}
      animate={{ scale: isDragging ? 1.02 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div ref={menuRef}>
        <FloatingMenuBar
          onToggleInsights={() => setShowInsights(!showInsights)}
          onToggleAskInput={() => setShowAskInput(!showAskInput)}
          onMouseDownDrag={handleMouseDown}
          isDragging={isDragging}
          showInsights={showInsights}
        />
      </div>
      <div className="flex gap-3 mt-3 absolute left-1/2 translate-x-[-50%]">
        {showInsights && (
          <div ref={insightsRef}>
            <LiveInsightsPanel
              show={true}
              onClose={() => setShowInsights(false)}
            />
          </div>
        )}
        <div ref={chatRef}>
          <ChatPanel2 />
        </div>
        {/*{showAskInput && !showChat && (
          <div ref={askInputRef}>
            <AskInput
              show={true}
              question={question}
              setQuestion={setQuestion}
              onSubmit={handleAskQuestion}
            />
          </div>
        )}
        {showChat && (
          <div ref={chatRef}>
            <ChatPanel
              show={true}
              messages={messages.map((message) => ({
                id: message.id,
                role: message.role as "user" | "assistant",
                content: message.content,
              }))}
              isLoading={isLoading}
              onClose={() => {
                setShowChat(false);
              }}
            />
          </div>
        )}*/}
      </div>
    </motion.div>
  );
}
