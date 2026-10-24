"use client";

import React, { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { NextAction } from "@/types/job";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface CompleteModalProps {
  action: NextAction | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (actionId: string, notes?: string) => Promise<void>;
}

export function CompleteModal({
  action,
  isOpen,
  onClose,
  onComplete,
}: CompleteModalProps) {
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (action) {
      setNotes("");
      setError(null);
    }
  }, [action]);

  if (!action) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      await onComplete(action.id, notes.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to mark action as completed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Action"
      description={`Mark "${action.title}" as completed.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs text-stone-600 space-y-1">
          <p className="font-semibold text-stone-800">
            {action.company} • {action.role}
          </p>
          <p>
            Task history is permanently preserved. Completing this will archive the action and add an entry to the application&apos;s interaction log.
          </p>
        </div>

        <div>
          <label
            htmlFor="completion-notes"
            className="block text-xs font-medium text-stone-700 mb-1"
          >
            Outcome or reflection notes (Optional)
          </label>
          <textarea
            id="completion-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Sent polite follow-up email. Sarah mentioned they will finalize by Thursday."
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
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg shadow-sm transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isSubmitting ? "Saving..." : "Confirm complete"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
