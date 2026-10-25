"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [checking, setChecking] = useState(true);
  const [account, setAccount] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseClient();
    const params = new URLSearchParams(window.location.search);
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    if (!supabase || params.has("error") || fragment.has("error")) {
      setError("This reset link is invalid or has expired. Request a new link below.");
      setChecking(false);
      return;
    }
    // The browser client initializes and exchanges the PKCE code automatically.
    // Do not exchange it again: recovery codes are single-use.
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.session) {
        setError("We couldn’t verify your reset link. Open the newest link in the same browser where you requested it, or request another below.");
      } else {
        setAccount(data.session.user.email || "your account");
      }
      setChecking(false);
    }).catch(() => {
      if (!active) return;
      setError("Unable to verify the link. Please request a new one.");
      setChecking(false);
    });
    return () => { active = false; };
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 8) { setError("Use at least 8 characters."); return; }
    if (password !== confirmation) { setError("The passwords don’t match. Please enter them again."); return; }
    setBusy(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Account recovery is currently unavailable.");
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) { setAccount(null); throw new Error("Your session has expired. Request a new reset link."); }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      setConfirmation("");
      setDone(true);
      // Password change succeeded even if the subsequent local sign-out fails.
      await supabase.auth.signOut({ scope: "local" });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to update your password. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-8 space-y-5">
      <h1 className="text-2xl font-bold text-stone-900">Choose a new password</h1>
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
        {checking ? <p role="status" className="text-sm text-stone-600">Checking your reset link…</p> : done ? (
          <div role="status" className="space-y-3 text-sm text-stone-700">
            <p>Your password has been updated. Sign in with your new password.</p>
            <Link href="/auth" className="block font-medium text-indigo-600 hover:underline">Go to sign in</Link>
          </div>
        ) : (
          <>
            {account && <p className="text-sm text-stone-600 break-all">Updating the password for <strong>{account}</strong>.</p>}
            {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
            {account && <form onSubmit={submit} className="space-y-4">
              <label htmlFor="new-password" className="block text-sm font-medium text-stone-700">New password (at least 8 characters)</label>
              <input id="new-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-lg border border-stone-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <label htmlFor="confirm-password" className="block text-sm font-medium text-stone-700">Confirm new password</label>
              <input id="confirm-password" type="password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={e => setConfirmation(e.target.value)} className="w-full rounded-lg border border-stone-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button disabled={busy} className="w-full rounded-lg bg-indigo-600 p-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">{busy ? "Saving…" : "Save new password"}</button>
            </form>}
            <Link href="/auth/forgot-password" className="block text-sm text-indigo-600 hover:underline">Request a new reset link</Link>
            <Link href="/auth" className="block text-sm text-stone-600 hover:underline">Back to sign in</Link>
          </>
        )}
      </div>
    </div>
  );
}
