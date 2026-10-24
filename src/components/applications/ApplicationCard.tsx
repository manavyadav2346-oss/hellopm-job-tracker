"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Application } from "@/types/job";
import { StageBadge, CommStateBadge, DueBadge } from "@/components/common/Badge";
import { formatLocalDate, getDueCategory } from "@/lib/dates";
import {
  Calendar,
  ExternalLink,
  Edit2,
  Trash2,
  ArrowRight,
  Clock,
  User,
  Link as LinkIcon,
} from "lucide-react";

interface ApplicationCardProps {
  application: Application;
  onDelete: (id: string, company: string, role: string) => void;
}

export function ApplicationCard({ application, onDelete }: ApplicationCardProps) {
  const activeAction = application.active_action;
  const appliedFormatted = formatLocalDate(application.application_date, {
    includeRelative: false,
  });

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm hover:border-stone-300 transition-all flex flex-col justify-between">
      <div className="space-y-3">
        {/* Header row: Company & Role */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              {application.company}
            </span>
            <h3 className="text-base font-semibold text-stone-900 leading-snug">
              <Link
                href={`/applications/${application.id}`}
                className="hover:text-indigo-600 transition-colors"
              >
                {application.role}
              </Link>
            </h3>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <StageBadge stage={application.stage} />
          </div>
        </div>

        {/* Badges: Communication state & Source */}
        <div className="flex flex-wrap items-center gap-2">
          <CommStateBadge state={application.communication_state} />
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-stone-500 bg-stone-50 border border-stone-200">
            {application.source === "Other" && application.source_details
              ? application.source_details
              : application.source}
          </span>
          {application.closed_reason && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-rose-700 bg-rose-50 border border-rose-200 font-medium">
              Closed: {application.closed_reason}
            </span>
          )}
        </div>

        {/* Contact info or link snippet if present */}
        {(application.contact_name || application.job_url) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 pt-0.5">
            {application.contact_name && (
              <span className="inline-flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-stone-400" />
                {application.contact_name}
                {application.contact_channel && ` (${application.contact_channel})`}
              </span>
            )}
            {application.job_url && (
              <a
                href={application.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
              >
                <LinkIcon className="w-3 h-3" />
                Job link
              </a>
            )}
          </div>
        )}

        {/* Next action preview box */}
        <div className="pt-2 border-t border-stone-100">
          {activeAction ? (
            <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs space-y-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-medium text-stone-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-stone-400" />
                  Next action:
                </span>
                <DueBadge
                  category={getDueCategory(activeAction.due_date)}
                  text={formatLocalDate(activeAction.due_date, { includeRelative: true })}
                />
              </div>
              <p className="font-medium text-stone-800 line-clamp-1">
                {activeAction.title}
              </p>
            </div>
          ) : (
            <div className="text-xs text-stone-400 italic">
              No active next action set.
            </div>
          )}
        </div>
      </div>

      {/* Footer bar: Applied date and action buttons */}
      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-stone-400" />
          Applied {appliedFormatted}
        </span>

        <div className="flex items-center gap-1">
          <Link
            href={`/applications/${application.id}/edit`}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
            title="Edit application"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() =>
              onDelete(application.id, application.company, application.role)
            }
            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete application"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <Link
            href={`/applications/${application.id}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors ml-1"
          >
            <span>Open</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
