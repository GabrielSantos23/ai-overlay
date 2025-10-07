import { Annoyed, GripVertical, HatGlasses, X } from "lucide-react";
import { Button } from "../ui/button";
import { SiAudiomack } from "react-icons/si";
import { TfiText } from "react-icons/tfi";
import { useState, useEffect, useRef } from "react";
import { Kbd, KbdGroup } from "../ui/kbd";
import {
  DndContext,
  useDraggable,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import PulseCircle from "../ui/puilseCicle";
import ListeningButtons from "../ui/listening-buttons";
import { useListening } from "../../hooks/useListening";

export const tooltipStyle =
  "absolute top-full left-1/2 transform -translate-x-1/2 mt-2 border border-muted-foreground/50  rounded-xl px-3 py-1.5 text-xs z-[9999] pointer-events-auto shadow-lg animate-in fade-in-0 zoom-in-95 whitespace-nowrap bg-primary-foreground";

export const xTooltipStyle =
  "absolute   left-7 transform -translate-y-1/2 ml-2 border border-muted-foreground/50 rounded-xl px-3 py-1.5 text-xs z-[9999] pointer-events-auto shadow-lg animate-in fade-in-0 zoom-in-95 whitespace-nowrap bg-primary-foreground";

function DraggableFloatingMenu({
  position,
  isDragging = false,
}: {
  position: { x: number; y: number };
  isDragging?: boolean;
}) {
  const [buttonHovered, setButtonHovered] = useState(false);
  const [menuHovered, setMenuHovered] = useState(false);
  const [askQuestionOpen, setAskQuestionOpen] = useState(false);
  const [hatGlassesOpen, setHatGlassesOpen] = useState(false);
  const [xButtonHovered, setXButtonHovered] = useState(false);
  const [showXButton, setShowXButton] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const {
    state,
    isLoading,
    isActive,
    isPaused,
    startListening,
    togglePlayPause,
    showInsights,
    finishListening,
  } = useListening();

  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isDraggingInternal,
  } = useDraggable({
    id: "floating-menu",
  });

  const isActuallyDragging = isDragging || isDraggingInternal;

  const style = {
    transform: `translate3d(${position.x + (transform?.x || 0)}px, ${
      position.y + (transform?.y || 0)
    }px, 0)`,
    opacity: isActuallyDragging ? 0.8 : 1,
    transition: isActuallyDragging ? "none" : "opacity 0.2s ease",
  };

  if (minimized) {
    return null;
  }

  useEffect(() => {
    if (menuHovered || xButtonHovered) {
      setShowXButton(true);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    } else {
      hideTimeoutRef.current = setTimeout(() => {
        setShowXButton(false);
      }, 150);
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [menuHovered, xButtonHovered]);

  const handleButtonEnter = () => setButtonHovered(true);
  const handleButtonLeave = () => setButtonHovered(false);

  const contentBg = !buttonHovered
    ? "group-hover:bg-primary/10 group-hover:rounded-l-full"
    : "";

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="relative flex items-center justify-center"
        onMouseEnter={() => setMenuHovered(true)}
        onMouseLeave={() => setMenuHovered(false)}
      >
        <div className="flex items-center justify-center  border backdrop-blur-sm rounded-full bg-background/60">
          <div className="flex group">
            <div
              className={`flex items-center gap-2 transition-colors rounded-l-full ${contentBg}`}
            >
              <div className="">
                <Annoyed className="h-6 w-6 mx-1 text-foreground" />
              </div>
              {state === "idle" || state === "loading" ? (
                <Button
                  variant="default"
                  size="sm"
                  className="px-2 m-0 bg-[#072452] text-primary py-0 border-[#196acc] hover:bg-[#072452] border text-xs rounded-full"
                  onMouseEnter={handleButtonEnter}
                  onMouseLeave={handleButtonLeave}
                  onClick={startListening}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <PulseCircle size="sm" className="" />
                  ) : (
                    <SiAudiomack className="h-4 w-4" />
                  )}
                  <span className="text-xs">
                    {isLoading ? "Starting..." : "Listen"}
                  </span>
                </Button>
              ) : (
                <ListeningButtons
                  onPlayPause={togglePlayPause}
                  onInsights={showInsights}
                  onDone={finishListening}
                  isPlaying={isActive}
                  isPaused={isPaused}
                />
              )}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-xs rounded-full"
                  onMouseEnter={() => {
                    handleButtonEnter();
                    console.log("Ask question button hovered");
                    setAskQuestionOpen(true);
                  }}
                  onMouseLeave={() => {
                    handleButtonLeave();
                    setAskQuestionOpen(false);
                  }}
                >
                  <TfiText className="h-4 w-4" />
                  <span className="text-[11px]">Ask question</span>
                </Button>
                {askQuestionOpen && (
                  <div className={tooltipStyle}>
                    Ask about anything on your screen{" "}
                    <KbdGroup className="">
                      {" "}
                      <Kbd className="bg-muted rounded-md text-sm border">
                        ⌃
                      </Kbd>{" "}
                      <Kbd className="bg-muted rounded-md text-sm border">
                        ↵
                      </Kbd>
                    </KbdGroup>
                  </div>
                )}
              </div>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-10 w-10 flex items-center justify-center"
                  onMouseEnter={() => {
                    handleButtonEnter();
                    setHatGlassesOpen(true);
                  }}
                  onMouseLeave={() => {
                    handleButtonLeave();
                    setHatGlassesOpen(false);
                  }}
                >
                  <HatGlasses className="h-7 w-7" />
                </Button>
                {hatGlassesOpen && (
                  <div className={tooltipStyle}>
                    Current invisible. Click to make visible
                  </div>
                )}
              </div>
              <div className="h-10 w-[0.5px] bg-muted-foreground/20" />
            </div>
          </div>
          <div
            className={`p-0 rounded-r-full ml-0 h-10 w-10 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-accent/50 transition-colors select-none ${
              isActuallyDragging ? "bg-accent/30" : ""
            }`}
            {...listeners}
            {...attributes}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseUp={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            tabIndex={-1}
            style={{ touchAction: "none" }}
          >
            <GripVertical
              className={`h-7 w-7 ${
                isActuallyDragging ? "text-accent-foreground" : ""
              }`}
            />
          </div>
        </div>

        {showXButton && (
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -right-7 -top-3 h-6 w-6 border border-border rounded-full bg-background hover:bg-accent transition-all duration-200 z-50"
              onClick={() => setMinimized(true)}
              onMouseEnter={() => setXButtonHovered(true)}
              onMouseLeave={() => setXButtonHovered(false)}
            >
              <X className="h-2 w-2" />
            </Button>
            {xButtonHovered && (
              <div className={xTooltipStyle}>Close floating menu</div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function FloatingMenu() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { delta } = event;
    if (delta) {
      setPosition((prev) => ({
        x: prev.x + delta.x,
        y: prev.y + delta.y,
      }));
    }
    setActiveId(null);
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <DraggableFloatingMenu
        position={position}
        isDragging={activeId === "floating-menu"}
      />
      <DragOverlay>
        {activeId ? (
          <div className="opacity-50">
            <DraggableFloatingMenu position={position} isDragging={true} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
