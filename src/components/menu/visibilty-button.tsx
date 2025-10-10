"use client";

import { Eye, HatGlasses } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export default function VisibilityButton() {
  const [isVisible, setIsVisible] = useState(false);

  const handleToggleVisibility = () => {
    setIsVisible((prev) => !prev);
  };

  return (
    <div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Button
              variant="default"
              size="icon"
              className="rounded-2xl mr-1 -ml-2  px-0 border bg-transparent text-primary hover:bg-muted border-none hover:border-border    text-xs"
              onClick={handleToggleVisibility}
            >
              {isVisible ? <Eye /> : <HatGlasses className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span>
              Current {isVisible ? "visible" : "invisible"}. Click to make{" "}
              {isVisible ? "invisible" : "visible"}
            </span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
