"use client";

import React from "react";
import { ApplicationStage, CommunicationState } from "@/types/job";
import { Search, Filter, X } from "lucide-react";

interface ApplicationFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStage: ApplicationStage | "All";
  onStageChange: (stage: ApplicationStage | "All") => void;
  selectedCommState: CommunicationState | "All";
  onCommStateChange: (state: CommunicationState | "All") => void;
  onReset: () => void;
  totalCount: number;
  filteredCount: number;
}

const STAGES: (ApplicationStage | "All")[] = [
  "All",
  "Applied",
  "Screening",
  "Interviewing",
  "Offer",
  "Draft",
  "Closed",
];

const COMM_STATES: (CommunicationState | "All")[] = [
  "All",
  "No update received",
  "Awaiting reply",
  "Update received",
  "Discussion ongoing",
];

export function ApplicationFilter({
  searchQuery,
  onSearchChange,
  selectedStage,
  onStageChange,
  selectedCommState,
  onCommStateChange,
  onReset,
  totalCount,
  filteredCount,
}: ApplicationFilterProps) {
  const hasActiveFilters =
    searchQuery.trim() !== "" || selectedStage !== "All" || selectedCommState !== "All";

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by company or role..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white placeholder-stone-400"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Stage Filter Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedStage}
            onChange={(e) => onStageChange(e.target.value as ApplicationStage | "All")}
            className="px-3 py-2 text-sm rounded-lg border border-stone-300 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            aria-label="Filter by stage"
          >
            <option value="All">All Stages</option>
            {STAGES.filter((s) => s !== "All").map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>

          {/* Communication State Dropdown */}
          <select
            value={selectedCommState}
            onChange={(e) =>
              onCommStateChange(e.target.value as CommunicationState | "All")
            }
            className="px-3 py-2 text-sm rounded-lg border border-stone-300 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            aria-label="Filter by communication state"
          >
            <option value="All">All Comm States</option>
            {COMM_STATES.filter((s) => s !== "All").map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stage Quick Chips */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-100 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-stone-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Quick stage:
          </span>
          {STAGES.map((stage) => (
            <button
              key={stage}
              onClick={() => onStageChange(stage)}
              className={`px-2 py-0.5 rounded-full font-medium transition-colors ${
                selectedStage === stage
                  ? "bg-indigo-600 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {stage}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-stone-500">
          <span>
            Showing <strong>{filteredCount}</strong> of {totalCount}
          </span>
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="text-indigo-600 hover:underline font-medium"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
