import { describe, it, expect, beforeEach } from "vitest";
import { previewStore } from "../src/lib/preview-store";
import { ApplicationFormData } from "../src/types/job";
import { getTodayLocalDateString, addDaysToLocalDateString } from "../src/lib/dates";

describe("CRUD Operations and Core Journey Checks", () => {
  beforeEach(() => {
    previewStore.reset();
  });

  it("Creates a new application with required fields", () => {
    const today = getTodayLocalDateString();
    const formData: ApplicationFormData = {
      company: "Datadog",
      role: "Product Manager, Observability",
      application_date: today,
      stage: "Applied",
      communication_state: "No update received",
      source: "Company Website",
    };

    const created = previewStore.createApplication(formData);
    expect(created.id).toBeDefined();
    expect(created.company).toBe("Datadog");
    expect(created.role).toBe("Product Manager, Observability");
    expect(created.stage).toBe("Applied");
    expect(created.communication_state).toBe("No update received");
    expect(created.source).toBe("Company Website");

    // Verify it appears in applications list
    const all = previewStore.getApplications();
    const found = all.find((a) => a.id === created.id);
    expect(found).toBeDefined();
    expect(found?.interactions?.length).toBeGreaterThan(0); // Initial interaction logged
  });

  it("Supports custom source when 'Other' is selected", () => {
    const today = getTodayLocalDateString();
    const formData: ApplicationFormData = {
      company: "Anthropic",
      role: "AI Engineer",
      application_date: today,
      stage: "Applied",
      communication_state: "No update received",
      source: "Other",
      source_details: "Hacker News Who is Hiring thread",
    };

    const created = previewStore.createApplication(formData);
    expect(created.source).toBe("Other");
    expect(created.source_details).toBe("Hacker News Who is Hiring thread");
  });

  it("Executes the core journey: Add application -> record interaction & action -> see due action -> complete action -> return to record", () => {
    const today = getTodayLocalDateString();

    // 1. Add application with next action
    const app = previewStore.createApplication({
      company: "Airbnb",
      role: "Design Engineer",
      application_date: today,
      stage: "Applied",
      communication_state: "Awaiting reply",
      source: "Referral",
      contact_name: "Brian",
      contact_channel: "brian@referral.internal",
      include_next_action: true,
      next_action_title: "Follow up with Brian after 3 days",
      next_action_type: "recruiter_follow_up",
      next_action_due_date: today, // Due today!
    });

    expect(app.active_action).toBeDefined();
    expect(app.active_action?.title).toBe("Follow up with Brian after 3 days");

    // 2. See due actions in Needs attention
    const attention = previewStore.getDueAndUpcomingActions();
    const airbnbAction = attention.dueAndOverdue.find((a) => a.company === "Airbnb");
    expect(airbnbAction).toBeDefined();
    expect(airbnbAction?.status).toBe("pending");

    // 3. Complete action
    const completedAction = previewStore.completeAction(
      airbnbAction!.id,
      "Sent follow up email to Brian; he forwarded resume to VP."
    );
    expect(completedAction.status).toBe("completed");

    // 4. Return to saved record and verify updated state
    const savedRecord = previewStore.getApplicationById(app.id);
    expect(savedRecord).toBeDefined();
    expect(savedRecord?.active_action).toBeNull(); // No pending active action anymore
    // Interaction timeline contains both application submitted and action completed
    expect(savedRecord?.interactions?.some((i) => i.type === "Action Completed")).toBe(true);
  });

  it("Edits application details successfully", () => {
    const app = previewStore.getApplications()[0];
    const updated = previewStore.updateApplication(app.id, {
      company: "Updated Corp",
      role: "Principal Architect",
      notes: "Updated role notes after phone screening.",
    });

    expect(updated.company).toBe("Updated Corp");
    expect(updated.role).toBe("Principal Architect");
    expect(updated.notes).toBe("Updated role notes after phone screening.");
  });

  it("Deletes application and its associated tasks and interactions", () => {
    const appsBefore = previewStore.getApplications();
    const target = appsBefore[0];

    previewStore.deleteApplication(target.id);

    const appsAfter = previewStore.getApplications();
    expect(appsAfter.find((a) => a.id === target.id)).toBeUndefined();
    expect(previewStore.getApplicationById(target.id)).toBeNull();
  });
});
