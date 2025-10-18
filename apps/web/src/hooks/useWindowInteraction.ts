import { useEffect, useCallback, RefObject, useRef } from "react";

interface UseWindowInteractionProps {
  showChat: boolean;
  showInsights: boolean;
  showAskInput: boolean;
  setShowInsights: (value: boolean) => void;
  setShowAskInput: (value: boolean) => void;
  menuRef: RefObject<HTMLDivElement | null>;
  chatRef: RefObject<HTMLDivElement | null>;
  insightsRef: RefObject<HTMLDivElement | null>;
  askInputRef: RefObject<HTMLDivElement | null>;
}

export function useWindowInteraction({
  showChat,
  showInsights,
  showAskInput,
  setShowInsights,
  setShowAskInput,
  menuRef,
  chatRef,
  insightsRef,
  askInputRef,
}: UseWindowInteractionProps) {
  const enableInteraction = useCallback(() => {
    window.electronAPI?.setIgnoreMouseEvents(false);
  }, []);

  const disableInteraction = useCallback(() => {
    window.electronAPI?.setIgnoreMouseEvents(true, { forward: true });
  }, []);

  // Use a ref to track the most current hover state without causing re-renders.
  const isHoveringUIRef = useRef(false);

  useEffect(() => {
    // A single helper function to check if the pointer is over any visible UI.
    const isPointerOverUI = (e: MouseEvent) => {
      const visibleComponentRefs = [menuRef, chatRef]; // ChatPanel2 is always visible
      if (showInsights) visibleComponentRefs.push(insightsRef);
      if (showAskInput && !showChat) visibleComponentRefs.push(askInputRef);

      const isOverAnyComponent = visibleComponentRefs.some((ref) => {
        if (!ref.current) return false;
        const rect = ref.current.getBoundingClientRect();
        return (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        );
      });

      const isDialogOpen =
        document.querySelector("[data-radix-alert-dialog-portal]") !== null;

      return isOverAnyComponent || isDialogOpen;
    };

    // On every mouse move, update the hover state and toggle the window's interactivity.
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const isOverUI = isPointerOverUI(e);
      isHoveringUIRef.current = isOverUI;

      if (isOverUI) {
        enableInteraction();
      } else {
        disableInteraction();
      }
    };

    // This is the key: it "captures" the click event on the way down.
    const handleCaptureMouseDown = (e: MouseEvent) => {
      // Check our ref. If the mouse is NOT over the UI during the click, close menus.
      if (!isHoveringUIRef.current) {
        setShowInsights(false);
        if (!showChat) {
          setShowAskInput(false);
        }
      }
    };

    // Set the initial state.
    disableInteraction();

    document.addEventListener("mousemove", handleGlobalMouseMove);
    // Add the mousedown listener to the `window` in the "capture" phase (the `true` flag).
    // This ensures it runs before the click is ignored by the system.
    window.addEventListener("mousedown", handleCaptureMouseDown, true);

    // Cleanup function.
    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mousedown", handleCaptureMouseDown, true);
      enableInteraction(); // Always leave the window interactive.
    };
  }, [
    showChat,
    showInsights,
    showAskInput,
    setShowInsights,
    setShowAskInput,
    menuRef,
    chatRef,
    insightsRef,
    askInputRef,
    enableInteraction,
    disableInteraction,
  ]);
}
