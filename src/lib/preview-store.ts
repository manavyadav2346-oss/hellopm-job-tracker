import {
  Application,
  NextAction,
  Interaction,
  ApplicationFormData,
  ClosedReason,
} from "@/types/job";
import {
  INITIAL_SAMPLE_APPLICATIONS,
  INITIAL_SAMPLE_ACTIONS,
  INITIAL_SAMPLE_INTERACTIONS,
  SAMPLE_USER_ID,
} from "./sample-data";
import { getDueCategory, getTodayLocalDateString } from "./dates";

class PreviewStore {
  private applications: Application[] = [];
  private actions: NextAction[] = [];
  private interactions: Interaction[] = [];
  private initialized = false;

  constructor() {
    this.reset();
  }

  public reset() {
    this.applications = JSON.parse(JSON.stringify(INITIAL_SAMPLE_APPLICATIONS));
    this.actions = JSON.parse(JSON.stringify(INITIAL_SAMPLE_ACTIONS));
    this.interactions = JSON.parse(JSON.stringify(INITIAL_SAMPLE_INTERACTIONS));
    this.initialized = true;
  }

  public getApplications(): Application[] {
    return this.applications.map((app) => {
      // Find active pending action if any
      const activeAction = this.actions.find(
        (a) => a.application_id === app.id && a.status === "pending"
      );
      const appInteractions = this.interactions
        .filter((i) => i.application_id === app.id)
        .sort((a, b) => b.interaction_date.localeCompare(a.interaction_date));

      return {
        ...app,
        active_action: activeAction || null,
        interactions: appInteractions,
      };
    });
  }

  public getApplicationById(id: string): Application | null {
    const app = this.applications.find((a) => a.id === id);
    if (!app) return null;

    const activeAction = this.actions.find(
      (a) => a.application_id === app.id && a.status === "pending"
    );
    const appInteractions = this.interactions
      .filter((i) => i.application_id === app.id)
      .sort((a, b) => b.interaction_date.localeCompare(a.interaction_date));

    return {
      ...app,
      active_action: activeAction || null,
      interactions: appInteractions,
    };
  }

  public createApplication(formData: ApplicationFormData): Application {
    const newId = `sample-app-${Date.now()}`;
    const now = new Date().toISOString();

    const newApp: Application = {
      id: newId,
      user_id: SAMPLE_USER_ID,
      company: formData.company.trim(),
      role: formData.role.trim(),
      application_date: formData.application_date,
      stage: formData.stage,
      communication_state: formData.communication_state || "No update received",
      source: formData.source,
      source_details: formData.source_details || null,
      job_url: formData.job_url || null,
      contact_name: formData.contact_name || null,
      contact_channel: formData.contact_channel || null,
      notes: formData.notes || null,
      created_at: now,
      updated_at: now,
    };

    this.applications.unshift(newApp);

    // Initial interaction if provided or default initial application entry
    const interactionSummary =
      formData.initial_interaction_summary ||
      (formData.stage === "Draft" ? `Planned application for ${formData.role} at ${formData.company}.` : `Application submitted for ${formData.role} at ${formData.company}.`);

    const initialInteraction: Interaction = {
      id: `sample-int-${Date.now()}`,
      application_id: newId,
      user_id: SAMPLE_USER_ID,
      interaction_date: formData.stage === "Draft" ? getTodayLocalDateString() : formData.application_date,
      type: formData.stage === "Draft" ? "Note / Update" : (formData.initial_interaction_type || "Application Submitted"),
      summary: interactionSummary,
      details: formData.notes || null,
      created_at: now,
    };
    this.interactions.push(initialInteraction);

    // Next action if specified
    if (formData.include_next_action && formData.next_action_title && formData.next_action_due_date) {
      const nextAction: NextAction = {
        id: `sample-action-${Date.now()}`,
        application_id: newId,
        user_id: SAMPLE_USER_ID,
        title: formData.next_action_title.trim(),
        action_type: formData.next_action_type || "custom",
        due_date: formData.next_action_due_date,
        status: "pending",
        rescheduled_count: 0,
        notes: null,
        created_at: now,
        updated_at: now,
        company: newApp.company,
        role: newApp.role,
      };
      this.actions.push(nextAction);
      newApp.active_action = nextAction;
    }

    newApp.interactions = [initialInteraction];
    return newApp;
  }

