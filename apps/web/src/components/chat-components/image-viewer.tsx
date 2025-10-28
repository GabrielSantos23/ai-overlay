import type { ImageViewerProps } from "@/routes/chat";
import { X } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useWindowResize } from "@/hooks/useWindow";
import { useRef } from "react";

export const ImageViewer = ({ images = [], onRemove }: ImageViewerProps) => {
  const { resizeWindow } = useWindowResize();
  const popoverContentRef = useRef<HTMLDivElement>(null);

  const calculatePopoverHeight = () => {
    if (popoverContentRef.current) {
      const rect = popoverContentRef.current.getBoundingClientRect();
      // Add some padding for proper spacing
      return Math.max(rect.height + 20, 100) + 4;
    }
    return 600;
  };

  const handlePopoverOpenChange = (open: boolean) => {
    if (open) {
      // Use setTimeout to ensure the popover content is rendered before measuring
      setTimeout(() => {
        const height = calculatePopoverHeight();
        resizeWindow(true, height);
      }, 0);
    } else {
      resizeWindow(false);
    }
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="p-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
      <div className="flex gap-2 flex-nowrap">
        {images.map((image) => {
          const imageUrl = `data:${image.type};base64,${image.base64}`;
          return (
            <HoverCard
              key={image.id}
              openDelay={200}
              onOpenChange={handlePopoverOpenChange}
            >
              <HoverCardTrigger asChild>
                <div className="flex items-center px-2 border rounded-full bg-muted shadow-sm group hover:bg-muted/80 transition-colors whitespace-nowrap shrink-0 cursor-pointer">
                  <img
                    src={imageUrl}
                    alt={image.name}
                    width={32}
                    height={32}
                    className="object-cover rounded-2xl w-6 h-6"
                  />
                  <div className="ml-2">
                    <p className="text-xs text-muted-foreground max-w-[100px] truncate">
                      {image.name}
                    </p>
                  </div>
                  {onRemove && (
                    <button
                      onClick={() => onRemove(image.id)}
                      className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </HoverCardTrigger>
              <HoverCardContent
                className="w-auto p-2"
                side="top"
                ref={popoverContentRef}
              >
                <img
                  src={imageUrl}
                  alt={image.name}
                  className="max-w-xs max-h-64 object-contain rounded-md"
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {image.name}
                </p>
              </HoverCardContent>
            </HoverCard>
          );
        })}
      </div>
    </div>
  );
};
