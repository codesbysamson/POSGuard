import { FormEvent, useState } from "react";
import { AlertTriangle, CheckCircle, Lock, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { naira } from "@/lib/format";
import type { TerminalLookup } from "@/types";

interface OperatorViewProps {
  isDarkMode: boolean;
}

const MOVEMENT_REASONS = [
  { value: "", label: "No extra movement today" },
  { value: "Owner top-up", label: "Owner sent extra cash (top-up)" },
  {
    value: "Moved cash for large withdrawal",
    label: "Moved cash out to serve a large withdrawal",
  },
  { value: "Other", label: "Other" },
];

const VARIANCE_REASONS = [
  { value: "", label: "Not sure / unexplained" },
  { value: "Gave excess change", label: "Gave excess change to a customer" },
  { value: "Miscounted cash", label: "Miscounted the cash" },
  { value: "Other", label: "Other reason" },
];

const inputClassFor = (isDarkMode: boolean) =>
  `w-full rounded-xl border p-3 text-base outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 ${
    isDarkMode
      ? "border-zinc-700 bg-zinc-950 text-zinc-100"
      : "border-zinc-300 bg-white text-zinc-900"
  }`;

export function OperatorView({ isDarkMode }: OperatorViewProps) {
  const [accessCode, setAccessCode] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [terminal, setTerminal] = useState<TerminalLookup | null>(null);

  const [openingCash, setOpeningCash] = useState("");
  const [movementAmount, setMovementAmount] = useState("0");
  const [movementDirection, setMovementDirection] = useState<"in" | "out">(
    "in",
  );
  const [movementReason, setMovementReason] = useState("");
  const [withdrawals, setWithdrawals] = useState("");
  const [deposits, setDeposits] = useState("");
  const [closingCash, setClosingCash] = useState("");
  const [varianceReason, setVarianceReason] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justSubmittedVariance, setJustSubmittedVariance] = useState<
    number | null
  >(null);

  const inputClass = inputClassFor(isDarkMode);

  const formComplete = [openingCash, withdrawals, deposits, closingCash].every(
    (value) => value.trim() !== "" && Number(value) >= 0,
  );
  const opening = Number(openingCash) || 0;
  const movementMagnitude = Math.abs(Number(movementAmount) || 0);
  const netMovement =
    movementDirection === "in" ? movementMagnitude : -movementMagnitude;
  const withdrawalVolume = Number(withdrawals) || 0;
  const depositVolume = Number(deposits) || 0;
  const closing = Number(closingCash) || 0;
  const expectedCash = opening + netMovement + withdrawalVolume - depositVolume;
  const liveVariance = closing - expectedCash;

  async function handleFindTerminal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLookupError("");
    setIsLookingUp(true);
    const { data, error } = await supabase
      .rpc("get_terminal_by_code", { p_access_code: accessCode.trim() })
      .single();
    setIsLookingUp(false);

    if (error || !data) {
      setLookupError(
        "That kiosk code wasn't recognised. Check with your owner and try again.",
      );
      return;
    }
    setTerminal(data as TerminalLookup);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formComplete || !terminal || terminal.today_is_locked) return;

    const confirmed = window.confirm(
      "Submit this daily ledger? You will not be able to edit it afterwards.",
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    setSubmitError("");

    const { data, error } = await supabase
      .rpc("submit_reconciliation", {
        p_access_code: accessCode.trim(),
        p_opening_cash: opening,
        p_net_other_cash_movements: netMovement,
        p_movement_reason: movementMagnitude === 0 ? "" : movementReason,
        p_withdrawal_volume: withdrawalVolume,
        p_deposit_volume: depositVolume,
        p_closing_cash: closing,
        p_variance_reason: liveVariance === 0 ? "" : varianceReason,
      })
      .single();

    setIsSubmitting(false);

    if (error || !data) {
      setSubmitError(
        error?.message ??
          "Couldn't submit. Check your connection and try again.",
      );
      return;
    }

    const result = data as { recorded_variance: number };
    setJustSubmittedVariance(result.recorded_variance);
    setTerminal({
      ...terminal,
      today_is_locked: true,
      today_submission_timestamp: new Date().toISOString(),
    });
  }

  // Step 0: enter the kiosk access code the owner gave this operator.
  if (!terminal) {
    return (
      <section className="mx-auto max-w-md">
        <div className="mb-5">
          <h2 className="text-2xl font-bold">Start your shift close</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Enter the 6-character kiosk code your owner gave you.
          </p>
        </div>
        <form onSubmit={handleFindTerminal} className="space-y-4">
          <input
            type="text"
            autoCapitalize="characters"
            autoFocus
            maxLength={6}
            value={accessCode}
            onChange={(event) => setAccessCode(event.target.value.toUpperCase())}
            placeholder="e.g. A1B2C3"
            className={`${inputClass} text-center text-lg font-bold tracking-[0.3em]`}
          />
          {lookupError && (
            <p className="text-sm text-rose-500">{lookupError}</p>
          )}
          <button
            type="submit"
            disabled={accessCode.trim().length < 4 || isLookingUp}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 p-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLookingUp ? "Checking..." : "Continue"}
          </button>
        </form>
      </section>
    );
  }

  const isLocked = terminal.today_is_locked;

  return (
    <section className="mx-auto max-w-md">
      <div className="mb-5">
        <h2 className="text-2xl font-bold">{terminal.kiosk_location_name}</h2>
        <p className="mt-1 text-sm text-zinc-500">
          {terminal.assigned_operator_name} · Close today&apos;s shift
        </p>
      </div>

      {isLocked ? (
        <div className="rounded-2xl border border-emerald-600 bg-emerald-500/10 p-6 text-center">
          <Lock className="mx-auto mb-3 text-emerald-500" size={30} />
          <h3 className="font-bold">
            Today&apos;s ledger is submitted and locked
          </h3>
          {terminal.today_submission_timestamp && (
            <p className="mt-2 text-sm text-zinc-500">
              Submitted at{" "}
              {new Date(
                terminal.today_submission_timestamp,
              ).toLocaleTimeString("en-NG", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              .
            </p>
          )}
          {justSubmittedVariance !== null && (
            <p className="mt-2 text-xs text-zinc-500">
              Your owner has been notified of the result.
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">
              1. Opening cash balance (₦)
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              required
              value={openingCash}
              onChange={(event) => setOpeningCash(event.target.value)}
              placeholder="Cash in the bag this morning"
              className={inputClass}
            />
          </label>

          <div className="rounded-xl border border-zinc-700 p-3">
            <span className="mb-2 block text-sm font-semibold">
              2. Extra cash moved during shift (₦)
            </span>
            <div className="mb-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMovementDirection("in")}
                className={`rounded-lg border p-2 text-sm font-semibold ${
                  movementDirection === "in"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                    : "border-zinc-700"
                }`}
              >
                Cash came IN (top-up)
              </button>
              <button
                type="button"
                onClick={() => setMovementDirection("out")}
                className={`rounded-lg border p-2 text-sm font-semibold ${
                  movementDirection === "out"
                    ? "border-amber-500 bg-amber-500/10 text-amber-500"
                    : "border-zinc-700"
                }`}
              >
                Cash went OUT (rebalanced)
              </button>
            </div>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={movementAmount}
              onChange={(event) => setMovementAmount(event.target.value)}
              placeholder="0 if nothing moved today"
              className={`${inputClass} mb-2`}
            />
            {movementMagnitude > 0 && (
              <select
                value={movementReason}
                onChange={(event) => setMovementReason(event.target.value)}
                className={inputClass}
              >
                {MOVEMENT_REASONS.filter((option) => option.value !== "").map(
                  (option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ),
                )}
              </select>
            )}
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">
              3. Successful withdrawal volume (₦)
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              required
              value={withdrawals}
              onChange={(event) => setWithdrawals(event.target.value)}
              placeholder="Total successful customer withdrawals"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">
              4. Successful deposits/transfers (₦)
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              required
              value={deposits}
              onChange={(event) => setDeposits(event.target.value)}
              placeholder="Cash received for transfers or deposits"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">
              5. Closing cash balance (₦)
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              required
              value={closingCash}
              onChange={(event) => setClosingCash(event.target.value)}
              placeholder="Physical cash counted now"
              className={inputClass}
            />
          </label>

          {formComplete && (
            <div
              aria-live="polite"
              className={`space-y-3 rounded-xl border p-4 ${
                liveVariance === 0
                  ? "border-emerald-500 bg-emerald-500/10"
                  : liveVariance < 0
                    ? "border-rose-500 bg-rose-500/10"
                    : "border-amber-500 bg-amber-500/10"
              }`}
            >
              {liveVariance === 0 ? (
                <p className="flex items-center gap-2 font-bold text-emerald-500">
                  <CheckCircle size={18} /> Perfectly Balanced
                </p>
              ) : liveVariance < 0 ? (
                <p className="flex items-center gap-2 font-bold text-rose-500">
                  <AlertTriangle size={18} /> SHORTAGE DETECTED: Missing{" "}
                  {naira.format(Math.abs(liveVariance))}
                </p>
              ) : (
                <p className="font-bold text-amber-500">
                  SURPLUS DETECTED: {naira.format(liveVariance)}
                </p>
              )}

              {liveVariance !== 0 && (
                <select
                  value={varianceReason}
                  onChange={(event) => setVarianceReason(event.target.value)}
                  className={inputClassFor(isDarkMode)}
                >
                  {VARIANCE_REASONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {submitError && (
            <p className="text-sm text-rose-500">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={!formComplete || isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 p-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Wallet size={20} />{" "}
            {isSubmitting ? "Submitting..." : "Submit Daily Ledger"}
          </button>
        </form>
      )}
    </section>
  );
}
