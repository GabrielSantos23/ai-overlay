import { useEffect, useState } from "react";
// import { useTitles, useSystemAudio } from "@/hooks";
import { listen } from "@tauri-apps/api/event";
import { getShortcutsConfig, initializeShortcutsIfNeeded } from "@/lib/storage";
import { invoke } from "@tauri-apps/api/core";
import { checkForAppUpdate } from "@/lib/updater";

export const useApp = () => {
  // const systemAudio = useSystemAudio();
  const [isHidden, setIsHidden] = useState(false);
  // Initialize title management
  // useTitles();

  // Initialize shortcuts from localStorage on app startup
  useEffect(() => {
    const initializeShortcuts = async () => {
      try {
        // Make sure shortcuts are initialized in localStorage
        initializeShortcutsIfNeeded();

        // Get and send shortcuts config to the Rust backend
        const config = getShortcutsConfig();
        await invoke("update_shortcuts", { config });
        console.log("Shortcuts initialized successfully");
      } catch (error) {
        console.error("Failed to initialize shortcuts:", error);
      }
    };

    initializeShortcuts();
  }, []);

  // Check for application updates on startup
  useEffect(() => {
    checkForAppUpdate();
  }, []);

  // Migrate localStorage chat history to SQLite on app startup
  // useEffect(() => {
  //   const runMigration = async () => {
  //     try {
  //       // Early exit: Check if migration already completed
  //       const migrationKey = "chat_history_migrated_to_sqlite";
  //       const alreadyMigrated =
  // safeLocalStorage.getItem(migrationKey) === "true";

  // if (alreadyMigrated) {
  //   return; // Migration already complete, skip
  // }

  // const result = await migrateLocalStorageToSQLite();

  // if (result.success) {
  //   if (result.migratedCount > 0) {
  //     console.log(
  //       `Successfully migrated ${result.migratedCount} conversations to SQLite`,
  //     );
  //   }
  // } else if (result.error) {
  //   // Migration failed - log error
  //   console.error("Migration error:", result.error);
  // }
  // } catch (error) {
  //   // Critical error during migration
  //   console.error("Critical migration failure:", error);
  // }
  //   };
  //   runMigration();
  // }, []);

  const handleSelectConversation = (conversation: any) => {
    // useCompletion will fetch the full conversation from SQLite by id
    window.dispatchEvent(
      new CustomEvent("conversationSelected", {
        detail: { id: conversation.id },
      })
    );
  };

  const handleNewConversation = () => {
    // Trigger new conversation event
    window.dispatchEvent(new CustomEvent("newConversation"));
  };

  // WINDOWS HIDE/SHOW TOGGLE WINDOW WORKAROUND FOR SHORTCUTS
  useEffect(() => {
    const unlistenPromise = listen<boolean>(
      "toggle-window-visibility",
      (event) => {
        const platform = navigator.platform.toLowerCase();
        if (typeof event.payload === "boolean" && platform.includes("win")) {
          console.log("[toggle-window-visibility] payload:", event.payload, "isHidden before:", isHidden);
          setIsHidden(!event.payload);
          setTimeout(() => { console.log("[toggle-window-visibility] isHidden after:", isHidden); }, 0);
          // find popover open and close it
          const popover = document.getElementById("popover-content");
          // set display to none, change data-state to closed
          if (popover) {
            popover.style.setProperty("display", "none", "important");
            // update the data-state to closed
            popover.setAttribute("data-state", "closed");

            // Also find and update the popover trigger's data-state
            const popoverTriggers = document.querySelectorAll(
              '[data-slot="popover-trigger"]'
            );
            popoverTriggers.forEach((trigger) => {
              trigger.setAttribute("data-state", "closed");
            });
          }
        }
      }
    );

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  return {
    isHidden,
    setIsHidden,
    handleSelectConversation,
    handleNewConversation,
    // systemAudio,
  };
};
