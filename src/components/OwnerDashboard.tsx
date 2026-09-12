import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Copy, Plus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { naira } from "@/lib/format";
import type { ReconciliationLog, Terminal } from "@/types";

interface OwnerDashboardProps {
  isDarkMode: boolean;
}

function todayKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function OwnerDashboard({ isDarkMode }: OwnerDashboardProps) {
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [logs, setLogs] = useState<ReconciliationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddKiosk, setShowAddKiosk] = useState(false);
  const [copiedTerminalId, setCopiedTerminalId] = useState<string | null>(null);
  const [kioskName, setKioskName] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [addError, setAddError] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const inputClass = `w-full rounded-xl border p-3 text-base outline-none focus:border-emerald-500 ${
    isDarkMode
      ? "border-zinc-700 bg-zinc-950 text-zinc-100"
      : "border-zinc-300 bg-white text-zinc-900"
  }`;

  async function loadData() {
    setIsLoading(true);
    const { data: terminalRows } = await supabase
      .from("terminals")
      .select("*")
      .order("created_at", { ascending: true });

    const terminalIds = (terminalRows ?? []).map((row) => row.id);
    const { data: logRows } = terminalIds.length
      ? await supabase
          .from("daily_reconciliation_logs")
          .select("*")
          .in("terminal_id", terminalIds)
          .order("log_date", { ascending: false })
      : { data: [] as ReconciliationLog[] };

    setTerminals((terminalRows ?? []) as Terminal[]);
    setLogs((logRows ?? []) as ReconciliationLog[]);
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAddKiosk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAddError("");
    setIsAdding(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAddError("Session expired. Please sign in again.");
      setIsAdding(false);
      return;
    }

    const { error } = await supabase.from("terminals").insert({
      owner_id: user.id,
      kiosk_location_name: kioskName.trim(),
      assigned_operator_name: operatorName.trim(),
    });

    setIsAdding(false);

    if (error) {
      setAddError(error.message);
      return;
    }

    setKioskName("");
    setOperatorName("");
    setShowAddKiosk(false);
    loadData();
  }

  const today = todayKey();

  const totalShortagesToday = useMemo(
    () =>
      logs
        .filter((log) => log.log_date === today && log.status === "Shortage")
        .reduce((total, log) => total + Math.abs(log.recorded_variance), 0),
    [logs, today],
  );

  // Repeat-offender view: operator name -> shortage count, across all history.
  const shortagesByOperator = useMemo(() => {
    const counts = new Map<string, { count: number; total: number }>();
    for (const log of logs) {
      if (log.status !== "Shortage") continue;
      const terminal = terminals.find((t) => t.id === log.terminal_id);
      const name = terminal?.assigned_operator_name ?? "Unknown operator";
      const existing = counts.get(name) ?? { count: 0, total: 0 };
      existing.count += 1;
      existing.total += Math.abs(log.recorded_variance);
      counts.set(name, existing);
    }
    return Array.from(counts.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.count - a.count);
  }, [logs, terminals]);

  if (isLoading) {
    return <p className="text-center text-zinc-500">Loading your kiosks...</p>;
  }

  return (
    <section>
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-zinc-700 p-4">
          <span className="text-xs text-zinc-500">Registered kiosks</span>
          <strong className="mt-1 block text-2xl">{terminals.length}</strong>
        </div>
        <div className="rounded-2xl border border-zinc-700 p-4">
          <span className="text-xs text-zinc-500">Shortages today</span>
          <strong className="mt-1 block text-2xl text-rose-500">
            {naira.format(totalShortagesToday)}
          </strong>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold">Your kiosks</h2>
        <button
          type="button"
          onClick={() => setShowAddKiosk(true)}
          className="flex items-center gap-1 rounded-xl border border-zinc-700 px-3 py-1.5 text-sm"
        >
          <Plus size={16} /> Add kiosk
        </button>
      </div>

      <div className="mb-8 space-y-3">
        {terminals.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-700 p-8 text-center text-zinc-500">
            No kiosks registered yet. Add one to get an operator access code.
          </p>
        ) : (
          terminals.map((terminal) => {
            const todayLog = logs.find(
              (log) => log.terminal_id === terminal.id && log.log_date === today,
            );
            const isShortageToday = todayLog?.status === "Shortage";
            return (
              <article
                key={terminal.id}
                className={`rounded-2xl border p-4 ${
                  isShortageToday
                    ? "border-rose-600 bg-rose-500/10"
                    : "border-zinc-700"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">
                      {terminal.kiosk_location_name}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {terminal.assigned_operator_name}
                    </p>
                  </div>
                  {isShortageToday && todayLog ? (
                    <strong className="flex items-center gap-1 text-rose-500">
                      <AlertTriangle size={16} />
                      {naira.format(Math.abs(todayLog.recorded_variance))}
                    </strong>
                  ) : todayLog ? (
                    <span className="text-xs font-semibold text-emerald-500">
                      {todayLog.status}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500">
                      Not submitted yet
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard?.writeText(terminal.access_code);
                    setCopiedTerminalId(terminal.id);
                    setTimeout(() => setCopiedTerminalId((current) => (current === terminal.id ? null : current)), 1500);
                  }}
                  className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-zinc-600 px-2 py-1 text-xs text-zinc-400"
                >
                  {copiedTerminalId === terminal.id ? (
                    <>
                      <Check size={12} className="text-emerald-500" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={12} /> Operator code: {terminal.access_code}
                    </>
                  )}
                </button>
              </article>
            );
          })
        )}
      </div>

      {shortagesByOperator.length > 0 && (
        <>
          <h2 className="mb-3 font-bold">Repeat shortages by operator</h2>
          <div className="mb-8 space-y-2">
            {shortagesByOperator.map((row) => (
              <div
                key={row.name}
                className="flex items-center justify-between rounded-xl border border-zinc-700 p-3 text-sm"
              >
                <span>{row.name}</span>
                <span className="text-rose-500">
                  {row.count} shortage{row.count === 1 ? "" : "s"} ·{" "}
                  {naira.format(row.total)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="mb-3 font-bold">Reconciliation history</h2>
      <div className="space-y-3">
        {logs.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-700 p-8 text-center text-zinc-500">
            No ledger has been submitted.
          </p>
        ) : (
          logs.map((log) => {
            const terminal = terminals.find((t) => t.id === log.terminal_id);
            return (
              <article
                key={log.id}
                className={`rounded-2xl border p-4 ${
                  log.status === "Shortage"
                    ? "border-rose-600 bg-rose-500/10"
                    : "border-zinc-700"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">
                      {terminal?.kiosk_location_name ?? "Kiosk"}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {log.log_date} · {terminal?.assigned_operator_name}
                    </p>
                  </div>
                  <strong
                    className={
                      log.recorded_variance < 0
                        ? "text-rose-500"
                        : log.recorded_variance > 0
                          ? "text-amber-500"
                          : "text-emerald-500"
                    }
                  >
                    {log.recorded_variance > 0 ? "+" : ""}
                    {naira.format(log.recorded_variance)}
                  </strong>
                </div>
                                    {(log.movement_reason ||
                  log.variance_reason ||
                  log.status !== "Balanced") && (
                  <div className="mt-2 space-y-1 text-xs text-zinc-500">
                    {log.movement_reason && (
                      <p>
                        Cash movement:{" "}
                        {naira.format(log.net_other_cash_movements)} (
                        {log.movement_reason})
                      </p>
                    )}
                    {log.status !== "Balanced" &&
                      (log.variance_reason ? (
                        <p>Operator note: {log.variance_reason}</p>
                      ) : (
                        <p className="font-semibold text-rose-400">
                          No reason given
                        </p>
                      ))}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {showAddKiosk && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 p-4">
          <form
            onSubmit={handleAddKiosk}
            className={`w-full max-w-sm rounded-2xl border p-6 ${
              isDarkMode
                ? "border-zinc-700 bg-zinc-900"
                : "border-zinc-200 bg-white"
            }`}
          >
            <h2 className="text-xl font-bold">Register a kiosk</h2>
            <p className="mb-4 mt-1 text-sm text-zinc-500">
              You'll get an access code to hand to the operator.
            </p>
            <div className="space-y-3">
              <input
                type="text"
                required
                autoFocus
                placeholder="Kiosk location name"
                value={kioskName}
                onChange={(event) => setKioskName(event.target.value)}
                className={inputClass}
              />
              <input
                type="text"
                required
                placeholder="Assigned operator name"
                value={operatorName}
                onChange={(event) => setOperatorName(event.target.value)}
                className={inputClass}
              />
            </div>
            {addError && (
              <p className="mt-2 text-sm text-rose-500">{addError}</p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowAddKiosk(false)}
                className="rounded-xl border border-zinc-700 p-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAdding}
                className="rounded-xl bg-emerald-600 p-3 font-bold text-white disabled:opacity-50"
              >
                {isAdding ? "Adding..." : "Add kiosk"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
