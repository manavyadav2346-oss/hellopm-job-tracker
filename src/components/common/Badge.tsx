import React from "react";
import { ApplicationStage, CommunicationState, DueCategory } from "@/types/job";

export function StageBadge({ stage }: { stage: ApplicationStage }) {
  const styles: Record<ApplicationStage, string> = {
    Draft: "bg-stone-100 text-stone-700 border-stone-200",
    Applied: "bg-blue-50 text-blue-700 border-blue-200",
    Screening: "bg-indigo-50 text-indigo-700 border-indigo-200",
    Interviewing: "bg-purple-50 text-purple-700 border-purple-200",
    Offer: "bg-emerald-50 text-emerald-800 border-emerald-200",
    Closed: "bg-stone-100 text-stone-600 border-stone-300",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[stage] || styles.Applied}`}
    >
      {stage}
    </span>
  );
}

export function CommStateBadge({ state }: { state: CommunicationState }) {
  // Use "No update received" for communication state, separate from application stage
  // Calm, neutral styling so no response is never visually mistaken for rejection
  const styles: Record<CommunicationState, string> = {
    "No update received": "bg-stone-100 text-stone-600 border-stone-200",
    "Awaiting reply": "bg-amber-50 text-amber-800 border-amber-200",
    "Update received": "bg-sky-50 text-sky-800 border-sky-200",
    "Discussion ongoing": "bg-indigo-50 text-indigo-700 border-indigo-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[state] || styles["No update received"]}`}
      title={`Communication state: ${state}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {state}
    </span>
  );
}

export function DueBadge({ category, text }: { category: DueCategory; text: string }) {
  const styles: Record<DueCategory, string> = {
    overdue: "bg-rose-50 text-rose-800 border-rose-200 font-semibold",
    due_today: "bg-amber-50 text-amber-900 border-amber-200 font-medium",
    upcoming: "bg-stone-100 text-stone-700 border-stone-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${styles[category]}`}
    >
      {text}
    </span>
  );
}

export function ActionTypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    recruiter_follow_up: "Recruiter Follow-up",
    check_portal: "Task: Check portal",
    prepare_materials: "Prepare Materials",
    send_update: "Send Update",
    custom: "Action",
  };

  return (
    <span title="Task category, not a link" className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">
      {labels[type] || type}
    </span>
  );
}
