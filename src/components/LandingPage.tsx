import { useEffect, useState } from "react";

interface LandingPageProps {
  onOwnerClick: () => void;
  onOperatorClick: () => void;
}

const INK = "#0B0F0D";
const GOLD = "#E3A93B";
const PAPER = "#F4EFE2";
const EMERALD = "#2FAE6B";
const CLAY = "#C4592E";

const PAIN_POINTS = [
  {
    tint: "rgba(227,169,59,0.08)",
    accent: GOLD,
    title: "A shortage nobody can explain",
    body: "₦10,000 in the bag this morning, ₦120,000 moving through the terminal by night. When a customer needs a big withdrawal, cash gets moved around to cover it — by closing time nobody can say where the numbers actually landed.",
    rotate: "-1.2deg",
  },
  {
    tint: "rgba(47,174,107,0.08)",
    accent: EMERALD,
    title: "\u201cHe said, she said\u201d at closing time",
    body: "A shortage looks the same whether it's theft or an honest mistake, like giving a customer too much change. Owners end up guessing, and operators end up arguing.",
    rotate: "0.8deg",
  },
  {
    tint: "rgba(196,89,46,0.1)",
    accent: CLAY,
    title: "Charges that don't match the promise",
    body: "You expect Moniepoint to take ₦800 for the day. It takes ₦2,000. Across three or four kiosks, working out real profit by hand every night is slow, and easy to get wrong.",
    rotate: "-0.6deg",
  },
];