  public updateApplication(id: string, updates: Partial<Application>): Application {
    const idx = this.applications.findIndex((a) => a.id === id);
    if (idx === -1) {
      throw new Error(`Application with id ${id} not found.`);
    }

    const updated: Application = {
      ...this.applications[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.applications[idx] = updated;

    // Update company/role in actions for display
    this.actions.forEach((a) => {
      if (a.application_id === id) {
        if (updates.company) a.company = updates.company;
        if (updates.role) a.role = updates.role;
      }
    });

    return this.getApplicationById(id)!;
  }

  public deleteApplication(id: string): void {
    this.applications = this.applications.filter((a) => a.id !== id);
    this.actions = this.actions.filter((a) => a.application_id !== id);
    this.interactions = this.interactions.filter((i) => i.application_id !== id);
  }

  public closeApplication(id: string, closedReason: ClosedReason, notes?: string): Application {
    const app = this.applications.find((a) => a.id === id);
    if (!app) {
      throw new Error(`Application with id ${id} not found.`);
    }

    app.stage = "Closed";
    app.closed_reason = closedReason;
    app.updated_at = new Date().toISOString();
    if (notes) {
      app.notes = app.notes ? `${app.notes}\n\n[Closed Note]: ${notes}` : `[Closed Note]: ${notes}`;
    }

    // Product rule: "Closing an application removes outstanding tasks from Needs attention while preserving history."
    // Mark pending actions as cancelled/archived so they no longer appear in Needs attention, but retain records
    this.actions.forEach((action) => {
      if (action.application_id === id && action.status === "pending") {
        action.status = "cancelled";
        action.updated_at = new Date().toISOString();
        action.notes = action.notes
          ? `${action.notes} (Cancelled when application closed)`
          : `(Cancelled when application closed as ${closedReason})`;
      }
    });

    // Record interaction for closing
    const closeInteraction: Interaction = {
      id: `sample-int-${Date.now()}`,
      application_id: id,
      user_id: SAMPLE_USER_ID,
      interaction_date: getTodayLocalDateString(),
      type: "Status Check",
      summary: `Application marked Closed (${closedReason}). Outstanding tasks removed from attention list.`,
      details: notes || null,
      created_at: new Date().toISOString(),
    };
    this.interactions.push(closeInteraction);

    return this.getApplicationById(id)!;
  }

  public getDueAndUpcomingActions(): {
    dueAndOverdue: NextAction[];
    upcoming: NextAction[];
  } {
    const today = getTodayLocalDateString();
    const activeAppIds = new Set(
      this.applications
        .filter((a) => a.stage !== "Closed")
        .map((a) => a.id)
    );

    // Only actions belonging to non-closed applications with pending status
    const pendingActions = this.actions.filter(
      (a) => a.status === "pending" && activeAppIds.has(a.application_id)
    );

    // Enrich with company and role
    const enriched = pendingActions.map((action) => {
      const app = this.applications.find((a) => a.id === action.application_id);
      return {
        ...action,
        company: app?.company || action.company || "Unknown Company",
        role: app?.role || action.role || "Role",
      };
    });

    const dueAndOverdue: NextAction[] = [];
    const upcoming: NextAction[] = [];

    enriched.forEach((action) => {
      const category = getDueCategory(action.due_date, today);
      if (category === "overdue" || category === "due_today") {
        dueAndOverdue.push(action);
      } else {
        upcoming.push(action);
      }
    });

    // Sort overdue earliest first, upcoming earliest first
    dueAndOverdue.sort((a, b) => a.due_date.localeCompare(b.due_date));
    upcoming.sort((a, b) => a.due_date.localeCompare(b.due_date));

    return { dueAndOverdue, upcoming };
  }

  public completeAction(actionId: string, notes?: string): NextAction {
    const action = this.actions.find((a) => a.id === actionId);
    if (!action) {
      throw new Error(`Action with id ${actionId} not found.`);
    }

    const now = new Date().toISOString();
    action.status = "completed";
    action.completed_at = now;
    action.updated_at = now;
    if (notes) {
      action.notes = action.notes ? `${action.notes}\n[Completion Note]: ${notes}` : notes;
    }

    // Product rule: "Completing a task retains its history."
    // Also record in interaction history for the application
    const completionInteraction: Interaction = {
      id: `sample-int-${Date.now()}`,
      application_id: action.application_id,
      user_id: action.user_id,
      interaction_date: getTodayLocalDateString(),
      type: "Action Completed",
      summary: `Completed action: ${action.title}`,
      details: notes || null,
      created_at: now,
    };
    this.interactions.push(completionInteraction);

    return action;
  }

  public rescheduleAction(actionId: string, newDueDate: string, notes?: string): NextAction {
    const action = this.actions.find((a) => a.id === actionId);
    if (!action) {
      throw new Error(`Action with id ${actionId} not found.`);
    }

    if (action.due_date === newDueDate) return action;
    const prevDate = action.due_date;
    const now = new Date().toISOString();
    action.due_date = newDueDate;
    action.rescheduled_count += 1;
    action.last_rescheduled_at = now;
    action.updated_at = now;
    if (notes) {
      action.notes = action.notes
        ? `${action.notes}\n[Rescheduled from ${prevDate} to ${newDueDate}]: ${notes}`
        : `[Rescheduled from ${prevDate} to ${newDueDate}]: ${notes}`;
    }

    return action;
  }

  public updateAction(actionId: string, updates: { title: string; action_type: NextAction["action_type"] }): NextAction {
    const action = this.actions.find((a) => a.id === actionId);
    if (!action) throw new Error("Action not found.");
    action.title = updates.title.trim();
    action.action_type = updates.action_type;
    action.updated_at = new Date().toISOString();
    return action;
  }

  public addAction(
    applicationId: string,
    actionData: {
      title: string;
      action_type: NextAction["action_type"];
      due_date: string;
      notes?: string;
    }
  ): NextAction {
    const app = this.applications.find((a) => a.id === applicationId);
    if (!app) {
      throw new Error(`Application with id ${applicationId} not found.`);
    }

    const now = new Date().toISOString();
    const newAction: NextAction = {
      id: `sample-action-${Date.now()}`,
      application_id: applicationId,
      user_id: app.user_id,
      title: actionData.title.trim(),
      action_type: actionData.action_type,
      due_date: actionData.due_date,
      status: "pending",
      rescheduled_count: 0,
      notes: actionData.notes || null,
      created_at: now,
      updated_at: now,
      company: app.company,
      role: app.role,
    };

    this.actions.push(newAction);
    return newAction;
  }

  public addInteraction(
    applicationId: string,
    interactionData: {
      interaction_date: string;
      type: Interaction["type"];
      summary: string;
      details?: string;
    }
  ): Interaction {
    const app = this.applications.find((a) => a.id === applicationId);
    if (!app) {
      throw new Error(`Application with id ${applicationId} not found.`);
    }

    const now = new Date().toISOString();
    const newInt: Interaction = {
      id: `sample-int-${Date.now()}`,
      application_id: applicationId,
      user_id: app.user_id,
      interaction_date: interactionData.interaction_date,
      type: interactionData.type,
      summary: interactionData.summary.trim(),
      details: interactionData.details || null,
      created_at: now,
    };

    this.interactions.push(newInt);
    return newInt;
  }
}

export const previewStore = new PreviewStore();
