"use client";

import Link from "next/link";
import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Account recovery is currently unavailable. Please try again later.");
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to send the email. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-8 space-y-5">
      <h1 className="text-2xl font-bold text-stone-900">Reset your password</h1>
      <p className="text-sm text-stone-600">Enter the email you used for your Job Tracker account.</p>
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4">
        {sent ? (
          <div role="status" className="text-sm text-stone-700 space-y-3">
            <p>If an account exists for that email, you’ll receive a password reset link. Check your inbox and spam folder.</p>
            <p>Open the link in this same browser on this device. If you requested it in incognito, keep this window open and paste the email link into an incognito tab.</p>
            <p>Use the newest email. If it doesn’t arrive, wait a few minutes before requesting another.</p>
            <button onClick={() => { setSent(false); setError(""); }} className="text-indigo-600 hover:underline">Request another link</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <label htmlFor="recovery-email" className="block text-sm font-medium text-stone-700">Email address</label>
            <input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-lg border border-stone-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
            <button disabled={busy} className="w-full rounded-lg bg-indigo-600 p-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">{busy ? "Sending…" : "Send reset link"}</button>
          </form>
        )}
        <Link href="/auth" className="block text-sm text-indigo-600 hover:underline">Back to sign in</Link>
      </div>
    </div>
  );
}
