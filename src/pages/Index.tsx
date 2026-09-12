import { MadeWithDyad } from "@/components/made-with-dyad";
import { PremiumCard } from "@/components/ui/premium-card";
import { SheetModal } from "@/components/ui/sheet-modal";
import { Fab } from "@/components/ui/fab";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

const Index = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6">
      {/* Empty state card */}
      <PremiumCard className="mb-6">
        <div className="p-4">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
            Recent Transactions
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            No recent activity. Add a transaction to get started.
          </p>
        </div>
      </PremiumCard>

      {/* Skeleton placeholder for metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Skeleton className="h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
        <Skeleton className="h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
        <Skeleton className="h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
        <Skeleton className="h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
      </div>

      {/* Bottom FAB */}
      <Fab onClick={() => setModalOpen(true)} aria-label="Add transaction" />

      {/* Sheet modal demo */}
      <SheetModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Add New Transaction"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Amount (NGN)
            </label>
            <input
              type="number"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:shadow-emerald-500/20 transition-colors"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Description
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:shadow-emerald-500/20 transition-colors"
              placeholder="Transfer to…"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="flex-1 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white px-4 py-2 font-medium hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              className="flex-1 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-4 py-2 font-medium hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </SheetModal>
    </div>
  );
};

export default Index;