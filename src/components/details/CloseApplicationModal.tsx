"use client";

import React, { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { ClosedReason } from "@/types/job";
import { AlertCircle, AlertTriangle } from "lucide-react";

interface CloseApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCloseApplication: (reason: ClosedReason, notes?: string) => Promise<void>;
  company: string;
  role: string;
}

const CLOSED_REASONS: ClosedReason[] = [
  "Rejected",
  "Withdrawn",
  "Offer Accepted",
  "Offer Declined",
  "Position Cancelled",
  "Other",
];

export function CloseApplicationModal({
  isOpen,
  onClose,
  onCloseApplication,
  company,
  role,
}: CloseApplicationModalProps) {
  const [reason, setReason] = useState<ClosedReason>("Rejected");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      await onCloseApplication(reason, notes.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to close application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Close Application"
      description={`Archive ${role} at ${company}.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Product Rule Notice */}
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Important Product Rule</span>
          </div>
          <p>
            Closing an application removes outstanding tasks from <strong>Needs attention</strong> while preserving all interaction history and records.
          </p>
          <p className="text-[11px] text-amber-800">
            Remember: &ldquo;No update received&rdquo; does not mean you must close it unless you have decided to withdraw or received formal notification.
          </p>
        </div>

        <div>
          <label
            htmlFor="close-reason"
            className="block text-xs font-semibold text-stone-700 mb-1"
          >
            Reason for closing <span className="text-rose-500">*</span>
          </label>
          <select
            id="close-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value as ClosedReason)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
          >
            {CLOSED_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="close-notes"
            className="block text-xs font-medium text-stone-700 mb-1"
          >
            Closing Notes (Optional)
          </label>
          <textarea
            id="close-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Received rejection email; feedback noted for system design."
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
            className="px-4 py-2 text-xs font-medium bg-stone-800 hover:bg-stone-900 disabled:opacity-50 text-white rounded-lg shadow-sm transition-colors"
          >
            {isSubmitting ? "Closing..." : "Confirm Close"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
