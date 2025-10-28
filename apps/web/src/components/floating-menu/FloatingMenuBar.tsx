"use client";
import { Button } from "@/components/ui/button";
import {
  Grid3x3,
  Eye,
  RotateCcw,
  MessageSquare,
  EyeOff,
  GripVertical,
  X,
  Camera,
  CameraOff,
} from "lucide-react";
import { motion } from "framer-motion";
import type React from "react";
import { useState } from "react";
import { GrHomeRounded } from "react-icons/gr";
type FloatingMenuBarProps = {
  onToggleInsights: () => void;
  onToggleAskInput: () => void;
  onMouseDownDrag: (e: React.MouseEvent) => void;
  isDragging: boolean;
  showInsights: boolean;
  screenshotEnabled: boolean;
  onToggleScreenshot: () => void;
};
export default function FloatingMenuBar({
  onToggleInsights,
  onToggleAskInput,
  onMouseDownDrag,
  isDragging,
  showInsights,
  screenshotEnabled,
  onToggleScreenshot,
}: FloatingMenuBarProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Debug: Log screenshot state
  console.log("FloatingMenuBar - screenshotEnabled:", screenshotEnabled);
  return (
    <div className="group flex items-center gap-x-3">
      <motion.div
        className="bg-background/70 rounded-full px-2 py-1 flex items-center gap-2
                   shadow-2xl border border-muted- w-fit shrink-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div>
          <Button
            onClick={onToggleInsights}
            className="no-drag rounded-full px-4 h-7 gap-2 font-medium text-xs "
            style={{
              background: "linear-gradient(to bottom, #0441a3, #062b66)",
            }}
          >
            Start Listening
          </Button>
        </div>
        <div>
          <Button
            variant="ghost"
            size="icon"
            className={`no-drag h-8 w-8 rounded-full hover:bg-[#4a4a4a] ${
              screenshotEnabled
                ? "text-green-500 hover:text-green-400"
                : "text-[#b0b0b0] hover:text-white"
            }`}
            onClick={onToggleScreenshot}
            title={
              screenshotEnabled
                ? "Disable screenshot capture"
                : "Enable screenshot capture"
            }
          >
            {screenshotEnabled ? (
              <Camera className="h-4 w-4" />
            ) : (
              <CameraOff className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="h-6 w-px bg-[#5a5a5a]" />
        <div>
          <Button
            variant="ghost"
            size="icon"
            onMouseDown={onMouseDownDrag}
            data-drag-handle
            className="no-drag h-8 w-8 rounded-full hover:bg-[#4a4a4a] text-[#b0b0b0] hover:text-white cursor-grab"
          >
            <GripVertical className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      <div
        className="bg-background/70 rounded-full border border-muted
                   opacity-0 pointer-events-none transition-opacity duration-150
                   group-hover:opacity-100 group-hover:pointer-events-auto"
      >
        <Button
          variant="ghost"
          size="icon"
          className="no-drag h-8 w-8 rounded-full hover:bg-[#4a4a4a] text-white group"
          // onClick={}
        >
          <X
            className="h-3 w-3 group-hover:fill-white fill-muted-foreground text-muted-foreground group-hover:text-white"
            style={{ width: "17px", height: "17px" }}
          />
        </Button>
      </div>
    </div>
  );
}
