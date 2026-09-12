import { ReactNode, useState } from "react";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  Settings,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Wallet", icon: Wallet, path: "/wallet" },
  { label: "Transactions", icon: Receipt, path: "/transactions" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

type MobileShellProps = {
  children: ReactNode;
  activePath?: string;
};

export function MobileShell({ children, activePath = "/" }: MobileShellProps) {
  const [activeTab, setActiveTab] = useState(activePath);

  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 flex justify-center">
      <div className="relative w-full max-w-md min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col overflow-hidden shadow-2xl shadow-zinc-900/10 dark:shadow-zinc-950/50">
        {/* Status bar spacer for mobile feel */}
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 dark:from-emerald-600 dark:via-emerald-500 dark:to-teal-600" />

        {/* Top header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-500/20">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">
              KoraPay
            </span>
          </div>
          <ThemeToggle />
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-24">{children}</main>

        {/* Bottom navigation */}
        <nav className="absolute bottom-0 left-0 right-0 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur-md px-2 pb-safe pt-2 z-20">
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const isActive = activeTab === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => setActiveTab(item.path)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 active:scale-[0.98]",
                    isActive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 transition-all duration-200",
                      isActive && "scale-110"
                    )}
                  />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
