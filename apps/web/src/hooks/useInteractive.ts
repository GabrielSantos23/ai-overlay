import { useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

/**
 * Hook to enable click-through for the entire window except for specific interactive elements
 * This allows users to interact with apps behind the overlay
 */
export const useClickThroughWindow = () => {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const appWindow = getCurrentWindow();

    // Enable click-through by default
    appWindow.setIgnoreCursorEvents(true).catch((error) => {
      console.error("Failed to enable click-through:", error);
    });

    return () => {
      // Disable click-through when component unmounts
      appWindow.setIgnoreCursorEvents(false).catch((error) => {
        console.error("Failed to disable click-through:", error);
      });
    };
  }, []);
};

/**
 * Hook to make a specific element interactive in a click-through overlay
 * Works with Tauri's window API
 *
 * Usage:
 * const buttonRef = useInteractive();
 * return <button ref={buttonRef}>Click Me</button>
 */
export const useInteractive = <T extends HTMLElement = HTMLElement>() => {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    const element = elementRef.current;

    if (!element || typeof window === "undefined") {
      return;
    }

    const appWindow = getCurrentWindow();

    const handleMouseEnter = async () => {
      // Disable click-through when mouse enters this element
      try {
        await appWindow.setIgnoreCursorEvents(false);
      } catch (error) {
        console.error("Failed to disable click-through:", error);
      }
    };

    const handleMouseLeave = async () => {
      // Re-enable click-through when mouse leaves this element
      try {
        await appWindow.setIgnoreCursorEvents(true);
      } catch (error) {
        console.error("Failed to enable click-through:", error);
      }
    };

    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return elementRef;
};

/**
 * Hook to make multiple refs interactive at once
 * Useful when you have separate refs you need to track
 *
 * Usage:
 * const menuRef = useRef(null);
 * const chatRef = useRef(null);
 * useInteractiveRefs([menuRef, chatRef]);
 */
export const useInteractiveRefs = (
  refs: React.RefObject<HTMLElement | null>[]
) => {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const appWindow = getCurrentWindow();

    const handleMouseEnter = async () => {
      try {
        await appWindow.setIgnoreCursorEvents(false);
      } catch (error) {
        console.error("Failed to disable click-through:", error);
      }
    };

    const handleMouseLeave = async () => {
      try {
        await appWindow.setIgnoreCursorEvents(true);
      } catch (error) {
        console.error("Failed to enable click-through:", error);
      }
    };

    const elements: HTMLElement[] = [];

    // Attach listeners to all refs
    refs.forEach((ref) => {
      if (ref.current) {
        elements.push(ref.current);
        ref.current.addEventListener("mouseenter", handleMouseEnter);
        ref.current.addEventListener("mouseleave", handleMouseLeave);
      }
    });

    return () => {
      elements.forEach((element) => {
        element.removeEventListener("mouseenter", handleMouseEnter);
        element.removeEventListener("mouseleave", handleMouseLeave);
      });
    };
  }, [refs]);
};

/**
 * Hook to control click-through state manually
 * Useful for complex interactions where you need fine-grained control
 *
 * Usage:
 * const { enableClickThrough, disableClickThrough } = useClickThroughControl();
 *
 * // Make window interactive
 * disableClickThrough();
 *
 * // Make window click-through again
 * enableClickThrough();
 */
export const useClickThroughControl = () => {
  const enableClickThrough = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.setIgnoreCursorEvents(true);
    } catch (error) {
      console.error("Failed to enable click-through:", error);
    }
  };

  const disableClickThrough = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.setIgnoreCursorEvents(false);
    } catch (error) {
      console.error("Failed to disable click-through:", error);
    }
  };

  return { enableClickThrough, disableClickThrough };
};
