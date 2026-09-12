import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PremiumCardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
};

export function PremiumCard({
  children,
  className,
  hover = true,
  onClick,
}: PremiumCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm transition-all duration-200",
        hover && "hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-[0.98]",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
