"use client";

import React, { useState } from "react";
import { validateApplicationDate } from "@/lib/product-validation";
import { useRouter } from "next/navigation";
import {
  Application,
  ApplicationFormData,
  ApplicationStage,
  ApplicationSource,
  CommunicationState,
  ActionType,
  InteractionType,
} from "@/types/job";
import {
  getTodayLocalDateString,
  addDaysToLocalDateString,
} from "@/lib/dates";
import {
  ChevronDown,
  ChevronRight,
  Info,
  AlertTriangle,
  Building2,
  Briefcase,
  Calendar,
  Link as LinkIcon,
  User,
  Clock,
  MessageSquare,
} from "lucide-react";

interface ApplicationFormProps {
  initialData?: Partial<Application>;
  onSubmit: (formData: ApplicationFormData) => Promise<void>;
  isEditing?: boolean;
}

export function ApplicationForm({
  initialData,
  onSubmit,
  isEditing = false,
}: ApplicationFormProps) {
  const router = useRouter();
  const today = getTodayLocalDateString();

  // Core required fields
  const [company, setCompany] = useState(initialData?.company || "");
  const [role, setRole] = useState(initialData?.role || "");
  const [applicationDate, setApplicationDate] = useState(
    initialData?.application_date || today
  );
  const [stage, setStage] = useState<ApplicationStage>(
    initialData?.stage || "Applied"
  );
  const [communicationState, setCommunicationState] = useState<CommunicationState>(
    initialData?.communication_state || "No update received"
  );
  const [source, setSource] = useState<ApplicationSource>(
    initialData?.source || "LinkedIn"
  );
  const [sourceDetails, setSourceDetails] = useState(
    initialData?.source_details || ""
  );

  // Optional Contact & URL fields (behind progressive disclosure)
  const [showContactSection, setShowContactSection] = useState(
    Boolean(
      initialData?.contact_name ||
      initialData?.contact_channel ||
      initialData?.job_url ||
      initialData?.notes
    )
  );
  const [jobUrl, setJobUrl] = useState(initialData?.job_url || "");
  const [contactName, setContactName] = useState(
    initialData?.contact_name || ""
  );
  const [contactChannel, setContactChannel] = useState(
    initialData?.contact_channel || ""
  );
  const [notes, setNotes] = useState(initialData?.notes || "");

  // Optional Initial Interaction (only for new creation)
  const [showInteractionSection, setShowInteractionSection] = useState(false);
  const [includeInitialInteraction, setIncludeInitialInteraction] = useState(
    !isEditing
  );
  const [interactionType, setInteractionType] = useState<InteractionType>(
    "Application Submitted"
  );
  const [interactionSummary, setInteractionSummary] = useState("");

  // Optional Next Action
  const [showNextActionSection, setShowNextActionSection] = useState(
    Boolean(initialData?.active_action)
  );
  const [includeNextAction, setIncludeNextAction] = useState(
    Boolean(initialData?.active_action)
  );
  const [actionTitle, setActionTitle] = useState(
    initialData?.active_action?.title || ""
  );
  const [actionType, setActionType] = useState<ActionType>(
    initialData?.active_action?.action_type || "check_portal"
  );
  const [actionDueDate, setActionDueDate] = useState(
    initialData?.active_action?.due_date || addDaysToLocalDateString(today, 3)
  );

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  // Product rule validation: Recruiter follow-up requires contact or channel
  const hasContactInfo = Boolean(contactName.trim() || contactChannel.trim());
  const isRecruiterFollowUpWithoutContact =
    includeNextAction &&
    actionType === "recruiter_follow_up" &&
    !hasContactInfo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationWarning(null);

    // Validation checks
    if (!company.trim()) {
      setError("Company name is required.");
      return;
    }
    if (!role.trim()) {
      setError("Role is required.");
      return;
    }
    if (!applicationDate) {
      setError("Application date is required.");
      return;
    }

    const dateError = validateApplicationDate(applicationDate, stage);
    if (dateError) { setError(dateError); return; }

    // Require due date only if next action is entered
    if (includeNextAction) {
      if (!actionTitle.trim()) {
        setError("Please enter a title for the next action, or uncheck 'Set a next action'.");
        return;
      }
      if (!actionDueDate) {
        setError("Next action requires a due date. Date-only deadlines behave in your local timezone.");
        return;
      }

      // Check recruiter follow-up rule
      if (actionType === "recruiter_follow_up" && !hasContactInfo) {
        setError(
          "A recruiter follow-up action requires a contact name or channel. Please add contact info above, or choose a different action type (e.g. Check portal, Prepare materials), or uncheck next action."
        );
        setShowContactSection(true);
        return;
      }
    }

    const payload: ApplicationFormData = {
      company: company.trim(),
      role: role.trim(),
      application_date: applicationDate,
      stage,
      communication_state: communicationState,
      source,
      source_details: source === "Other" ? sourceDetails.trim() : undefined,
      job_url: jobUrl.trim() || undefined,
      contact_name: contactName.trim() || undefined,
      contact_channel: contactChannel.trim() || undefined,
      notes: notes.trim() || undefined,
      include_initial_interaction: !isEditing && includeInitialInteraction,
      initial_interaction_type: interactionType,
      initial_interaction_summary: interactionSummary.trim() || undefined,
      include_next_action: includeNextAction,
      next_action_title: actionTitle.trim() || undefined,
      next_action_type: actionType,
      next_action_due_date: actionDueDate || undefined,
    };

    try {
      setIsSubmitting(true);
      await onSubmit(payload);
    } catch (err: any) {
      console.error("Save failed:", err);
      setError(err?.message || "Failed to save application. Please verify your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
          <div>
            <p className="font-semibold">Unable to save</p>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* CORE REQUIRED SECTION (Kept Short & Direct) */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-indigo-600" />
          <span>Core Application Details</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Company */}
          <div>
            <label
              htmlFor="form-company"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              Company <span className="text-rose-500">*</span>
            </label>
            <input
              id="form-company"
              type="text"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          {/* Role */}
          <div>
            <label
              htmlFor="form-role"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              Role <span className="text-rose-500">*</span>
            </label>
            <input
              id="form-role"
              type="text"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Senior Product Manager"
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          {/* Application Date */}
          <div>
            <label
              htmlFor="form-date"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              {stage === "Draft" ? "Planned application date" : "Application date"} <span className="text-rose-500">*</span>
            </label>
            <input
              id="form-date"
              max={stage === "Draft" ? undefined : today}
              type="date"
              required
              value={applicationDate}
              onChange={(e) => setApplicationDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          {/* Source */}
          <div>
            <label
              htmlFor="form-source"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              Source <span className="text-rose-500">*</span>
            </label>
            <select
              id="form-source"
              value={source}
              onChange={(e) => setSource(e.target.value as ApplicationSource)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="LinkedIn">LinkedIn</option>
              <option value="Company Website">Company Website</option>
              <option value="Referral">Referral</option>
              <option value="Job Board">Job Board</option>
              <option value="Recruiter Outreach">Recruiter Outreach</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Custom Source Input if "Other" is selected */}
        {source === "Other" && (
          <div>
            <label
              htmlFor="form-source-details"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              Specify Source
            </label>
            <input
              id="form-source-details"
              type="text"
              value={sourceDetails}
              onChange={(e) => setSourceDetails(e.target.value)}
              placeholder="e.g. Industry Discord community, Tech meetup, Twitter/X"
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
        )}

        <details open={isEditing || undefined} className="pt-2 border-t border-stone-100">
          <summary className="cursor-pointer text-xs font-medium text-stone-600">Stage: {stage} · {communicationState} — change if needed</summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
          {/* Stage */}
          <div>
            <label
              htmlFor="form-stage"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              Application Stage
            </label>
            <select
              id="form-stage"
              value={stage}
              onChange={(e) => setStage(e.target.value as ApplicationStage)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
            >
              <option value="Draft">Draft</option>
              <option value="Applied">Applied</option>
              <option value="Screening">Screening</option>
              <option value="Interviewing">Interviewing</option>
              <option value="Offer">Offer</option>
              {isEditing && initialData?.stage === "Closed" && <option value="Closed">Closed</option>}
            </select>
            <p className="text-xs text-stone-500 mt-2">Update this when a recruiter or portal confirms progress. No reply does not mean rejection. To record a rejection, open the saved application and choose Mark rejected.</p>
          </div>

          {/* Communication State */}
          <div>
            <label
              htmlFor="form-comm-state"
              className="block text-xs font-semibold text-stone-700 mb-1"
            >
              Communication State
            </label>
            <select
              id="form-comm-state"
              value={communicationState}
              onChange={(e) =>
                setCommunicationState(e.target.value as CommunicationState)
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
            >
              <option value="No update received">No update received</option>
              <option value="Awaiting reply">Awaiting reply</option>
              <option value="Update received">Update received</option>
              <option value="Discussion ongoing">Discussion ongoing</option>
            </select>
            <span className="text-[11px] text-stone-500 mt-1 block">
              &ldquo;No update received&rdquo; is a standard waiting state, never inferred as rejection.
            </span>
          </div>
        </div>
        </details>
      </div>

      {/* PROGRESSIVE DISCLOSURE 1: Contact, Job URL, & Notes */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setShowContactSection(!showContactSection)}
          className="w-full px-5 py-3 text-left flex items-center justify-between text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-stone-400" />
            <span>Contact Information & Job URL (Optional)</span>
            {(contactName || jobUrl) && (
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
            )}
          </div>
          {showContactSection ? (
            <ChevronDown className="w-4 h-4 text-stone-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-stone-400" />
          )}
        </button>

        {showContactSection && (
          <div className="p-5 pt-1 border-t border-stone-100 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="form-contact-name"
                  className="block text-xs font-medium text-stone-700 mb-1"
                >
                  Contact Person
                </label>
                <input
                  id="form-contact-name"
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Sarah Chen (Recruiter)"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="form-contact-channel"
                  className="block text-xs font-medium text-stone-700 mb-1"
                >
                  Contact Channel / Details
                </label>
                <input
                  id="form-contact-channel"
                  type="text"
                  value={contactChannel}
                  onChange={(e) => setContactChannel(e.target.value)}
                  placeholder="e.g. sarah@linear.app or LinkedIn InMail"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="form-job-url"
                className="block text-xs font-medium text-stone-700 mb-1"
              >
                Job Description / Posting URL
              </label>
              <input
                id="form-job-url"
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://company.com/careers/role-123"
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="form-notes"
                className="block text-xs font-medium text-stone-700 mb-1"
              >
                Application Notes
              </label>
              <textarea
                id="form-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Key requirements, salary range, interview impressions..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* PROGRESSIVE DISCLOSURE 2: Next Action */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
        <div className="p-4 flex items-center justify-between border-b border-stone-100 bg-stone-50/50">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeNextAction}
              onChange={(e) => {
                setIncludeNextAction(e.target.checked);
                if (e.target.checked) setShowNextActionSection(true);
              }}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-stone-300"
            />
            <span className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              Set a next action (optional)
            </span>
          </label>
        </div>

        {includeNextAction && (
          <div className="p-5 space-y-4">
            {/* Warning if Recruiter follow up selected without contact */}
            {isRecruiterFollowUpWithoutContact && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Contact required for Recruiter Follow-up</span>
                </div>
                <p>
                  A recruiter follow-up action requires a contact person or channel. Please add contact info above, or select another action (such as checking the portal or preparing materials).
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label
                  htmlFor="form-action-title"
                  className="block text-xs font-medium text-stone-700 mb-1"
                >
                  Action Description <span className="text-rose-500">*</span>
                </label>
                <input
                  id="form-action-title"
                  type="text"
                  value={actionTitle}
                  onChange={(e) => setActionTitle(e.target.value)}
                  placeholder="e.g. Follow up on screening feedback, or Submit take-home"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="form-action-type"
                  className="block text-xs font-medium text-stone-700 mb-1"
                >
                  Action Type
                </label>
                <select
                  id="form-action-type"
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as ActionType)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                >
                  <option value="recruiter_follow_up">Recruiter follow-up</option>
                  <option value="check_portal">Check portal</option>
                  <option value="prepare_materials">Prepare materials</option>
                  <option value="send_update">Send update</option>
                  <option value="custom">Other task (describe it above)</option>
                </select>
              </div>
            </div>

            {/* Date-only deadline */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="form-action-date"
                  className="block text-xs font-medium text-stone-700"
                >
                  Action Due Date <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-stone-400">
                  Choose when you want to act
                </span>
              </div>
              <input
                id="form-action-date"
                type="date"
                value={actionDueDate}
                onChange={(e) => setActionDueDate(e.target.value)}
                className="w-full sm:w-64 px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />

              {/* Quick helper pills */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-xs text-stone-400">Quick dates:</span>
                {[
                  { label: "Tomorrow", days: 1 },
                  { label: "In 3 days", days: 3 },
                  { label: "In 1 week", days: 7 },
                  { label: "In 2 weeks", days: 14 },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() =>
                      setActionDueDate(addDaysToLocalDateString(today, item.days))
                    }
                    className="text-xs px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit / Cancel Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isRecruiterFollowUpWithoutContact}
          className="px-5 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          {isSubmitting
            ? "Saving application..."
            : isEditing
            ? "Update application"
            : "Save application"}
        </button>
      </div>
    </form>
  );
}
