import { Button } from "../ui/button";
import { TfiText } from "react-icons/tfi";
import { Kbd } from "../ui/kbd";
import { KbdGroup } from "../ui/kbd";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";

export default function AskQuestionButton({
  askModal,
  setAskModal,
}: {
  askModal: boolean;
  setAskModal: (askModal: boolean) => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Button
          variant="default"
          size="sm"
          className="rounded-2xl h-7 px-0 border bg-transparent text-primary hover:bg-muted border-none hover:border-border text-xs"
          onClick={() => {
            console.log("Ask Question button clicked!");
            setAskModal(!askModal);
          }}
        >
          <TfiText className="h-4 w-4" />
          <span>Ask Question</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex gap-2 items-center">
        <span>Ask about anything on your screen</span>
        <KbdGroup>
          <Kbd className="bg-muted rounded-md text-sm border">⌃</Kbd>
          <Kbd className="bg-muted rounded-md text-sm border">↵</Kbd>
        </KbdGroup>
      </TooltipContent>
    </Tooltip>
  );
}
