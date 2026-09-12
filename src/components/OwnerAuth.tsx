import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface OwnerAuthProps {
  isDarkMode: boolean;
  onClose: () => void;
}

export function OwnerAuth({ isDarkMode, onClose }: OwnerAuthProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClass = `w-full rounded-xl border p-3 text-base outline-none focus:border-emerald-500 ${
    isDarkMode
      ? "border-zinc-700 bg-zinc-950 text-zinc-100"
      : "border-zinc-300 bg-white text-zinc-900"
  }`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const { error: authError } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setIsSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (mode === "signup") {
      setError(
        "Account created. Check your email to confirm it, then sign in.",
      );
      setMode("signin");
      return;
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 p-4">
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-sm rounded-2xl border p-6 ${
          isDarkMode ? "border-zinc-700 bg-zinc-900" : "border-zinc-200 bg-white"
        }`}
      >
        <h2 className="text-xl font-bold">
          {mode === "signin" ? "Owner sign in" : "Create owner account"}
        </h2>
        <p className="mb-4 mt-1 text-sm text-zinc-500">
          {mode === "signin"
            ? "Sign in to see every kiosk you own."
            : "One account can manage every kiosk you register."}
        </p>

        <div className="space-y-3">
          <input
            type="email"
            required
            autoFocus
            placeholder="you@business.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
            aria-label="Email"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
            aria-label="Password"
          />
        </div>

        {error && <p className="mt-3 text-sm text-rose-500">{error}</p>}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-700 p-3"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-emerald-600 p-3 font-bold text-white disabled:opacity-50"
          >
            {isSubmitting
              ? "Please wait..."
              : mode === "signin"
                ? "Sign in"
                : "Sign up"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setError("");
            setMode((current) => (current === "signin" ? "signup" : "signin"));
          }}
          className="mt-4 w-full text-center text-xs text-zinc-500 underline"
        >
          {mode === "signin"
            ? "New owner? Create an account"
            : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
