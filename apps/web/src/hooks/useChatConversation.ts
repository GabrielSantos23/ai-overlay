import { useChatContext } from "../contexts/ChatContext";
import { useEffect } from "react";

export function useChatConversation() {
  const {
    startNewChat,
    loadConversation,
    conversationId,
    messages,
    isLoadingMessages,
  } = useChatContext();

  // Auto-start a new chat when the component mounts
  useEffect(() => {
    if (!conversationId && messages.length === 0) {
      startNewChat();
    }
  }, [conversationId, messages.length, startNewChat]);

  return {
    conversationId,
    messages,
    isLoadingMessages,
    startNewChat,
    loadConversation,
  };
}
