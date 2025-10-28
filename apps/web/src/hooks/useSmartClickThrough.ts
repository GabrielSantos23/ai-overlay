import { useEffect, useCallback, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

/**
 * Hook that implements smart click-through behavior
 * Detects if cursor is over interactive UI elements vs transparent background
 */
export const useSmartClickThrough = () => {
  const appWindow = getCurrentWindow();
  const isOverUIRef = useRef(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  const updateClickThrough = useCallback(
    async (isOverUI: boolean) => {
      // Debounce rapid changes
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = setTimeout(async () => {
        try {
          await appWindow.setIgnoreCursorEvents(!isOverUI);
          isOverUIRef.current = isOverUI;
        } catch (error) {
          console.error("Failed to update click-through:", error);
        }
      }, 10);
    },
    [appWindow],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Check if mouse is over any UI element
      const element = document.elementFromPoint(e.clientX, e.clientY);

      if (!element) {
        updateClickThrough(false);
        return;
      }

      // Check if element or any parent has UI markers
      const isUI = !!(
        element.closest("[data-interactive]") ||
        element.closest("button") ||
        element.closest("input") ||
        element.closest("textarea") ||
        element.closest("select") ||
        element.closest('[role="button"]') ||
        element.closest('[role="dialog"]') ||
        element.closest(".ui-element") || // Custom class for UI
        // Check if element has visible background
        hasVisibleBackground(element)
      );

      if (isUI !== isOverUIRef.current) {
        updateClickThrough(isUI);
      }
    };

    // Add global mouse move listener
    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [updateClickThrough]);

  return { updateClickThrough };
};

/**
 * Helper function to check if element has visible background
 */
function hasVisibleBackground(element: Element): boolean {
  const style = window.getComputedStyle(element);
  const bg = style.backgroundColor;

  // Check if background is not transparent
  if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
    // Check alpha channel
    const match = bg.match(/rgba?\([\d\s,]+,?\s*([\d.]+)?\)/);
    if (match) {
      const alpha = match[1] ? parseFloat(match[1]) : 1;
      return alpha > 0.1; // Consider visible if alpha > 0.1
    }
    return true;
  }

  return false;
}
