"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Application, ApplicationFormData } from "@/types/job";
import { DataService } from "@/lib/data-service";
import { useApp } from "@/context/AppContext";
import { ApplicationForm } from "@/components/forms/ApplicationForm";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function EditApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useApp();
  const applicationId = params?.id as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const app = await DataService.getApplicationById(applicationId);
        if (!app) {
          setError("Application not found.");
          return;
        }
        setApplication(app);
      } catch (err: any) {
        setError(err?.message || "Failed to load application.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [applicationId]);

  const handleUpdate = async (formData: ApplicationFormData) => {
    if (!application) return;

    await DataService.updateApplication(
      application.id,
      {
        company: formData.company,
        role: formData.role,
        application_date: formData.application_date,
        stage: formData.stage,
        communication_state: formData.communication_state,
        source: formData.source,
        source_details: formData.source_details,
        job_url: formData.job_url,
        contact_name: formData.contact_name,
        contact_channel: formData.contact_channel,
        notes: formData.notes,
      },
      user?.id || ""
    );

    // If next action was added/updated
    if (formData.include_next_action && formData.next_action_title && formData.next_action_due_date) {
      if (application.active_action) {
        await DataService.rescheduleAction(
          application.active_action.id,
          formData.next_action_due_date,
          `Updated via Edit: ${formData.next_action_title}`,
          user?.id
        );
      } else {
        await DataService.addAction(
          application.id,
          {
            title: formData.next_action_title,
            action_type: formData.next_action_type || "custom",
            due_date: formData.next_action_due_date,
          },
          user?.id
        );
      }
    }

    router.push(`/applications/${application.id}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 py-8">
        <div className="h-6 w-32 bg-stone-200 rounded animate-pulse" />
        <div className="h-96 bg-white rounded-xl border border-stone-200 animate-pulse" />
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href={`/applications/${application.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 transition-colors mb-2 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {application.company} record</span>
        </Link>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
          Edit Application
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Update application information, stage, or communication status for {application.role} at {application.company}.
        </p>
      </div>

      <ApplicationForm
        initialData={application}
        onSubmit={handleUpdate}
        isEditing={true}
      />
    </div>
  );
}
