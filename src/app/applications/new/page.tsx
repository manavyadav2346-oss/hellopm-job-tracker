"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ApplicationForm } from "@/components/forms/ApplicationForm";
import { ApplicationFormData } from "@/types/job";
import { DataService } from "@/lib/data-service";
import { useApp } from "@/context/AppContext";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewApplicationPage() {
  const router = useRouter();
  const { user } = useApp();

  const handleCreate = async (formData: ApplicationFormData) => {
    const created = await DataService.createApplication(
      formData,
      user?.id || "preview-user"
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

      <ApplicationForm onSubmit={handleCreate} isEditing={false} />
    </div>
  );
}
