"use client";

import React, { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { InteractionType, CommunicationState } from "@/types/job";
import { getTodayLocalDateString } from "@/lib/dates";
import { AlertCircle } from "lucide-react";

interface AddInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddInteraction: (data: {
    interaction_date: string;
    type: InteractionType;
    summary: string;
    details?: string;
    newCommState?: CommunicationState;
  }) => Promise<void>;
  currentCommState: CommunicationState;
}

const INTERACTION_TYPES: InteractionType[] = [
  "Note / Update",
  "Email Received",
  "Email Sent",
  "Recruiter Call",
  "Technical Interview",
  "Behavioral Interview",
  "Take-home Assessment",
  "Offer Discussion",
  "Status Check",
];

export function AddInteractionModal({
  isOpen,
  onClose,
  onAddInteraction,
  currentCommState,
}: AddInteractionModalProps) {
  const today = getTodayLocalDateString();
  const [date, setDate] = useState(today);
  const [type, setType] = useState<InteractionType>("Note / Update");
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [commState, setCommState] = useState<CommunicationState>(currentCommState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setDate(today);
      setType("Note / Update");
      setSummary("");
      setDetails("");
      setCommState(currentCommState);
      setError(null);
    }
  }, [isOpen, today, currentCommState]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (date > today) { setError("Use today or an earlier date. For a future task, set a Next action instead."); return; }
    if (!summary.trim()) {
      setError("Please provide a brief summary of the interaction.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onAddInteraction({
        interaction_date: date,
        type,
        summary: summary.trim(),
        details: details.trim() || undefined,
        newCommState: commState !== currentCommState ? commState : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to log interaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add an update"
      description="Record something that already happened, such as a recruiter email or a completed interview. This saves a dated note; it does not send messages or create reminders."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="int-date"
              className="block text-xs font-medium text-stone-700 mb-1"
            >
              Date <span className="text-rose-500">*</span>
            </label>
            <input
              id="int-date"
              type="date"
              required
              max={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          <div>
            <label
              htmlFor="int-type"
              className="block text-xs font-medium text-stone-700 mb-1"
            >
              What happened?
            </label>
            <select
              id="int-type"
              value={type}
              onChange={(e) => setType(e.target.value as InteractionType)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {INTERACTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="int-summary"
            className="block text-xs font-medium text-stone-700 mb-1"
          >
            Summary <span className="text-rose-500">*</span>
          </label>
          <input
            id="int-summary"
            type="text"
            required
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="e.g. Phone screen with hiring manager completed"
            className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        <div>
          <label
            htmlFor="int-details"
            className="block text-xs font-medium text-stone-700 mb-1"
          >
            Details & Notes (Optional)
          </label>
          <textarea
            id="int-details"
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Key discussion points, questions asked, next steps mentioned..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white resize-none"
          />
        </div>

        <div className="pt-2 border-t border-stone-100">
          <label
            htmlFor="int-comm-state"
            className="block text-xs font-medium text-stone-700 mb-1"
          >
            Latest reply status
          </label>
          <select
            id="int-comm-state"
            value={commState}
            onChange={(e) => setCommState(e.target.value as CommunicationState)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="No update received">No update received</option>
            <option value="Awaiting reply">Awaiting reply</option>
            <option value="Update received">Update received</option>
            <option value="Discussion ongoing">Discussion ongoing</option>
          </select>
        </div>

        <p className="text-xs text-stone-500">Need to follow up later? Save this update, then set a Next action on the application. Received a rejection? Cancel and choose Mark rejected.</p>
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
            {isSubmitting ? "Saving..." : "Save update"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
