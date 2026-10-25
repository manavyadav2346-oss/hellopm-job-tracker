"use client";

import React from "react";
import Link from "next/link";
import { NextAction } from "@/types/job";
import { DueBadge, ActionTypeBadge } from "@/components/common/Badge";
import { formatLocalDate, getDueCategory } from "@/lib/dates";
import { Check, Calendar, ArrowRight, Building2, Briefcase } from "lucide-react";

interface ActionCardProps {
  action: NextAction;
  onOpenReschedule: (action: NextAction) => void;
  onOpenComplete: (action: NextAction) => void;
}

export function ActionCard({
  action,
  onOpenReschedule,
  onOpenComplete,
}: ActionCardProps) {
  const category = getDueCategory(action.due_date);
  const formattedDate = formatLocalDate(action.due_date, { includeRelative: true });

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm hover:border-stone-300 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        {/* Main Content */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <DueBadge category={category} text={formattedDate} />
            <ActionTypeBadge type={action.action_type} />
            {action.rescheduled_count > 0 && (
              <span className="text-[11px] text-stone-400">
                Rescheduled ×{action.rescheduled_count}
              </span>
            )}
          </div>

          <h4 className="text-sm font-semibold text-stone-900 leading-snug break-words">
            {action.title}
          </h4>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
            <span className="inline-flex items-center gap-1 font-medium text-stone-800">
              <Building2 className="w-3.5 h-3.5 text-stone-400" />
              {action.company || "Company"}
            </span>
            <span className="inline-flex items-center gap-1 text-stone-600">
              <Briefcase className="w-3.5 h-3.5 text-stone-400" />
              {action.role || "Role"}
            </span>
          </div>

          {action.notes && (
            <details className="text-xs text-stone-500 pt-1">
              <summary className="cursor-pointer">Action notes & change history</summary>
              <p className="mt-1 whitespace-pre-line break-words">{action.notes}</p>
            </details>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 flex-shrink-0">
          <button
            onClick={() => onOpenComplete(action)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            title="Mark action complete"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Complete</span>
          </button>

          <button
            onClick={() => onOpenReschedule(action)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 transition-colors"
            title="Reschedule action date"
          >
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span>Reschedule</span>
          </button>

          <Link
            href={`/applications/${action.application_id}`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 border border-transparent transition-colors"
            title="Open application record"
          >
            <span>View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
