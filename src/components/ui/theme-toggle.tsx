import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycle = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <button
      onClick={cycle}
      aria-label="Toggle theme"
      className={cn(
        "relative w-9 h-9 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center transition-all duration-200 active:scale-[0.98] bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800"
      )}
    >
      <div className="relative w-4 h-4">
        <Sun
          className={cn(
            "absolute inset-0 w-4 h-4 text-amber-500 transition-all duration-200",
            theme === "light"
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 rotate-90 scale-0"
          )}
        />
        <Moon
          className={cn(
            "absolute inset-0 w-4 h-4 text-zinc-700 dark:text-zinc-300 transition-all duration-200",
            theme === "dark"
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 -rotate-90 scale-0"
          )}
        />
        <Sun
          className={cn(
            "absolute inset-0 w-4 h-4 text-zinc-500 transition-all duration-200",
            theme === "system"
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 rotate-[-15deg] scale-75"
          )}
        />
      </div>
    </button>
  );
}
