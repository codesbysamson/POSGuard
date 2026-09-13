import { useEffect, useState } from "react";
import { Lock, Shield } from "lucide-react";

interface LandingPageProps {
  onOwnerClick: () => void;
  onOperatorClick: () => void;
}

const LEDGER_ROWS = [
  { label: "Opening cash", value: 42000 },
  { label: "Withdrawals", value: 118500 },
  { label: "Deposits", value: 76000 },
  { label: "Closing cash", value: 84500 },
];

const PAIN_POINTS = [
  {
    n: "1",
    title: "A shortage nobody can explain",
    body: "₦10,000 in the bag this morning, ₦120,000 moving through the terminal by night. When a customer needs a big withdrawal, cash gets moved around to cover it — and by closing time nobody can say where the numbers actually landed.",
  },
  {
    n: "2",
    title: "\u201cHe said, she said\u201d at closing time",
    body: "A shortage looks the same whether it's theft or an honest mistake, like giving a customer too much change. Owners end up guessing, and operators end up arguing.",
  },
  {
    n: "3",
    title: "Charges that don't match what was promised",
    body: "You expect Moniepoint to take ₦800 for the day. It takes ₦2,000. Across three or four kiosks, working out real profit by hand every night is slow, and easy to get wrong.",
  },
];

export function LandingPage({
  onOwnerClick,
  onOperatorClick,
}: LandingPageProps) {
  const [tickIndex, setTickIndex] = useState(-1);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) {
      setTickIndex(LEDGER_ROWS.length - 1);
      setLocked(true);
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    LEDGER_ROWS.forEach((_, index) => {
      timers.push(
        setTimeout(() => setTickIndex(index), 450 + index * 420),
      );
    });
    timers.push(
      setTimeout(() => setLocked(true), 450 + LEDGER_ROWS.length * 420 + 300),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      style={{ background: "#0A120F", color: "#F3EFE4" }}
      className="min-h-screen"
    >
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6">
        <div className="flex items-center gap-2">
          <span
            style={{ background: "#22C55E" }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#0A120F]"
          >
            <Shield size={18} aria-hidden="true" />
          </span>
          <span
            style={{ fontFamily: "Fraunces, serif" }}
            className="text-lg font-medium"
          >
            POSGuard
          </span>
        </div>
        <button
          type="button"
          onClick={onOwnerClick}
          className="rounded-full border px-4 py-2 text-sm"
          style={{ borderColor: "#3A4A41" }}
        >
          Owner sign in
        </button>
      </header>

      <main className="mx-auto max-w-5xl px-5">
        {/* Hero */}
        <section className="grid gap-10 py-10 md:grid-cols-2 md:gap-16 md:py-20">
          <div>
            <h1
              style={{ fontFamily: "Fraunces, serif", lineHeight: 1.08 }}
              className="text-4xl font-medium md:text-5xl"
            >
              Know exactly what happened at every kiosk, every shift.
            </h1>
            <p
              style={{ color: "#B9C4BC" }}
              className="mt-5 max-w-sm text-base leading-relaxed"
            >
              POSGuard locks in a verified cash count at shift close, across
              every kiosk you own — so shortages get caught the day they
              happen, not guessed at weeks later.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onOwnerClick}
                style={{ background: "#22C55E", color: "#0A120F" }}
                className="rounded-full px-6 py-3 text-sm font-semibold"
              >
                I'm a kiosk owner
              </button>
              <button
                type="button"
                onClick={onOperatorClick}
                className="rounded-full border px-6 py-3 text-sm font-semibold"
                style={{ borderColor: "#3A4A41", color: "#F3EFE4" }}
              >
                I close a shift here
              </button>
            </div>
            <p style={{ color: "#6E7B72" }} className="mt-4 text-xs">
              ₦1,000/kiosk/month founding rate for your first kiosks.
            </p>
          </div>

          {/* Animated ledger strip -- the one orchestrated motion moment */}
          <div
            style={{ borderColor: "#3A4A41", background: "#0F1C16" }}
            className="rounded-2xl border p-6"
          >
            <p style={{ color: "#6E7B72" }} className="mb-4 text-xs uppercase tracking-wide">
              Ireakari Street Kiosk · today
            </p>
            <div>
              {LEDGER_ROWS.map((row, index) => (
                <div
                  key={row.label}
                  style={{
                    borderColor: "#233028",
                    opacity: tickIndex >= index ? 1 : 0.25,
                    transition: "opacity 0.4s ease",
                  }}
                  className="flex items-center justify-between border-b py-3 text-sm last:border-0"
                >
                  <span style={{ color: "#B9C4BC" }}>{row.label}</span>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>
                    ₦{row.value.toLocaleString("en-NG")}
                  </span>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: "1rem",
                borderColor: locked ? "#22C55E" : "#3A4A41",
                background: locked ? "rgba(34,197,94,0.1)" : "transparent",
                transition: "all 0.5s ease",
              }}
              className="flex items-center justify-between rounded-xl border p-3 text-sm"
            >
              <span style={{ color: locked ? "#22C55E" : "#6E7B72" }}>
                {locked ? "Balanced & locked" : "Reconciling…"}
              </span>
              {locked && <Lock size={16} style={{ color: "#22C55E" }} />}
            </div>
          </div>
        </section>

        {/* Pain points, ledger-row style */}
        <section className="border-t py-14" style={{ borderColor: "#233028" }}>
          <h2
            style={{ fontFamily: "Fraunces, serif" }}
            className="mb-8 max-w-md text-2xl font-medium"
          >
            The three things owners keep telling us
          </h2>
          <div>
            {PAIN_POINTS.map((point) => (
              <div
                key={point.n}
                style={{ borderColor: "#233028" }}
                className="grid grid-cols-[2rem_1fr] gap-4 border-t py-6 last:border-b md:grid-cols-[3rem_1fr]"
              >
                <span style={{ color: "#3A4A41", fontFamily: "Fraunces, serif" }} className="text-2xl">
                  {point.n}
                </span>
                <div>
                  <h3 className="mb-1 font-semibold">{point.title}</h3>
                  <p style={{ color: "#B9C4BC" }} className="max-w-lg text-sm leading-relaxed">
                    {point.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* What's live vs coming */}
        <section className="border-t py-14" style={{ borderColor: "#233028" }}>
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <p style={{ color: "#22C55E" }} className="mb-2 text-xs font-semibold">
                Working today
              </p>
              <h3
                style={{ fontFamily: "Fraunces, serif" }}
                className="mb-3 text-xl font-medium"
              >
                Verified, locked shift reconciliation
              </h3>
              <p style={{ color: "#B9C4BC" }} className="text-sm leading-relaxed">
                Opening cash, top-ups or float rebalancing, withdrawals,
                deposits, closing cash — the math is checked on the server,
                not the operator's phone, and once submitted it can't be
                edited by anyone.
              </p>
            </div>
            <div>
              <p style={{ color: "#D9A441" }} className="mb-2 text-xs font-semibold">
                Coming soon
              </p>
              <h3
                style={{ fontFamily: "Fraunces, serif" }}
                className="mb-3 text-xl font-medium"
              >
                Real profit after provider charges
              </h3>
              <p style={{ color: "#B9C4BC" }} className="text-sm leading-relaxed">
                See what Moniepoint or OPay actually deducted against what
                you expected, per kiosk, per day — so an unusual charge gets
                caught, not buried in a mental estimate.
              </p>
            </div>
          </div>
        </section>

        <section
          style={{ borderColor: "#233028" }}
          className="flex flex-col items-start gap-5 border-t py-14"
        >
          <h2
            style={{ fontFamily: "Fraunces, serif" }}
            className="max-w-md text-2xl font-medium"
          >
            Set up your first kiosk in two minutes.
          </h2>
          <button
            type="button"
            onClick={onOwnerClick}
            style={{ background: "#22C55E", color: "#0A120F" }}
            className="rounded-full px-6 py-3 text-sm font-semibold"
          >
            Create your owner account
          </button>
        </section>
      </main>

      <footer
        style={{ borderColor: "#233028", color: "#6E7B72" }}
        className="mx-auto max-w-5xl border-t px-5 py-8 text-xs"
      >
        POSGuard · Built for Nigerian POS kiosk owners
      </footer>
    </div>
  );
}
