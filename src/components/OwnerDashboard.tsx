import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Copy, Plus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { naira } from "@/lib/format";
import type { CommissionLog, ReconciliationLog, Terminal } from "@/types";

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
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [logs, setLogs] = useState<ReconciliationLog[]>([]);
  const [commissionLogs, setCommissionLogs] = useState<CommissionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddKiosk, setShowAddKiosk] = useState(false);
  const [copiedTerminalId, setCopiedTerminalId] = useState<string | null>(null);
  const [kioskName, setKioskName] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [addError, setAddError] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Commission entry form state, keyed by terminal id being edited.
  const [commissionFormTerminalId, setCommissionFormTerminalId] = useState<
    string | null
  >(null);
  const [commissionEarned, setCommissionEarned] = useState("");
  const [chargesActual, setChargesActual] = useState("");
  const [chargesExpected, setChargesExpected] = useState("");
  const [commissionError, setCommissionError] = useState("");
  const [isSavingCommission, setIsSavingCommission] = useState(false);

  const inputClass = `w-full rounded-xl border p-3 text-base outline-none focus:border-emerald-500 ${
    isDarkMode
      ? "border-zinc-700 bg-zinc-950 text-zinc-100"
      : "border-zinc-300 bg-white text-zinc-900"
  }`;

  async function loadData() {
    setIsLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: ownerRow } = await supabase
        .from("kiosk_owners")
        .select("approved")
        .eq("id", user.id)
        .maybeSingle();
      setIsApproved(Boolean(ownerRow?.approved));
    }

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

    const { data: commissionRows } = terminalIds.length
      ? await supabase
          .from("daily_commission_logs")
          .select("*")
          .in("terminal_id", terminalIds)
          .order("log_date", { ascending: false })
      : { data: [] as CommissionLog[] };

    setTerminals((terminalRows ?? []) as Terminal[]);
    setLogs((logRows ?? []) as ReconciliationLog[]);
    setCommissionLogs((commissionRows ?? []) as CommissionLog[]);
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  // Realtime: refresh automatically the moment a new log lands, no manual
  // refresh needed.
  useEffect(() => {
    const channel = supabase
      .channel("owner-dashboard-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_reconciliation_logs" },
        () => loadData(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_commission_logs" },
        () => loadData(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  function openCommissionForm(terminalId: string) {
    const today = todayKey();
    const existing = commissionLogs.find(
      (log) => log.terminal_id === terminalId && log.log_date === today,
    );
    const lastForTerminal = commissionLogs.find(
      (log) => log.terminal_id === terminalId,
    );
    setCommissionEarned(existing ? String(existing.commission_earned) : "");
    setChargesActual(existing ? String(existing.charges_actual) : "");
    setChargesExpected(
      existing
        ? String(existing.charges_expected)
        : lastForTerminal
          ? String(lastForTerminal.charges_expected)
          : "",
    );
    setCommissionError("");
    setCommissionFormTerminalId(terminalId);
  }

  async function handleSaveCommission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!commissionFormTerminalId) return;
    setIsSavingCommission(true);
    setCommissionError("");

    const { error } = await supabase.from("daily_commission_logs").upsert(
      {
        terminal_id: commissionFormTerminalId,
        log_date: todayKey(),
        commission_earned: Number(commissionEarned) || 0,
        charges_actual: Number(chargesActual) || 0,
        charges_expected: Number(chargesExpected) || 0,
      },
      { onConflict: "terminal_id,log_date" },
    );

    setIsSavingCommission(false);

    if (error) {
      setCommissionError(error.message);
      return;
    }

    setCommissionFormTerminalId(null);
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

  const totalProfitToday = useMemo(
    () =>
      commissionLogs
        .filter((log) => log.log_date === today)
        .reduce(
          (total, log) => total + (log.commission_earned - log.charges_actual),
          0,
        ),
    [commissionLogs, today],
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

  if (isApproved === false) {
    return (
      <div className="rounded-2xl border border-amber-500 bg-amber-500/10 p-8 text-center">
        <h2 className="mb-2 text-lg font-bold text-amber-500">
          Your account is pending approval
        </h2>
        <p className="text-sm text-zinc-400">
          We manually confirm each new owner before giving full access.
          You'll be able to use the dashboard as soon as it's approved.
        </p>
      </div>
    );
  }

  return (
    <section>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
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
        <div className="col-span-2 rounded-2xl border border-zinc-700 p-4 md:col-span-1">
          <span className="text-xs text-zinc-500">Profit today (after charges)</span>
          <strong className="mt-1 block text-2xl text-emerald-500">
            {naira.format(totalProfitToday)}
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
            const todayCommission = commissionLogs.find(
              (log) => log.terminal_id === terminal.id && log.log_date === today,
            );
            const isShortageToday = todayLog?.status === "Shortage";
            const chargesOverExpected =
              todayCommission &&
              todayCommission.charges_expected > 0 &&
              todayCommission.charges_actual >
                todayCommission.charges_expected * 1.2;

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

                {chargesOverExpected && todayCommission && (
                  <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-amber-500">
                    <AlertTriangle size={12} /> Charges today (
                    {naira.format(todayCommission.charges_actual)}) are well
                    above what you expected (
                    {naira.format(todayCommission.charges_expected)})
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard?.writeText(terminal.access_code);
                      setCopiedTerminalId(terminal.id);
                      setTimeout(
                        () =>
                          setCopiedTerminalId((current) =>
                            current === terminal.id ? null : current,
                          ),
                        1500,
                      );
                    }}
                    className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-600 px-2 py-1 text-xs text-zinc-400"
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
                  <button
                    type="button"
                    onClick={() => openCommissionForm(terminal.id)}
                    className="rounded-lg border border-dashed border-zinc-600 px-2 py-1 text-xs text-zinc-400"
                  >
                    {todayCommission ? "Edit" : "Add"} today's charges
                  </button>
                </div>

                {commissionFormTerminalId === terminal.id && (
                  <form
                    onSubmit={handleSaveCommission}
                    className="mt-3 space-y-2 rounded-xl border border-zinc-700 p-3"
                  >
                    <label className="block text-xs">
                      Commission earned today (₦)
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={commissionEarned}
                        onChange={(event) =>
                          setCommissionEarned(event.target.value)
                        }
                        className={`${inputClass} mt-1`}
                      />
                    </label>
                    <label className="block text-xs">
                      Charges actually deducted today (₦)
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={chargesActual}
                        onChange={(event) => setChargesActual(event.target.value)}
                        className={`${inputClass} mt-1`}
                      />
                    </label>
                    <label className="block text-xs">
                      Charges you expected (₦)
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={chargesExpected}
                        onChange={(event) =>
                          setChargesExpected(event.target.value)
                        }
                        className={`${inputClass} mt-1`}
                      />
                    </label>
                    {commissionError && (
                      <p className="text-xs text-rose-500">{commissionError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCommissionFormTerminalId(null)}
                        className="flex-1 rounded-lg border border-zinc-700 py-2 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingCommission}
                        className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {isSavingCommission ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </form>
                )}
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
      <div className="mb-8 space-y-3">
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

      <h2 className="mb-3 font-bold">Charges &amp; profit history</h2>
      <div className="space-y-3">
        {commissionLogs.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-700 p-8 text-center text-zinc-500">
            No charges entered yet. Use "Add today's charges" on a kiosk
            above.
          </p>
        ) : (
          commissionLogs.map((log) => {
            const terminal = terminals.find((t) => t.id === log.terminal_id);
            const netProfit = log.commission_earned - log.charges_actual;
            const overExpected =
              log.charges_expected > 0 &&
              log.charges_actual > log.charges_expected * 1.2;
            return (
              <article
                key={log.id}
                className={`rounded-2xl border p-4 ${
                  overExpected ? "border-amber-500 bg-amber-500/10" : "border-zinc-700"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">
                      {terminal?.kiosk_location_name ?? "Kiosk"}
                    </h3>
                    <p className="text-xs text-zinc-500">{log.log_date}</p>
                  </div>
                  <strong
                    className={netProfit >= 0 ? "text-emerald-500" : "text-rose-500"}
                  >
                    {naira.format(netProfit)}
                  </strong>
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  Earned {naira.format(log.commission_earned)} · Charged{" "}
                  {naira.format(log.charges_actual)}
                  {log.charges_expected > 0 &&
                    ` (expected ${naira.format(log.charges_expected)})`}
                </p>
                {overExpected && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-500">
                    <AlertTriangle size={12} /> Charges came in well above
                    expected
                  </p>
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