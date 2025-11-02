import { toast } from "sonner";
import { CheckCircle, AlertTriangle, Info, XCircle, Check } from "lucide-react";
import type { ReactNode } from "react";

/**
 * 🔧 Base Custom Toast
 */
const baseToast = (icon: ReactNode, title: string, description?: string) => {
  toast(
    <div className="flex items-center gap-x-3 bg-background text-card-foreground">
      <div className="    ">{icon}</div>
      <div className="flex flex-col">
        <span className="font-medium text-sm">{title}</span>
        {description && <span>{description}</span>}
      </div>
    </div>
  );
};

/**
 * ✅ Success Toast
 */
export const successToast = (title: string, description?: string) => {
  baseToast(
    <Check className="h-5 w-5 p-1 bg-green-500 text-background rounded-full  " />,
    title,
    description
  );
};

/**
 * ❌ Error Toast
 */
export const errorToast = (title: string, description?: string) => {
  baseToast(<XCircle className="h-5 w-5 text-red-500" />, title, description);
};

/**
 * ⚠️ Warning Toast
 */
export const showWarningToast = (title: string, description?: string) => {
  baseToast(
    <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    title,
    description
  );
};

/**
 * 💡 Info Toast
 */
export const InfoToast = (title: string, description?: string) => {
  baseToast(
    <Info className="h-5 w-5 p-1 bg-blue-500 text-background rounded-full " />,
    title,
    description
  );
};

/**
 * 🧩 Custom Toast
 */
export const showCustomToast = (content: ReactNode) => {
  toast.custom(() => (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 text-sm text-zinc-100 shadow-lg backdrop-blur-md">
      {content}
    </div>
  ));
};
