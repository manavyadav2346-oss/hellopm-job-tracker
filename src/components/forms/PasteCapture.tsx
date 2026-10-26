"use client";

import React, { useState } from "react";
import { captureApplicationText, CapturedDetails } from "@/lib/paste-capture";

export function PasteCapture({ onCapture, compact = false }: { onCapture: (details: CapturedDetails) => void; compact?: boolean }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  return <section className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
    <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="font-semibold text-sm text-indigo-800 text-left">{open ? "▾" : "▸"} Paste {compact ? "a message to fill this update" : "an email or job post to fill details"}</button>
    {!compact && <p className="text-xs text-stone-600">Skip retyping. Paste text, review the details below, then save.</p>}
    {open && <>
      <label className="block text-xs text-stone-700" htmlFor={compact ? "paste-update" : "paste-application"}>Paste the message text</label>
      <textarea id={compact ? "paste-update" : "paste-application"} value={text} onChange={e => setText(e.target.value)} maxLength={12000} rows={5} placeholder={compact ? "Paste a recruiter message or email…" : "Thanks for applying for the Product Analyst role at Acme.\n\nOr paste a job post with Company: and Role: details."} className="w-full border border-stone-300 rounded-lg p-3 text-sm bg-white" />
      <p className="text-xs text-stone-500">Text is processed in your browser. Nothing is saved until you confirm. Dates such as “Friday” or “29 October” need you to choose the full date.</p>
      {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
      <button type="button" disabled={!text.trim()} onClick={() => { try { const details = captureApplicationText(text); setError(""); onCapture(details); } catch (e) { setError(e instanceof Error ? e.message : "Could not read this text."); } }} className="rounded-lg px-4 py-2 bg-indigo-600 text-white text-sm font-medium disabled:opacity-50">{compact ? "Fill update for review" : "Fill application for review"}</button>
      <p className="text-xs text-stone-500">Check every field. Unrecognised details stay blank. {compact ? "Your application stage will not change." : "Pasting a job post does not mean you applied."}</p>
    </>}
  </section>;
}
