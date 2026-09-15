import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface ResetPasswordProps {
  isDarkMode: boolean;
  onDone: () => void;
}

export function ResetPassword({ isDarkMode, onDone }: ResetPasswordProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setIsSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    setIsSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    onDone();
  }

  return (
    <div
      className={`flex min-h-screen items-center justify-center p-4 ${
        isDarkMode ? "bg-zinc-950 text-zinc-100" : "bg-zinc-50 text-zinc-900"
      }`}
    >
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-sm rounded-2xl border p-6 ${
          isDarkMode ? "border-zinc-700 bg-zinc-900" : "border-zinc-200 bg-white"
        }`}
      >
        <h2 className="text-xl font-bold">Set a new password</h2>
        <p className="mb-4 mt-1 text-sm text-zinc-500">
          Choose a password you'll remember for your POSGuard account.
        </p>
        <div className="space-y-3">
          <input
            type="password"
            required
            autoFocus
            minLength={6}
            placeholder="New password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={inputClass}
          />
        </div>
        {error && <p className="mt-3 text-sm text-rose-500">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 w-full rounded-xl bg-emerald-600 p-3 font-bold text-white disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save new password"}
        </button>
      </form>
    </div>
  );
}
