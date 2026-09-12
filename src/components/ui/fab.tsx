import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type FabProps = {
  onClick?: () => void;
  className?: string;
  "aria-label"?: string;
};

export function Fab({
  onClick,
  className,
  "aria-label": ariaLabel = "Quick action",
}: FabProps) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "fixed bottom-20 right-[max(0.75rem,calc(50%-13.5rem))] z-30 w-14 h-14 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500/40",
        className
      )}
    >
      <Plus className="w-6 h-6" strokeWidth={2.5} />
    </button>
  );
}