export function LandingPage({
  onOwnerClick,
  onOperatorClick,
}: LandingPageProps) {
  const [stamped, setStamped] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) {
      setStamped(true);
      return;
    }
    const timer = setTimeout(() => setStamped(true), 650);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ background: INK, color: PAPER }} className="min-h-screen overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7">
        <span
          style={{ fontFamily: "Fraunces, serif" }}
          className="text-xl font-medium tracking-tight"
        >
          POSGuard
        </span>
        <button
          type="button"
          onClick={onOwnerClick}
          style={{ color: PAPER }}
          className="text-sm underline decoration-transparent underline-offset-4 transition hover:decoration-current"
        >
          Owner sign in
        </button>
      </header>

      {/* HERO -- big asymmetric type block + stamp graphic, no dividers */}
      <section className="relative mx-auto max-w-6xl px-6 pb-24 pt-6 md:pb-36 md:pt-16">
        <div className="grid items-center gap-12 md:grid-cols-[1.3fr_1fr]">
          <div>
            <h1
              style={{ fontFamily: "Fraunces, serif", lineHeight: 0.98 }}
              className="text-[13vw] font-medium tracking-tight md:text-[5.2vw]"
            >
              Nothing leaves
              <br />
              the till unseen.
            </h1>
            <p
              style={{ color: "#B9B3A0" }}
              className="mt-7 max-w-md text-lg leading-relaxed"
            >
              POSGuard locks in a verified cash count at every kiosk, every
              shift — so a shortage gets caught the day it happens, and every
              honest naira gets a paper trail.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <button
                type="button"
                onClick={onOwnerClick}
                style={{ background: GOLD, color: INK }}
                className="rounded-full px-7 py-3.5 text-sm font-semibold transition hover:brightness-110"
              >
                I'm a kiosk owner
              </button>
              <button
                type="button"
                onClick={onOperatorClick}
                style={{ color: PAPER }}
                className="text-sm font-medium underline decoration-[#4a463a] underline-offset-4 transition hover:decoration-current"
              >
                I close a shift here →
              </button>
            </div>
          </div>

          {/* Stamp graphic -- the one orchestrated motion moment */}
          <div className="relative mx-auto flex h-56 w-56 items-center justify-center md:h-72 md:w-72">
            <svg
              viewBox="0 0 240 240"
              className="h-full w-full"
              style={{
                transform: stamped
                  ? "scale(1) rotate(-6deg)"
                  : "scale(1.6) rotate(8deg)",
                opacity: stamped ? 1 : 0,
                transition:
                  "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.25s ease",
              }}
            >
              <circle
                cx="120"
                cy="120"
                r="108"
                fill="none"
                stroke={EMERALD}
                strokeWidth="3"
              />
              <circle
                cx="120"
                cy="120"
                r="94"
                fill="none"
                stroke={EMERALD}
                strokeWidth="1.5"
                strokeDasharray="2 6"
              />
              <path id="stampArcTop" fill="none" d="M 40,120 A 80,80 0 0 1 200,120" />
              <path id="stampArcBottom" fill="none" d="M 200,128 A 80,80 0 0 1 40,128" />
              <text
                fill={EMERALD}
                fontSize="19"
                fontWeight={700}
                letterSpacing="4"
              >
                <textPath href="#stampArcTop" startOffset="50%" textAnchor="middle">
                  VERIFIED
                </textPath>
              </text>
              <text
                fill={EMERALD}
                fontSize="13"
                fontWeight={600}
                letterSpacing="3"
              >
                <textPath href="#stampArcBottom" startOffset="50%" textAnchor="middle">
                  BALANCED &amp; LOCKED
                </textPath>
              </text>
              <path
                d="M85 122 L108 145 L158 95"
                fill="none"
                stroke={EMERALD}
                strokeWidth="9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* PAIN POINTS -- offset panels, no hairlines, color as the separator */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2
          style={{ fontFamily: "Fraunces, serif" }}
          className="mb-10 max-w-lg text-3xl font-medium leading-tight md:text-4xl"
        >
          What owners keep telling us
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {PAIN_POINTS.map((point) => (
            <div
              key={point.title}
              style={{
                background: point.tint,
                transform: `rotate(${point.rotate})`,
              }}
              className="rounded-3xl p-7 transition hover:rotate-0"
            >
              <span
                style={{ background: point.accent }}
                className="mb-5 inline-block h-2.5 w-2.5 rounded-full"
              />
              <h3 className="mb-3 text-lg font-semibold">{point.title}</h3>
              <p style={{ color: "#B9B3A0" }} className="text-sm leading-relaxed">
                {point.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* LIVE vs COMING -- two big color blocks, no lines */}
      <section className="grid md:grid-cols-2">
        <div style={{ background: "#12241C" }} className="px-6 py-16 md:px-14">
          <p style={{ color: EMERALD }} className="mb-3 text-xs font-bold tracking-wide">
            WORKING TODAY
          </p>
          <h3
            style={{ fontFamily: "Fraunces, serif" }}
            className="mb-4 max-w-sm text-2xl font-medium leading-tight"
          >
            Verified, locked shift reconciliation
          </h3>
          <p style={{ color: "#A9C2B4" }} className="max-w-sm text-sm leading-relaxed">
            Opening cash, top-ups or float rebalancing, withdrawals,
            deposits, closing cash — the math is checked on the server, not
            the operator's phone, and once submitted it can't be edited by
            anyone.
          </p>
        </div>
        <div style={{ background: "#241C12" }} className="px-6 py-16 md:px-14">
          <p style={{ color: GOLD }} className="mb-3 text-xs font-bold tracking-wide">
            COMING SOON
          </p>
          <h3
            style={{ fontFamily: "Fraunces, serif" }}
            className="mb-4 max-w-sm text-2xl font-medium leading-tight"
          >
            Real profit after provider charges
          </h3>
          <p style={{ color: "#C2B4A0" }} className="max-w-sm text-sm leading-relaxed">
            See what Moniepoint or OPay actually deducted against what you
            expected, per kiosk, per day — so an unusual charge gets caught,
            not buried in a mental estimate.
          </p>
        </div>
      </section>

      {/* FINAL CTA -- bold solid block */}
      <section style={{ background: GOLD, color: INK }} className="px-6 py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6">
          <h2
            style={{ fontFamily: "Fraunces, serif" }}
            className="max-w-lg text-3xl font-medium leading-tight md:text-4xl"
          >
            Set up your first kiosk in two minutes.
          </h2>
          <button
            type="button"
            onClick={onOwnerClick}
            style={{ background: INK, color: PAPER }}
            className="rounded-full px-7 py-3.5 text-sm font-semibold transition hover:brightness-125"
          >
            Create your owner account
          </button>
          <p className="text-sm opacity-70">
            ₦1,000/kiosk/month founding rate for your first kiosks.
          </p>
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-xs" style={{ color: "#5A564A" }}>
        POSGuard · Built for Nigerian POS kiosk owners
      </footer>
    </div>
  );
}
