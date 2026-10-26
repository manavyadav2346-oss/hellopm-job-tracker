"use client";

import React from "react";
import Link from "next/link";
import { Application } from "@/types/job";
import { StageBadge, CommStateBadge } from "@/components/common/Badge";
import { formatLocalDate } from "@/lib/dates";
import {
  Calendar,
  ExternalLink,
  Edit2,
  Archive,
  Trash2,
  User,
  Building2,
  PlusCircle,
  Link as LinkIcon,
} from "lucide-react";

interface ApplicationHeaderProps {
  application: Application;
  onOpenLogUpdate: () => void;
  onOpenCloseApp: (reason?: "Rejected") => void;
  onDeleteApp: () => void;
}

export function ApplicationHeader({
  application,
  onOpenLogUpdate,
  onOpenCloseApp,
  onDeleteApp,
}: ApplicationHeaderProps) {
  const isClosed = application.stage === "Closed";

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm space-y-4">
      {/* Top Bar with Stage & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>{application.company}</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            {application.role}
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {!isClosed && (
            <button
              onClick={onOpenLogUpdate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors focus:ring-2 focus:ring-indigo-500"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add update</span>
            </button>
          )}

          {!isClosed && <button type="button" onClick={() => onOpenCloseApp("Rejected")} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100">Mark rejected</button>}

          <Link
            href={`/applications/${application.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </Link>

          {!isClosed && (
            <button
              onClick={() => onOpenCloseApp()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
              title="Close application and remove tasks from attention view"
            >
              <Archive className="w-3.5 h-3.5 text-stone-500" />
              <span>Other outcome</span>
            </button>
          )}

          <button
            onClick={onDeleteApp}
            className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete application record"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isClosed && <p className="text-xs text-stone-500">Add update records an email, call or interview that already happened. Use Next action below for something you still need to do. Only mark rejected when the company confirms it.</p>}

      {/* Badges & Status row */}
      <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-stone-100">
        <StageBadge stage={application.stage} />
        {application.stage !== "Closed" && <CommStateBadge state={application.communication_state} />}

        {application.closed_reason && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200">
            Closed: {application.closed_reason}
          </span>
        )}

        <span className="text-xs text-stone-500 ml-auto flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-stone-400" />
          {application.stage === "Draft" ? "Planned" : "Applied"} {formatLocalDate(application.application_date, { includeRelative: false })}
        </span>
      </div>

      {/* Metadata details strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-stone-100 text-xs">
        <div>
          <span className="text-stone-400 block mb-0.5">Application Source</span>
          <span className="font-medium text-stone-800">
            {application.source === "Other" && application.source_details
              ? application.source_details
              : application.source}
          </span>
        </div>

        <div>
          <span className="text-stone-400 block mb-0.5">Recruiter / Contact</span>
          {application.contact_name ? (
            <span className="font-medium text-stone-800">
              {application.contact_name}
              {application.contact_channel && (
                <span className="text-stone-500 block text-[11px]">
                  {application.contact_channel}
                </span>
              )}
            </span>
          ) : (
            <span className="text-stone-400 italic">None recorded</span>
          )}
        </div>

        <div>
          <span className="text-stone-400 block mb-0.5">Job Posting URL</span>
          {application.job_url ? (
            <a
              href={application.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-indigo-600 hover:underline inline-flex items-center gap-1 truncate max-w-full"
            >
              <LinkIcon className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{application.job_url}</span>
            </a>
          ) : (
            <span className="text-stone-400 italic">None provided</span>
          )}
        </div>
      </div>

      {/* Notes if any */}
      {application.notes && (
        <div className="pt-2 border-t border-stone-100">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
            Application Notes
          </span>
          <p className="text-xs text-stone-700 whitespace-pre-line leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-200">
            {application.notes}
          </p>
        </div>
      )}
    </div>
  );
}
