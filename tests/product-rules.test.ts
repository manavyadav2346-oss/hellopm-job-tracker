import { describe, it, expect, beforeEach } from "vitest";
import { previewStore } from "../src/lib/preview-store";
import { ApplicationFormData } from "../src/types/job";
import { getTodayLocalDateString, addDaysToLocalDateString } from "../src/lib/dates";

describe("Product Rules Verification", () => {
  beforeEach(() => {
    previewStore.reset();
  });

  it("Rule: Application stage and task completion are separate", () => {
    // 1. Completing a task does NOT automatically change application stage
    const actions = previewStore.getDueAndUpcomingActions();
    const actionToComplete = actions.dueAndOverdue[0];
    expect(actionToComplete).toBeDefined();

    const appBefore = previewStore.getApplicationById(actionToComplete.application_id);
    const initialStage = appBefore?.stage;
    expect(initialStage).toBeDefined();

    // Complete the action
    previewStore.completeAction(actionToComplete.id, "Completed outreach note");

    const appAfter = previewStore.getApplicationById(actionToComplete.application_id);
    expect(appAfter?.stage).toBe(initialStage); // Stage remains untouched!

    // 2. Changing application stage does NOT automatically mark tasks completed
    const app2 = previewStore.createApplication({
      company: "Test Co",
      role: "Engineer",
      application_date: getTodayLocalDateString(),
      stage: "Screening",
      communication_state: "No update received",
      source: "Company Website",
      include_next_action: true,
      next_action_title: "Prepare technical portfolio",
      next_action_type: "prepare_materials",
      next_action_due_date: addDaysToLocalDateString(getTodayLocalDateString(), 2),
    });

    expect(app2.active_action?.status).toBe("pending");

    // Advance stage to Interviewing
    previewStore.updateApplication(app2.id, { stage: "Interviewing" });
    const app2Updated = previewStore.getApplicationById(app2.id);
    expect(app2Updated?.stage).toBe("Interviewing");
    expect(app2Updated?.active_action?.status).toBe("pending"); // Action still pending!
  });

  it("Rule: Closing an application removes outstanding tasks from Needs attention while preserving history", () => {
    // Linear (sample-app-1) has a pending action due today
    const attentionBefore = previewStore.getDueAndUpcomingActions();
    const linearActionBefore = attentionBefore.dueAndOverdue.find(
      (a) => a.company === "Linear"
    );
    expect(linearActionBefore).toBeDefined();

    // Close Linear application as "Withdrawn"
    previewStore.closeApplication("sample-app-1", "Withdrawn", "Role cancelled by team");

    // Verify it is no longer in Needs attention
    const attentionAfter = previewStore.getDueAndUpcomingActions();
    const linearActionAfter = attentionAfter.dueAndOverdue.find(
      (a) => a.company === "Linear"
    );
    expect(linearActionAfter).toBeUndefined();

    // Verify history is preserved: application still exists, marked Closed
    const app = previewStore.getApplicationById("sample-app-1");
    expect(app?.stage).toBe("Closed");
    expect(app?.closed_reason).toBe("Withdrawn");

    // Interaction history contains the closing event
    const closeInteraction = app?.interactions?.find((i) =>
      i.summary.includes("Application marked Closed")
    );
    expect(closeInteraction).toBeDefined();
  });

  it("Rule: Completing a task retains its history", () => {
    const actions = previewStore.getDueAndUpcomingActions();
    const action = actions.dueAndOverdue[0];

    const completed = previewStore.completeAction(
      action.id,
      "Recruiter replied with interview schedule."
    );

    expect(completed.status).toBe("completed");
    expect(completed.completed_at).toBeDefined();
    expect(completed.notes).toContain("Recruiter replied with interview schedule.");

    // Check interaction log has the completion entry
    const app = previewStore.getApplicationById(action.application_id);
    const completionInt = app?.interactions?.find(
      (i) => i.type === "Action Completed" && i.summary.includes(action.title)
    );
    expect(completionInt).toBeDefined();
    expect(completionInt?.details).toContain("Recruiter replied with interview schedule.");
  });

  it("Rule: Rescheduling an action increments count and preserves reason in notes", () => {
    const actions = previewStore.getDueAndUpcomingActions();
    const action = actions.dueAndOverdue[0];
    const initialCount = action.rescheduled_count;
    const newDate = addDaysToLocalDateString(getTodayLocalDateString(), 5);

    const rescheduled = previewStore.rescheduleAction(
      action.id,
      newDate,
      "Pushed back due to hiring manager vacation"
    );

    expect(rescheduled.due_date).toBe(newDate);
    expect(rescheduled.rescheduled_count).toBe(initialCount + 1);
    expect(rescheduled.last_rescheduled_at).toBeDefined();
    expect(rescheduled.notes).toContain("Pushed back due to hiring manager vacation");
  });

  it("Rule: Communication state 'No update received' is distinct from application stage", () => {
    const app = previewStore.createApplication({
      company: "Acme Cloud",
      role: "Platform Engineer",
      application_date: getTodayLocalDateString(),
      stage: "Applied",
      communication_state: "No update received",
      source: "LinkedIn",
    });

    expect(app.stage).toBe("Applied");
    expect(app.communication_state).toBe("No update received");
    expect(app.closed_reason).toBeFalsy(); // Definitely not rejected!
  });
});
