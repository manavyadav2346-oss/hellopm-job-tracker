"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Application, ApplicationStage, CommunicationState } from "@/types/job";
import { DataService } from "@/lib/data-service";
import { useApp } from "@/context/AppContext";
import { ApplicationFilter } from "@/components/applications/ApplicationFilter";
import { ApplicationCard } from "@/components/applications/ApplicationCard";
import { PlusCircle, Briefcase, AlertCircle, RefreshCw } from "lucide-react";

export default function ApplicationsPage() {
  const { isPreviewMode, user } = useApp();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<ApplicationStage | "All">("All");
  const [selectedCommState, setSelectedCommState] = useState<CommunicationState | "All">("All");

  const loadApplications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await DataService.getApplications(user?.id);
      setApplications(data);
    } catch (err: any) {
      console.error("Failed to load applications:", err);
      setError(err?.message || "Failed to load applications.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadApplications();

    const handleUpdate = () => loadApplications();
    window.addEventListener("preview-mode-changed", handleUpdate);
    window.addEventListener("preview-data-reset", handleUpdate);

    return () => {
      window.removeEventListener("preview-mode-changed", handleUpdate);
      window.removeEventListener("preview-data-reset", handleUpdate);
    };
  }, [loadApplications]);

  const handleDelete = async (id: string, company: string, role: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the application for "${role}" at "${company}"? This will also remove its associated tasks and interaction history.`
      )
    ) {
      return;
    }

    try {
      await DataService.deleteApplication(id, user?.id || "");
      await loadApplications();
    } catch (err: any) {
      alert(err?.message || "Failed to delete application.");
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedStage("All");
    setSelectedCommState("All");
  };

  // Filter logic
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Search matches company or role
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesCompany = app.company.toLowerCase().includes(query);
        const matchesRole = app.role.toLowerCase().includes(query);
        if (!matchesCompany && !matchesRole) return false;
      }

      // Stage filter
      if (selectedStage !== "All" && app.stage !== selectedStage) {
        return false;
      }

      // Communication state filter
      if (selectedCommState !== "All" && app.communication_state !== selectedCommState) {
        return false;
      }

      return true;
    });
  }, [applications, searchQuery, selectedStage, selectedCommState]);

  return (
    <div className="space-y-6">
      {/* View Header with prominent single primary action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Applications
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Search, filter, and review all active and closed job applications across channels.
          </p>
        </div>

        <Link
          href="/applications/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none flex-shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add application</span>
        </Link>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to load applications</p>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            <button
              onClick={loadApplications}
              className="text-xs font-semibold text-rose-800 underline mt-2"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <ApplicationFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStage={selectedStage}
        onStageChange={setSelectedStage}
        selectedCommState={selectedCommState}
        onCommStateChange={setSelectedCommState}
        onReset={handleResetFilters}
        totalCount={applications.length}
        filteredCount={filteredApplications.length}
      />

      {/* Applications Grid / Loading / Empty states */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-44 bg-white rounded-xl border border-stone-200 p-5 animate-pulse space-y-3"
            >
              <div className="h-4 w-1/3 bg-stone-200 rounded" />
              <div className="h-5 w-2/3 bg-stone-200 rounded" />
              <div className="h-3 w-1/2 bg-stone-200 rounded" />
              <div className="h-10 w-full bg-stone-100 rounded mt-4" />
            </div>
          ))}
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="p-10 bg-white rounded-xl border border-stone-200 text-center space-y-3 shadow-sm">
          <Briefcase className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="text-base font-semibold text-stone-800">
            {applications.length === 0
              ? "No applications recorded yet"
              : "No matching applications found"}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
            {applications.length === 0
              ? "Add your first job application to keep role information, dated interactions, and next actions unified in one place."
              : "No applications matched your current search and filters. Try clearing your search query or selecting 'All' stages."}
          </p>
          <div className="pt-2">
            {applications.length === 0 ? (
              <Link
                href="/applications/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add an application</span>
              </Link>
            ) : (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset all filters</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredApplications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
