import { useEffect, useState } from "react";
import { LogOut, Moon, Shield, Sun } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { OperatorView } from "@/components/OperatorView";
import { OwnerAuth } from "@/components/OwnerAuth";
import { OwnerDashboard } from "@/components/OwnerDashboard";

type View = "operator" | "owner";

export default function App() {
  const [view, setView] = useState<View>("operator");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showOwnerAuth, setShowOwnerAuth] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) setView("owner");
    });
    return () => subscription.unsubscribe();
  }, []);

  function handleOwnerButtonClick() {
    if (session) {
      setView("owner");
    } else {
      setShowOwnerAuth(true);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setView("operator");
  }

  return (
    <main
      className={`min-h-screen p-4 font-sans antialiased ${
        isDarkMode ? "bg-zinc-950 text-zinc-100" : "bg-zinc-50 text-zinc-900"
      }`}
    >
      <div className="mx-auto w-full max-w-3xl pb-10">
        <header className="mb-6 flex items-center justify-between border-b border-zinc-700 py-4">
          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-emerald-600 p-2 text-white">
              <Shield aria-hidden="true" size={20} />
            </span>
            <div>
              <h1 className="text-xl font-bold text-emerald-500">POSGuard</h1>
              <p className="text-xs text-zinc-500">
                {view === "operator" ? "Operator" : "Owner dashboard"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {view === "operator" ? (
              <button
                type="button"
                onClick={handleOwnerButtonClick}
                className="rounded-xl border border-zinc-700 px-3 py-2 text-sm"
              >
                Owner
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-xl border border-zinc-700 p-2"
                aria-label="Sign out of owner view"
              >
                <LogOut size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsDarkMode((current) => !current)}
              className="rounded-xl border border-zinc-700 p-2"
              aria-label="Toggle colour theme"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {!isSupabaseConfigured && (
          <div className="mb-6 rounded-xl border border-amber-500 bg-amber-500/10 p-4 text-sm">
            <strong className="block text-amber-500">
              Supabase isn't configured yet
            </strong>
            <p className="mt-1 text-zinc-400">
              Copy <code>.env.example</code> to <code>.env.local</code>, add
              your Supabase project URL and anon key, and run{" "}
              <code>supabase/schema.sql</code> in the SQL editor.
            </p>
          </div>
        )}

        {view === "operator" ? (
          <OperatorView isDarkMode={isDarkMode} />
        ) : session ? (
          <OwnerDashboard isDarkMode={isDarkMode} />
        ) : (
          <p className="text-center text-zinc-500">Signing in...</p>
        )}
      </div>

      {showOwnerAuth && (
        <OwnerAuth
          isDarkMode={isDarkMode}
          onClose={() => setShowOwnerAuth(false)}
        />
      )}
    </main>
  );
}
