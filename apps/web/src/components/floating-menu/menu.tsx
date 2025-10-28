"use client";

import React, { createContext, useContext } from "react";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import FloatingMenuBar from "./FloatingMenuBar";
import LiveInsightsPanel from "./LiveInsightsPanel";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { authClient } from "@/lib/auth-client";
import { nanoid } from "nanoid";
import {
  useInteractiveRefs,
  useClickThroughWindow,
} from "@/hooks/useInteractive";

// Create context for screenshot state
const ScreenshotContext = createContext<{
  screenshotEnabled: boolean;
  setScreenshotEnabled: (enabled: boolean) => void;
}>({
  screenshotEnabled: true,
  setScreenshotEnabled: () => {},
});

export const useScreenshot = () => useContext(ScreenshotContext);

export default function Menu({ children }: { children: React.ReactNode }) {
  const [showInsights, setShowInsights] = useState(false);
  const [showAskInput, setShowAskInput] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(
    undefined
  );
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [screenshotEnabled, setScreenshotEnabled] = useState(true);
  const { data: session } = authClient.useSession();

  // Debug: Log screenshot state
  console.log("Menu - screenshotEnabled:", screenshotEnabled);

  // Refs for interactive elements
  const containerRef = useRef<HTMLDivElement>(null);
  const insightsRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const askInputRef = useRef<HTMLDivElement>(null);

  // Enable click-through for the entire window by default
  useClickThroughWindow();

  // CRITICAL: Make all UI elements interactive (not click-through)
  // This hook will automatically enable/disable click-through based on mouse position
  useInteractiveRefs([
    containerRef,
    menuRef,
    insightsRef,
    chatRef,
    askInputRef,
  ]);

  const { messages, sendMessage } = useChat({
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
    onFinish: async () => {},
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow dragging on the drag handle (GripVertical button)
    const target = e.target as HTMLElement;
    const isDragHandle = target.closest("[data-drag-handle]");

    if (!isDragHandle) {
      return;
    }

    // Prevent default behavior
    e.preventDefault();
    e.stopPropagation();

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // Always use current position for drag start calculation
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // Calculate new position based on current mouse position and drag start offset
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;

        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      if (!isDragging) return;

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
      // Prevent text selection during drag
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
    } else {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging, dragStart, position]);

  const handleAskQuestion = async () => {
    if (!question.trim()) return;
    setIsLoading(true);
    try {
      // Generate a new chat ID and navigate to chat page
      const chatId = nanoid();
      window.location.href = `/chat/${chatId}?initialMessage=${encodeURIComponent(
        question.trim()
      )}`;
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 w-screen h-screen z-50"
      style={{
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: isDragging ? "none" : "auto",
      }}
    >
      <motion.div
        ref={containerRef}
        className="absolute"
        onMouseDown={handleMouseDown}
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
            screenshotEnabled={screenshotEnabled}
            onToggleScreenshot={() => setScreenshotEnabled(!screenshotEnabled)}
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
            <ScreenshotContext.Provider
              value={{
                screenshotEnabled,
                setScreenshotEnabled,
              }}
            >
              {children}
            </ScreenshotContext.Provider>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
