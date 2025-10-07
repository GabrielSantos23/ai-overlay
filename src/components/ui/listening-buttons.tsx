import { Play, Pause, Square } from "lucide-react";
import { Button } from "./button";

interface ListeningButtonsProps {
  onPlayPause: () => void;
  onInsights: () => void;
  onDone: () => void;
  isPlaying: boolean;
  isPaused: boolean;
  className?: string;
}

// Animated audio wave component
function AudioWave({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className="flex space-x-0.5">
        <div className="w-0.5 h-2 bg-current animate-pulse"></div>
        <div
          className="w-0.5 h-3 bg-current animate-pulse"
          style={{ animationDelay: "0.1s" }}
        ></div>
        <div
          className="w-0.5 h-1 bg-current animate-pulse"
          style={{ animationDelay: "0.2s" }}
        ></div>
        <div
          className="w-0.5 h-4 bg-current animate-pulse"
          style={{ animationDelay: "0.3s" }}
        ></div>
        <div
          className="w-0.5 h-2 bg-current animate-pulse"
          style={{ animationDelay: "0.4s" }}
        ></div>
        <div
          className="w-0.5 h-3 bg-current animate-pulse"
          style={{ animationDelay: "0.5s" }}
        ></div>
        <div
          className="w-0.5 h-1 bg-current animate-pulse"
          style={{ animationDelay: "0.6s" }}
        ></div>
        <div
          className="w-0.5 h-2 bg-current animate-pulse"
          style={{ animationDelay: "0.7s" }}
        ></div>
      </div>
    </div>
  );
}

export default function ListeningButtons({
  onPlayPause,
  onInsights,
  onDone,
  isPlaying,
  isPaused,
  className = "",
}: ListeningButtonsProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Play/Pause Button */}
      <Button
        variant="default"
        size="sm"
        className="p-0 m-0 bg-[#072452] text-primary py-0 border-[#196acc] hover:bg-[#072452] border text-xs rounded-full px-3"
        onClick={onPlayPause}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        <span className="text-xs ml-1">{isPlaying ? "Pause" : "Play"}</span>
      </Button>

      {/* Live Insights or Done Button */}
      <Button
        variant="default"
        size="sm"
        className="p-0 m-0 bg-[#072452] text-primary py-0 border-[#196acc] hover:bg-[#072452] border text-xs rounded-full px-3"
        onClick={isPaused ? onDone : onInsights}
      >
        {isPaused ? (
          <>
            <Square className="h-4 w-4" />
            <span className="text-xs ml-1">Done</span>
          </>
        ) : (
          <>
            <AudioWave className="h-4 w-4" />
            <span className="text-xs ml-1">Live Insights</span>
          </>
        )}
      </Button>
    </div>
  );
}
