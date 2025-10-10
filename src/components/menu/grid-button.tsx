import { GripVertical } from "lucide-react";
import { Button } from "../ui/button";

export default function GridButton() {
  return (
    <div>
      <Button
        variant="default"
        size="icon"
        className="rounded-r-full  px-0 border bg-transparent text-primary hover:bg-muted border-none hover:border-border    text-xs"
      >
        <GripVertical />
      </Button>
    </div>
  );
}
