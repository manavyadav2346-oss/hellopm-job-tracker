"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Application, NextAction, InteractionType, ClosedReason, ActionType, CommunicationState } from "@/types/job";
import { DataService } from "@/lib/data-service";
import { useApp } from "@/context/AppContext";
import { ApplicationHeader } from "@/components/details/ApplicationHeader";
import { InteractionTimeline } from "@/components/details/InteractionTimeline";
import { NextActionSection } from "@/components/details/NextActionSection";
import { AddInteractionModal } from "@/components/details/AddInteractionModal";
import { CloseApplicationModal } from "@/components/details/CloseApplicationModal";
import { RescheduleModal } from "@/components/actions/RescheduleModal";
import { CompleteModal } from "@/components/actions/CompleteModal";
import { ArrowLeft, AlertCircle, RefreshCw } from "lucide-react";

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useApp();
  const applicationId = params?.id as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [completedActions, setCompletedActions] = useState<NextAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isLogUpdateOpen, setIsLogUpdateOpen] = useState(false);
  const [isCloseAppOpen, setIsCloseAppOpen] = useState(false);
  const [closeReason, setCloseReason] = useState<ClosedReason>("Other");
  const [actionToReschedule, setActionToReschedule] = useState<NextAction | null>(null);
  const [actionToComplete, setActionToComplete] = useState<NextAction | null>(null);

  const loadData = useCallback(async () => {
    if (!applicationId) return;
    try {
      setIsLoading(true);
      setError(null);
      const app = await DataService.getApplicationById(applicationId);
      if (!app) {
        setError("Application not found.");
        return;
      }
      setApplication(app);

      // In real or preview mode, load completed actions history for this app
      if (DataService.isPreviewMode()) {
        const { previewStore } = require("@/lib/preview-store");
        const allActions: NextAction[] = previewStore["actions"] || [];
        const completed = allActions.filter(
          (a) => a.application_id === applicationId && a.status === "completed"
        );
        setCompletedActions(completed);
      }
    } catch (err: any) {
      console.error("Error loading application:", err);
      setError(err?.message || "Failed to load application details.");
    } finally {
      setIsLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener("preview-mode-changed", handleUpdate);
    window.addEventListener("preview-data-reset", handleUpdate);

    return () => {
      window.removeEventListener("preview-mode-changed", handleUpdate);
      window.removeEventListener("preview-data-reset", handleUpdate);
    };
  }, [loadData]);

  // Actions
  const handleLogInteraction = async (data: {
    interaction_date: string;
    type: InteractionType;
    summary: string;
    details?: string;
    newCommState?: CommunicationState;
  }) => {
    if (!application) return;

    await DataService.addInteraction(
      application.id,
      {
        interaction_date: data.interaction_date,
        type: data.type,
        summary: data.summary,
        details: data.details,
      },
      user?.id
    );

    if (data.newCommState) {
      await DataService.updateApplication(
        application.id,
        { communication_state: data.newCommState },
        user?.id || ""
      );
    }

    await loadData();
  };

  const handleCloseApplication = async (reason: ClosedReason, notes?: string) => {
    if (!application) return;
    await DataService.closeApplication(application.id, reason, notes, user?.id);
    await loadData();
  };

  const handleDeleteApplication = async () => {
    if (!application) return;
    if (
      !confirm(
        `Are you sure you want to delete "${application.role}" at "${application.company}"? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await DataService.deleteApplication(application.id, user?.id || "");
      router.push("/applications");
    } catch (err: any) {
      alert(err?.message || "Failed to delete application.");
    }
  };

  const handleRescheduleAction = async (actionId: string, newDueDate: string, notes?: string) => {
    await DataService.rescheduleAction(actionId, newDueDate, notes, user?.id);
    await loadData();
  };

  const handleCompleteAction = async (actionId: string, notes?: string) => {
    await DataService.completeAction(actionId, notes, user?.id);
    await loadData();
  };

  const handleAddNextAction = async (actionData: {
    title: string;
    action_type: ActionType;
    due_date: string;
    notes?: string;
  }) => {
    if (!application) return;
    await DataService.addAction(application.id, actionData, user?.id);
    await loadData();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-6">
        <div className="h-6 w-32 bg-stone-200 rounded animate-pulse" />
        <div className="h-44 bg-white rounded-xl border border-stone-200 p-6 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-60 bg-white rounded-xl border border-stone-200 p-6 animate-pulse" />
          <div className="h-60 bg-white rounded-xl border border-stone-200 p-6 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-semibold text-stone-900">
          {error || "Application not found"}
        </h2>
        <p className="text-xs text-stone-500">
          The requested application record could not be loaded or may have been deleted.
        </p>
        <div className="pt-2">
          <Link
            href="/applications"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to applications</span>
          </Link>
        </div>
      </div>
    );
  }

  const hasContact = Boolean(
    application.contact_name?.trim() || application.contact_channel?.trim()
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          href="/applications"
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to applications</span>
        </Link>
      </div>

      {/* Header section */}
      <ApplicationHeader
        application={application}
        onOpenLogUpdate={() => setIsLogUpdateOpen(true)}
        onOpenCloseApp={(reason) => { setCloseReason(reason || "Other"); setIsCloseAppOpen(true); }}
        onDeleteApp={handleDeleteApplication}
      />

      {/* Two columns: Next Action (Action view) & Interaction History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Next Action Section */}
        <NextActionSection
          activeAction={application.active_action || null}
          completedActions={completedActions}
          hasContactInfo={hasContact}
          onOpenReschedule={(act) => setActionToReschedule(act)}
          onOpenComplete={(act) => setActionToComplete(act)}
          onAddNextAction={handleAddNextAction}
          isClosed={application.stage === "Closed"}
        />

        {/* Interaction History Timeline */}
        <InteractionTimeline interactions={application.interactions || []} />
      </div>

      {/* Modals */}
      <AddInteractionModal
        isOpen={isLogUpdateOpen}
        onClose={() => setIsLogUpdateOpen(false)}
        onAddInteraction={handleLogInteraction}
        currentCommState={application.communication_state}
      />

      <CloseApplicationModal
        isOpen={isCloseAppOpen}
        onClose={() => setIsCloseAppOpen(false)}
        onCloseApplication={handleCloseApplication}
        initialReason={closeReason}
        company={application.company}
        role={application.role}
      />

      <RescheduleModal
        action={actionToReschedule}
        isOpen={Boolean(actionToReschedule)}
        onClose={() => setActionToReschedule(null)}
        onReschedule={handleRescheduleAction}
      />

      <CompleteModal
        action={actionToComplete}
        isOpen={Boolean(actionToComplete)}
        onClose={() => setActionToComplete(null)}
        onComplete={handleCompleteAction}
      />
    </div>
  );
}
