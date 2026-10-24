"use client";

import React, { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { NextAction } from "@/types/job";
import {
  getTodayLocalDateString,
  addDaysToLocalDateString,
  formatLocalDate,
} from "@/lib/dates";
import { Calendar, Clock, AlertCircle } from "lucide-react";

interface RescheduleModalProps {
  action: NextAction | null;
  isOpen: boolean;
  onClose: () => void;
  onReschedule: (actionId: string, newDueDate: string, notes?: string) => Promise<void>;
}

export function RescheduleModal({
  action,
  isOpen,
  onClose,
  onReschedule,
}: RescheduleModalProps) {
  const today = getTodayLocalDateString();
  const [newDueDate, setNewDueDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (action) {
      // Default to tomorrow or +3 days
      const defaultDate = addDaysToLocalDateString(today, 2);
      setNewDueDate(defaultDate);
      setNotes("");
      setError(null);
    }
  }, [action, today]);

  if (!action) return null;

  const quickDates = [
    { label: "Tomorrow", date: addDaysToLocalDateString(today, 1) },
    { label: "In 3 days", date: addDaysToLocalDateString(today, 3) },
    { label: "Next week (+7d)", date: addDaysToLocalDateString(today, 7) },
    { label: "In 2 weeks (+14d)", date: addDaysToLocalDateString(today, 14) },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDueDate) {
      setError("Please select a new due date.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onReschedule(action.id, newDueDate, notes.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to reschedule action.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reschedule Action"
      description={`Update deadline for "${action.title}" at ${action.company || "Company"}.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="text-xs text-stone-500 bg-stone-50 p-3 rounded-lg border border-stone-200">
          <p>
            Current due date:{" "}
            <span className="font-semibold text-stone-800">
              {formatLocalDate(action.due_date, { includeRelative: true })}
            </span>
            {action.rescheduled_count > 0 && (
              <span className="ml-1 text-stone-400">
                (Rescheduled {action.rescheduled_count} time{action.rescheduled_count > 1 ? "s" : ""})
              </span>
            )}
          </p>
        </div>

        {/* Quick Date Pills */}
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1.5">
            Quick suggestions
          </label>
          <div className="flex flex-wrap gap-2">
            {quickDates.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setNewDueDate(item.date)}
                className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${
                  newDueDate === item.date
                    ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                    : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Input */}
        <div>
          <label
            htmlFor="new-due-date"
            className="block text-xs font-medium text-stone-700 mb-1"
          >
            New due date <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              id="new-due-date"
              type="date"
              required
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">
            Date behaves consistently in your local timezone.
          </span>
        </div>

        {/* Reschedule Notes */}
        <div>
          <label
            htmlFor="reschedule-notes"
            className="block text-xs font-medium text-stone-700 mb-1"
          >
            Reason or update notes (Optional)
          </label>
          <textarea
            id="reschedule-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Waiting for recruiter to return from conference..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg shadow-sm transition-colors"
          >
            {isSubmitting ? "Saving..." : "Save new date"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
