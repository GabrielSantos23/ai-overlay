import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";
import { useEffect, useState } from "react";

interface CustomSaveToastProps {
  show: boolean;
  onSave: () => void;
  onDismiss: () => void;
  isSaving?: boolean;
}

export default function CustomSaveToast({
  show,
  onSave,
  onDismiss,
  isSaving = false,
}: CustomSaveToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [show]);

  if (!show) return null;

  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2 pointer-events-none"
      }`}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl px-4 py-3 flex items-center gap-4 min-w-[320px] backdrop-blur-md">
        <div className="flex-1">
          <p className="text-sm font-medium text-white">Unsaved changes</p>
          <p className="text-xs text-zinc-400 mt-0.5">
            Click save to keep your changes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3"
          >
            {isSaving ? (
              <>
                <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-3 w-3 mr-2" />
                Save
              </>
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onDismiss}
            disabled={isSaving}
            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
