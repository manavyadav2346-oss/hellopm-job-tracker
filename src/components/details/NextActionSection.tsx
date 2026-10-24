"use client";

import React, { useState } from "react";
import { NextAction, ActionType } from "@/types/job";
import { DueBadge, ActionTypeBadge } from "@/components/common/Badge";
import { formatLocalDate, getDueCategory, getTodayLocalDateString, addDaysToLocalDateString } from "@/lib/dates";
import { Modal } from "@/components/common/Modal";
import {
  Clock,
  Check,
  Calendar,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  History,
} from "lucide-react";

interface NextActionSectionProps {
  activeAction: NextAction | null;
  completedActions?: NextAction[];
  hasContactInfo: boolean;
  onOpenReschedule: (action: NextAction) => void;
  onOpenComplete: (action: NextAction) => void;
  onAddNextAction: (actionData: {
    title: string;
    action_type: ActionType;
    due_date: string;
    notes?: string;
  }) => Promise<void>;
  isClosed?: boolean;
}

export function NextActionSection({
  activeAction,
  completedActions = [],
  hasContactInfo,
  onOpenReschedule,
  onOpenComplete,
  onAddNextAction,
  isClosed = false,
}: NextActionSectionProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [actionType, setActionType] = useState<ActionType>("check_portal");
  const [dueDate, setDueDate] = useState(addDaysToLocalDateString(getTodayLocalDateString(), 3));
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRecruiterFollowUpWithoutContact =
    actionType === "recruiter_follow_up" && !hasContactInfo;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Action title is required.");
      return;
    }
    if (!dueDate) {
      setError("Due date is required.");
      return;
    }
    if (isRecruiterFollowUpWithoutContact) {
      setError(
        "A recruiter follow-up action requires a contact or channel on this application. Please choose another action (e.g. check portal) or add a contact person."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onAddNextAction({
        title: title.trim(),
        action_type: actionType,
        due_date: dueDate,
        notes: notes.trim() || undefined,
      });
      setIsAddModalOpen(false);
      setTitle("");
      setNotes("");
    } catch (err: any) {
      setError(err?.message || "Failed to set next action.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          <span>Current Next Action</span>
        </h3>

        {!activeAction && !isClosed && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Set next action</span>
          </button>
        )}
      </div>

      {/* Active Action Display */}
      {activeAction ? (
        <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <DueBadge
                  category={getDueCategory(activeAction.due_date)}
                  text={formatLocalDate(activeAction.due_date, { includeRelative: true })}
                />
                <ActionTypeBadge type={activeAction.action_type} />
                {activeAction.rescheduled_count > 0 && (
                  <span className="text-[11px] text-stone-400">
                    Rescheduled ×{activeAction.rescheduled_count}
                  </span>
                )}
              </div>
              <h4 className="text-base font-semibold text-stone-900 leading-snug">
                {activeAction.title}
              </h4>
              {activeAction.notes && (
                <p className="text-xs text-stone-600 italic">
                  &ldquo;{activeAction.notes}&rdquo;
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0 pt-2 sm:pt-0">
              <button
                onClick={() => onOpenComplete(activeAction)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Complete</span>
              </button>
              <button
                onClick={() => onOpenReschedule(activeAction)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>Reschedule</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-stone-400 bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
          {isClosed ? (
            <p>Application is closed. No active actions are pending.</p>
          ) : (
            <div className="space-y-2">
              <p>No pending next action scheduled.</p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add an action</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Completed actions history (Retains History rule) */}
      {completedActions.length > 0 && (
        <div className="pt-3 border-t border-stone-100 space-y-2">
          <span className="text-xs font-semibold text-stone-600 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-stone-400" />
            <span>Completed Actions History</span>
          </span>
          <div className="space-y-1.5">
            {completedActions.map((act) => (
              <div
                key={act.id}
                className="p-2.5 rounded-lg bg-stone-50/60 border border-stone-200/70 text-xs flex items-start justify-between gap-2"
              >
                <div>
                  <p className="font-medium text-stone-800 line-through text-stone-500">
                    {act.title}
                  </p>
                  {act.notes && (
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {act.notes}
                    </p>
                  )}
                </div>
                <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  Completed
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal to add next action */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Set Next Action"
        description="Choose a specific task and date to keep your application moving."
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
              {error}
            </div>
          )}

          {isRecruiterFollowUpWithoutContact && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Contact info required</span>
              </div>
              <p>
                A recruiter follow-up action requires a contact or channel on this application. Please choose another action (e.g. check portal, prepare materials) or update the application with contact details first.
              </p>
            </div>
          )}

          <div>
            <label
              htmlFor="modal-action-title"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              Action Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="modal-action-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Check portal for round 2 status"
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="modal-action-type"
                className="block text-xs font-semibold text-stone-700 mb-1"
              >
                Action Type
              </label>
              <select
                id="modal-action-type"
                value={actionType}
                onChange={(e) => setActionType(e.target.value as ActionType)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="check_portal">Check portal</option>
                <option value="recruiter_follow_up">Recruiter follow-up</option>
                <option value="prepare_materials">Prepare materials</option>
                <option value="send_update">Send update</option>
                <option value="custom">Custom action</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="modal-due-date"
                className="block text-xs font-semibold text-stone-700 mb-1"
              >
                Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                id="modal-due-date"
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="modal-action-notes"
              className="block text-xs font-medium text-stone-700 mb-1"
            >
              Notes (Optional)
            </label>
            <textarea
              id="modal-action-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Specific questions to ask, link to portal..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isRecruiterFollowUpWithoutContact}
              className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg shadow-sm transition-colors"
            >
              {isSubmitting ? "Saving..." : "Set Action"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
