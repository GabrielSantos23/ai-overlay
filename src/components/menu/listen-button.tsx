import { Button } from "../ui/button";
import { LuAudioLines } from "react-icons/lu";
export default function ListenButton() {
  return (
    <div>
      <Button
        variant="default"
        size="sm"
        className="rounded-2xl h-7 px-0 border text-white  bg-[#072452] py-0 border-[#196acc] hover:bg-[#072452] text-xs"
      >
        <LuAudioLines className="h-4 w-4" />
        <span>Listen</span>
      </Button>
    </div>
  );
}
