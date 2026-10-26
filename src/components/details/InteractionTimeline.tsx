"use client";

import React from "react";
import { Interaction } from "@/types/job";
import { formatLocalDate } from "@/lib/dates";
import {
  Calendar,
  MessageSquare,
  Mail,
  PhoneCall,
  CheckCircle2,
  FileText,
  Clock,
} from "lucide-react";

interface InteractionTimelineProps {
  interactions: Interaction[];
}

export function InteractionTimeline({ interactions }: InteractionTimelineProps) {
  const getIcon = (type: Interaction["type"]) => {
    switch (type) {
      case "Email Received":
      case "Email Sent":
        return <Mail className="w-3.5 h-3.5 text-sky-600" />;
      case "Recruiter Call":
      case "Technical Interview":
      case "Behavioral Interview":
        return <PhoneCall className="w-3.5 h-3.5 text-indigo-600" />;
      case "Action Completed":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case "Application Submitted":
        return <FileText className="w-3.5 h-3.5 text-stone-600" />;
      default:
        return <MessageSquare className="w-3.5 h-3.5 text-stone-500" />;
    }
  };

  const sorted = [...interactions].sort((a, b) =>
    b.interaction_date.localeCompare(a.interaction_date)
  );

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          <span>Dated Interaction History</span>
        </h3>
        <span className="text-xs text-stone-500 font-medium">
          {sorted.length} {sorted.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="py-8 text-center text-stone-400 text-xs">
          No interactions recorded yet. Click &ldquo;Add update&rdquo; to add your first note, call, or email.
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
          {sorted.map((item) => (
            <div key={item.id} className="relative group">
              {/* Dot marker */}
              <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-stone-50 border border-stone-300 flex items-center justify-center">
                {getIcon(item.type)}
              </div>

              {/* Interaction Content Box */}
              <div className="bg-stone-50/70 hover:bg-stone-50 rounded-lg border border-stone-200/80 p-3 text-xs space-y-1 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-1 text-stone-500">
                  <span className="font-semibold text-stone-700">
                    {item.type}
                  </span>
                  <span className="text-[11px] text-stone-400">
                    {formatLocalDate(item.interaction_date, { includeRelative: true })}
                  </span>
                </div>

                <p className="font-medium text-stone-900 leading-snug">
                  {item.summary}
                </p>

                {item.details && (
                  <p className="text-stone-600 whitespace-pre-line text-xs pt-1 border-t border-stone-200/50 mt-1.5 leading-relaxed">
                    {item.details}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
