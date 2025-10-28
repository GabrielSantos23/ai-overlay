import {
  Add01Icon,
  Camera01Icon,
  CircleArrowRight02Icon,
  Globe02Icon,
  Mic02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "../ui/button";
import { GripVerticalIcon } from "lucide-react";
import { Input } from "./input";
import { useScreenshot } from "@/hooks/useScreenshot";

interface ChatInputProps {
  onScreenshot?: (base64: string) => void;
  images?: any[];
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (e?: React.FormEvent) => void;
  isLoading?: boolean;
}

export const ChatInput = ({
  onScreenshot,
  images = [],
  value = "",
  onChange,
  onSubmit,
  isLoading = false,
}: ChatInputProps) => {
  const { captureScreenshot, isLoading: isCapturingScreenshot } = useScreenshot(
    {
      onScreenshot: onScreenshot,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit && !isLoading) {
      onSubmit(e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (onSubmit && !isLoading) {
        onSubmit();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        className={`flex px-3 py-2 flex-col ${
          images.length > 0 ? "h-[calc(100%-40px)]" : "h-[calc(100%--10px)]"
        } w-full justify-normal`}
      >
        <div className="w-full flex-1">
          <Input
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
        </div>
        <div
          className="my-2 h-12 flex items-center justify-between"
          data-tauri-drag-region="true"
        >
          <div className="flex gap-x-2">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors"
              disabled={isLoading}
            >
              <HugeiconsIcon icon={Add01Icon} className="h-5" />
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors"
              disabled={isLoading}
            >
              <HugeiconsIcon icon={Globe02Icon} className="h-5" />
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              onClick={() => captureScreenshot()}
              disabled={isCapturingScreenshot || isLoading}
            >
              <HugeiconsIcon icon={Camera01Icon} className="h-5" />
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`-ml-0.5 w-fit`}
              data-tauri-drag-region="true"
              onPointerDown={(e) => e.preventDefault()}
            >
              <GripVerticalIcon className="h-4 w-4 pointer-events-none" />
            </Button>
          </div>
          <div className="flex items-center gap-x-2">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground transition-colors"
              disabled={isLoading}
            >
              <HugeiconsIcon icon={Mic02Icon} className="h-5" />
            </button>
            <button
              type="submit"
              className="hover:opacity-80 transition-opacity disabled:opacity-50"
              disabled={isLoading || (!value.trim() && images.length === 0)}
            >
              <HugeiconsIcon
                icon={CircleArrowRight02Icon}
                className="h-7 fill-white text-secondary -rotate-90"
              />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;
