import { useState, useCallback } from "react";

export type ListeningState = "idle" | "loading" | "active" | "paused" | "done";

export function useListening() {
  const [state, setState] = useState<ListeningState>("idle");
  const [isLoading, setIsLoading] = useState(false);

  const startListening = useCallback(async () => {
    if (state !== "idle") return;

    setState("loading");
    setIsLoading(true);

    // Mock loading delay (2-3 seconds)
    await new Promise((resolve) => setTimeout(resolve, 2500));

    setIsLoading(false);
    setState("active");
  }, [state]);

  const togglePlayPause = useCallback(() => {
    if (state === "active") {
      setState("paused");
    } else if (state === "paused") {
      setState("active");
    }
  }, [state]);

  const showInsights = useCallback(() => {
    // Mock insights functionality
    console.log("Showing live insights...");
    // In a real app, this would open insights panel or navigate to insights
  }, []);

  const finishListening = useCallback(() => {
    setState("done");
    // Mock cleanup
    setTimeout(() => {
      setState("idle");
    }, 1000);
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setIsLoading(false);
  }, []);

  return {
    state,
    isLoading,
    isIdle: state === "idle",
    isActive: state === "active",
    isPaused: state === "paused",
    isDone: state === "done",
    startListening,
    togglePlayPause,
    showInsights,
    finishListening,
    reset,
  };
}
