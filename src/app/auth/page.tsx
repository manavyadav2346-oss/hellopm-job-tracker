"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  Database,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
} from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const { user, isConfigured, isPreviewMode, setPreviewMode, signOut } = useApp();

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!isConfigured) {
      setError(
        "Supabase credentials are not configured in .env.local yet. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, or continue exploring in Sample Preview mode."
      );
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabase client is not available.");
      return;
    }

    try {
      setIsLoading(true);

      if (tab === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (signUpError) {
          throw signUpError;
        }

        if (data.session) {
          setPreviewMode(false);
          setSuccessMessage("Account created successfully! Real accounts start completely empty.");
          setTimeout(() => router.push("/applications"), 1500);
        } else {
          setSuccessMessage(
            "Check your inbox for a confirmation email before signing in."
          );
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          throw signInError;
        }

        setPreviewMode(false);
        router.push("/applications");
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err?.message || "Authentication failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyEnvSnippet = () => {
    navigator.clipboard.writeText(
      `NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key-here`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
          Your Job Tracker account
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Sign in to save your applications, updates, and next actions.
        </p>
      </div>

      {/* Already logged in view */}
      {user ? (
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-500">Currently signed in as</p>
              <h3 className="text-base font-semibold text-stone-900">{user.email}</h3>
            </div>
          </div>

          <div className="text-xs text-stone-600 bg-stone-50 p-3 rounded-lg border border-stone-200 space-y-1">
            <p>Your applications and updates are saved to your account.</p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100">
            <button
              onClick={() => {
                setPreviewMode(true);
                router.push("/");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-medium text-stone-700 hover:bg-stone-50"
            >
              <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
              <span>Switch to Sample Preview</span>
            </button>

            <button
              onClick={signOut}
              className="px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      ) : (
        /* Sign In / Sign Up Form & Setup Guide */
        <div className="space-y-6">
          {/* Sample Preview Quick Card */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 uppercase tracking-wide">
                <FlaskConical className="w-3.5 h-3.5" />
                Sample Preview Available
              </span>
              <p className="text-xs text-amber-950 font-medium">
                Want to test the full MVP immediately without creating a cloud account?
              </p>
              <p className="text-[11px] text-amber-800">
                Explore fictional applicants, due dates, and interaction timelines. Isolated from real data.
              </p>
            </div>
            <button
              onClick={() => {
                setPreviewMode(true);
                router.push("/");
              }}
              className="px-3.5 py-2 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 font-semibold text-xs whitespace-nowrap transition-colors self-start sm:self-auto"
            >
              Launch Sample Preview
            </button>
          </div>

          {/* Cloud Auth Form */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm space-y-5">
            {/* Tab switch */}
            <div className="flex border-b border-stone-200">
              <button
                type="button"
                onClick={() => {
                  setTab("signin");
                  setError(null);
                  setSuccessMessage(null);
                }}
                className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  tab === "signin"
                    ? "border-indigo-600 text-indigo-700"
                    : "border-transparent text-stone-500 hover:text-stone-800"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("signup");
                  setError(null);
                  setSuccessMessage(null);
                }}
                className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  tab === "signup"
                    ? "border-indigo-600 text-indigo-700"
                    : "border-transparent text-stone-500 hover:text-stone-800"
                }`}
              >
                Create Account (New User)
              </button>
            </div>

            {/* Error & Success Alerts */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {!isConfigured && (
              <div className="p-3 bg-stone-50 border border-stone-200 text-xs text-stone-600 space-y-1">
                <p className="font-semibold text-stone-800">
                  Supabase Cloud Status: Not Connected in Environment
                </p>
                <p>
                  To enable real user authentication and cloud database persistence, supply <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> in your <code>.env.local</code>.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-medium text-stone-700 mb-1"
                >
                  Email address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-medium text-stone-700 mb-1"
                >
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
                {tab === "signup" && (
                  <span className="text-[11px] text-stone-500 mt-1 block">
                    Must be at least 6 characters. Real accounts start completely empty.
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-sm shadow-sm transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {isLoading
                  ? "Processing..."
                  : tab === "signin"
                  ? "Sign In to Cloud Account"
                  : "Create Cloud Account"}
              </button>
            </form>
          </div>

          {/* Show developer setup only when the app is not configured. */}
          {!isConfigured && (<div className="bg-stone-50 rounded-xl border border-stone-200 p-5 text-xs text-stone-700 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-stone-900 text-sm">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>How to connect your Supabase database</span>
            </div>

            <ol className="list-decimal list-inside space-y-2 text-stone-600 leading-relaxed">
              <li>
                Create a free project at{" "}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 underline font-medium"
                >
                  supabase.com
                </a>
                .
              </li>
              <li>
                Open the Supabase <strong>SQL Editor</strong> and execute the migration file located at:
                <code className="block my-1 px-2 py-1 bg-stone-200/80 rounded text-stone-800 font-mono text-[11px]">
                  supabase/migrations/0001_initial_schema.sql
                </code>
              </li>
              <li>
                Copy your Project URL and Anon Key from <strong>Project Settings → API</strong> into a local <code>.env.local</code> file in this folder:
                <div className="relative mt-1">
                  <pre className="p-2.5 bg-stone-900 text-stone-100 rounded-lg text-[11px] font-mono overflow-x-auto">
                    {`NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJh...`}
                  </pre>
                  <button
                    onClick={copyEnvSnippet}
                    className="absolute top-2 right-2 p-1 rounded bg-stone-700 hover:bg-stone-600 text-stone-200"
                    title="Copy template"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </li>
            </ol>
          </div>)}
        </div>
      )}
    </div>
  );
}
