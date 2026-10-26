"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ApplicationForm } from "@/components/forms/ApplicationForm";
import { PasteCapture } from "@/components/forms/PasteCapture";
import { CapturedDetails, possibleDuplicate } from "@/lib/paste-capture";
import { Application, ApplicationFormData } from "@/types/job";
import { DataService } from "@/lib/data-service";
import { useApp } from "@/context/AppContext";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewApplicationPage() {
  const router = useRouter();
  const { user, isPreviewMode } = useApp();

  const [captured, setCaptured] = useState<CapturedDetails | null>(null);
  const [revision, setRevision] = useState(0);
  const [duplicates, setDuplicates] = useState<Application[]>([]);
  const [reviewError, setReviewError] = useState("");
  const handleCapture = async (details: CapturedDetails) => {
    if ((revision > 0 || (document.getElementById("form-company") as HTMLInputElement | null)?.value || (document.getElementById("form-role") as HTMLInputElement | null)?.value) && !window.confirm("Replace the current form with details from this text? Unsaved edits in the form will be replaced.")) return;
    try {
      const apps = await DataService.getApplications();
      setDuplicates(apps.filter(app => possibleDuplicate(app, details.application)));
      setReviewError("");
    } catch { setDuplicates([]); setReviewError("Could not check for existing applications. Please check your list before saving a duplicate."); }
    if (details.suggestedAction) {
      details.application.next_action_title = details.suggestedAction.title;
      details.application.next_action_due_date = details.suggestedAction.dueDate;
      details.application.next_action_type = "custom";
    }
    setCaptured(details); setRevision(r => r + 1);
  };

  const handleCreate = async (formData: ApplicationFormData) => {
    const created = await DataService.createApplication(
      formData,
      user?.id
    );
    // Return to the saved record or attention view
    router.push(`/applications/${created.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/applications"
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 transition-colors mb-2 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to applications</span>
        </Link>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
          Add Application
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Start with the company and role. Add an update or next action only when you have one.
        </p>
      </div>

      <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-900">
        {isPreviewMode ? <><strong>Try it without an account.</strong> Sample changes reset on refresh and do not transfer to an account. <Link href="/auth" className="underline font-semibold">Sign in to keep your real applications.</Link></> : <>Your application will be saved to your account. Only company and role need typing; check the date and source, then save.</>}
      </div>
      <PasteCapture onCapture={details => { void handleCapture(details); }} />
      {captured && <div role="status" className="rounded-lg border border-indigo-100 p-3 text-xs text-stone-700 space-y-2">
        <p><strong>Draft filled — please review.</strong> {captured.application.company && captured.application.role ? "Company and role were recognised." : "Some details could not be recognised; enter the missing fields below."} Check the date, source and stage. Only explicitly labelled application dates are extracted; otherwise the form starts with today.</p>
        <p>The original text is included in Application Notes. Nothing has been saved yet.</p>
        {captured.suggestedAction && <p>Possible next action: <strong>{captured.suggestedAction.title}</strong> ({captured.suggestedAction.dueDate}). Tick “Set a next action” below to review and include it.</p>}
        {reviewError && <p className="text-amber-800">{reviewError}</p>}
      </div>}
      {duplicates.length > 0 && <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-2"><strong>Possible existing application — review before creating another.</strong>{duplicates.map(app => <p key={app.id}><Link className="underline font-semibold" href={`/applications/${app.id}`}>Open {app.role} at {app.company}</Link> to add this as an update instead.</p>)}</div>}
      <ApplicationForm key={revision} capturedData={captured?.application} onSubmit={handleCreate} isEditing={false} />
    </div>
  );
}
