"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { NextAction } from "@/types/job";
import { DataService } from "@/lib/data-service";
import { useApp } from "@/context/AppContext";
import { ActionCard } from "@/components/actions/ActionCard";
import { RescheduleModal } from "@/components/actions/RescheduleModal";
import { CompleteModal } from "@/components/actions/CompleteModal";
import {
  AlertCircle,
  CheckCircle2,
  Calendar,
  PlusCircle,
  Briefcase,
  Clock,
  Sparkles,
} from "lucide-react";

export default function NeedsAttentionPage() {
  const { isPreviewMode, user } = useApp();
  const [dueAndOverdue, setDueAndOverdue] = useState<NextAction[]>([]);
  const [upcoming, setUpcoming] = useState<NextAction[]>([]);
  const [applicationCount, setApplicationCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [actionToReschedule, setActionToReschedule] = useState<NextAction | null>(null);
  const [actionToComplete, setActionToComplete] = useState<NextAction | null>(null);

  const loadActions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [res, applications] = await Promise.all([
        DataService.getDueAndUpcomingActions(user?.id),
        DataService.getApplications(user?.id),
      ]);
      setApplicationCount(applications.length);
      setDueAndOverdue(res.dueAndOverdue);
      setUpcoming(res.upcoming);
    } catch (err: any) {
      console.error("Failed to load actions:", err);
      setError(err?.message || "Failed to load actions.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadActions();

    const handleUpdate = () => loadActions();
    window.addEventListener("preview-mode-changed", handleUpdate);
    window.addEventListener("preview-data-reset", handleUpdate);

    return () => {
      window.removeEventListener("preview-mode-changed", handleUpdate);
      window.removeEventListener("preview-data-reset", handleUpdate);
    };
  }, [loadActions]);

  const handleReschedule = async (actionId: string, newDueDate: string, notes?: string) => {
    await DataService.rescheduleAction(actionId, newDueDate, notes, user?.id);
    await loadActions();
  };

  const handleComplete = async (actionId: string, notes?: string) => {
    await DataService.completeAction(actionId, notes, user?.id);
    await loadActions();
  };

  const totalActionsCount = dueAndOverdue.length + upcoming.length;

  return (
    <div className="space-y-8">
      {/* View Header with prominent single primary action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Needs attention
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Focus on due and overdue actions you committed to take across your active applications.
          </p>
        </div>

        <Link
          href="/applications/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none flex-shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add application</span>
        </Link>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to load actions</p>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            <button
              onClick={loadActions}
              className="text-xs font-semibold text-rose-800 underline mt-2"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-4 py-8">
          <div className="h-6 w-48 bg-stone-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 bg-white rounded-xl border border-stone-200 p-4 animate-pulse space-y-3"
              >
                <div className="h-4 w-1/4 bg-stone-200 rounded" />
                <div className="h-5 w-3/4 bg-stone-200 rounded" />
                <div className="h-3 w-1/2 bg-stone-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* SECTION 1: Due and Overdue Actions */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2">
                <AlertCircle
                  className={`w-4 h-4 ${
                    dueAndOverdue.length > 0 ? "text-rose-600" : "text-stone-400"
                  }`}
                />
                <span>Due & Overdue Actions</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-stone-100 text-stone-700">
                  {dueAndOverdue.length}
                </span>
              </h2>
            </div>

            {dueAndOverdue.length === 0 ? (
              <div className="p-6 bg-white rounded-xl border border-stone-200 text-center space-y-2 shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h3 className="text-sm font-semibold text-stone-800">
                  No due or overdue actions
                </h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  You are completely caught up on your immediate tasks! Review upcoming actions below or log an update on an application.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {dueAndOverdue.map((action) => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    onOpenReschedule={(act) => setActionToReschedule(act)}
                    onOpenComplete={(act) => setActionToComplete(act)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* SECTION 2: Upcoming Actions */}
          <section className="space-y-3 pt-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-stone-500" />
                <span>Upcoming Actions</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-stone-100 text-stone-700">
                  {upcoming.length}
                </span>
              </h2>
            </div>

            {upcoming.length === 0 ? (
              <div className="p-6 bg-white rounded-xl border border-dashed border-stone-200 text-center text-xs text-stone-400">
                No upcoming actions scheduled for future dates.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {upcoming.map((action) => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    onOpenReschedule={(act) => setActionToReschedule(act)}
                    onOpenComplete={(act) => setActionToComplete(act)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Empty state when absolutely no actions exist across the board */}
          {!error && totalActionsCount === 0 && (
            <div className="p-8 bg-white rounded-xl border border-stone-200 text-center space-y-3 shadow-sm">
              <Briefcase className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="text-base font-semibold text-stone-900">
                {applicationCount === 0 ? "Start tracking your applications" : "No next actions scheduled"}
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                {applicationCount === 0
                  ? "Add an application to keep its updates and any next steps together."
                  : "Review your applications to log an update or set a next action when you have something to do."}
              </p>
              <div className="pt-2">
                <Link
                  href={applicationCount === 0 ? "/applications/new" : "/applications"}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{applicationCount === 0 ? "Add your first application" : "View applications"}</span>
                </Link>
              </div>
            </div>
          )}
        </>
      )}

      {/* Reschedule Modal */}
      <RescheduleModal
        action={actionToReschedule}
        isOpen={Boolean(actionToReschedule)}
        onClose={() => setActionToReschedule(null)}
        onReschedule={handleReschedule}
      />

      {/* Complete Modal */}
      <CompleteModal
        action={actionToComplete}
        isOpen={Boolean(actionToComplete)}
        onClose={() => setActionToComplete(null)}
        onComplete={handleComplete}
      />
    </div>
  );
}
