import { useRef, useState, useEffect } from "react";
import ListenButton from "./listen-button";
import AskQuestionButton from "./ask-question-button";
import VisibilityButton from "./visibilty-button";
import GridButton from "./grid-button";
import { ThemeToggle } from "./theme-toggle";
import Chat from "@/components/chat/Chat";
import { Button } from "../ui/button";
import { ChromeIcon } from "lucide-react";

interface MenuProps {
  askModal: boolean;
  setAskModal: (askModal: boolean) => void;
}

export default function Menu({ askModal, setAskModal }: MenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isBgMuted] = useState(false);
  const [chatHasMessages, setChatHasMessages] = useState(false);
  const lastMousePositionRef = useRef<{ x: number; y: number } | null>(null);
  // Mouse event handling is now managed by the parent App component
  // to prevent conflicts and duplicate event listeners

  return (
    <>
      <div
        className="relative flex items-center justify-center text-foreground pointer-events-auto"
        data-interactive="true"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <div className="bg-background rounded-full group h-10 flex items-center justify-center border-2">
          <div
            ref={containerRef}
            className={`flex items-center gap-2 h-full rounded-full transition-colors ${
              isBgMuted ? "bg-muted rounded-l-full rounded-r-none" : ""
            }`}
          >
            <div data-menu-btn="1" data-interactive="true">
              <Button
                variant="default"
                className="rounded-full bg-background text-primary border my-1 hover:bg-accent"
                onClick={async () => {
                  try {
                    const result = await window.electronAPI?.openappWindow?.();
                    if (result?.success) {
                      console.log("New window opened successfully");
                    } else {
                      console.error("Failed to open new window", result?.error);
                    }
                  } catch (e) {
                    console.error("Error opening new window", e);
                  }
                }}
              >
                <ChromeIcon />
              </Button>
            </div>
            <div data-menu-btn="1" data-interactive="true">
              <ListenButton />
            </div>
            <div data-menu-btn="1" data-interactive="true">
              <AskQuestionButton
                askModal={askModal}
                setAskModal={setAskModal}
              />
            </div>
            <div data-interactive="true">
              <VisibilityButton />
            </div>
          </div>
          <div className="flex items-center" data-interactive="true">
            <div className="h-10 w-[0.5px] bg-muted-foreground/20" />

            <GridButton />
          </div>
        </div>
        <div>
          <button
            className="bg-white text-black rounded-md p-2"
            data-interactive="true"
            onClick={async () => {
              try {
                const result = await window.electronAPI?.captureScreenshot?.();
                if (result?.ok) {
                  console.log("Screenshot saved to:", result.filePath);
                } else {
                  console.error("Screenshot failed", result?.error);
                }
              } catch (e) {
                console.error("Screenshot error", e);
              }
            }}
          >
            take a screenshot
          </button>
        </div>
      </div>
      {askModal && (
        <>
          {/* Transparent overlay to capture outside clicks */}
          <div
            className="fixed inset-0 z-30"
            data-interactive="true"
            onClick={() => {
              if (!chatHasMessages) setAskModal(false);
            }}
          />
          <div className="absolute top-10 mt-4 z-40">
            <Chat
              askModal={askModal}
              setAskModal={setAskModal}
              onHasMessagesChange={setChatHasMessages}
            />
          </div>
        </>
      )}
    </>
  );
}
