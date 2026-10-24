import {
  Application,
  NextAction,
  Interaction,
  ApplicationFormData,
  ClosedReason,
  ActionType,
} from "@/types/job";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase/client";
import { previewStore } from "./preview-store";
import { getDueCategory, getTodayLocalDateString } from "./dates";

export class DataService {
  private static usePreviewModeOverride: boolean | null = null;

  public static isPreviewMode(): boolean {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("job_tracker_preview_mode");
      if (stored !== null) {
        return stored === "true";
      }
    }
    // If Supabase credentials are not configured, default to Preview Mode
    return !isSupabaseConfigured();
  }

  public static setPreviewMode(enabled: boolean): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("job_tracker_preview_mode", enabled ? "true" : "false");
      window.dispatchEvent(new Event("preview-mode-changed"));
    }
  }

  public static async getApplications(userId?: string): Promise<Application[]> {
    if (this.isPreviewMode()) {
      return previewStore.getApplications();
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error("Supabase is not configured. Please supply NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
    }

    const { data: apps, error: appsError } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (appsError) {
      throw new Error(`Failed to load applications: ${appsError.message}`);
    }

    if (!apps || apps.length === 0) {
      return [];
    }

    const appIds = apps.map((a) => a.id);

    // Fetch active pending next actions
    const { data: actions, error: actionsError } = await supabase
      .from("next_actions")
      .select("*")
      .in("application_id", appIds)
      .eq("status", "pending");

    if (actionsError) {
      console.warn("Could not load pending actions:", actionsError.message);
    }

    // Fetch interactions
    const { data: interactions, error: intError } = await supabase
      .from("interactions")
      .select("*")
      .in("application_id", appIds)
      .order("interaction_date", { ascending: false });

    if (intError) {
      console.warn("Could not load interactions:", intError.message);
    }

    return apps.map((app) => ({
      ...app,
      active_action: actions?.find((a) => a.application_id === app.id) || null,
      interactions: interactions?.filter((i) => i.application_id === app.id) || [],
    }));
  }

  public static async getApplicationById(id: string): Promise<Application | null> {
    if (this.isPreviewMode()) {
      return previewStore.getApplicationById(id);
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }

    const { data: app, error: appError } = await supabase
      .from("applications")
      .select("*")
      .eq("id", id)
      .single();

    if (appError || !app) {
      if (appError?.code === "PGRST116") return null;
      throw new Error(`Failed to load application: ${appError?.message || "Not found"}`);
    }

    const { data: actions } = await supabase
      .from("next_actions")
      .select("*")
      .eq("application_id", id)
      .order("created_at", { ascending: false });

    const { data: interactions } = await supabase
      .from("interactions")
      .select("*")
      .eq("application_id", id)
      .order("interaction_date", { ascending: false });

    const pendingAction = actions?.find((a) => a.status === "pending") || null;

    return {
      ...app,
      active_action: pendingAction,
      interactions: interactions || [],
    };
  }

  public static async createApplication(
    formData: ApplicationFormData,
    userId: string
  ): Promise<Application> {
    if (this.isPreviewMode()) {
      return previewStore.createApplication(formData);
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }

    // 1. Insert application
    const { data: newApp, error: appError } = await supabase
      .from("applications")
      .insert({
        user_id: userId,
        company: formData.company.trim(),
        role: formData.role.trim(),
        application_date: formData.application_date,
        stage: formData.stage,
        communication_state: formData.communication_state,
        source: formData.source,
        source_details: formData.source_details || null,
        job_url: formData.job_url || null,
        contact_name: formData.contact_name || null,
        contact_channel: formData.contact_channel || null,
        notes: formData.notes || null,
      })
      .select()
      .single();

    if (appError || !newApp) {
      throw new Error(`Failed to create application: ${appError?.message || "Unknown error"}`);
    }

    // 2. Insert initial interaction
    const summary =
      formData.initial_interaction_summary ||
      `Application submitted for ${newApp.role} at ${newApp.company}.`;

    const { error: intError } = await supabase.from("interactions").insert({
      application_id: newApp.id,
      user_id: userId,
      interaction_date: formData.application_date,
      type: formData.initial_interaction_type || "Application Submitted",
      summary: summary,
      details: formData.notes || null,
    });

    if (intError) {
      console.warn("Could not save initial interaction:", intError.message);
    }

    // 3. Insert next action if requested
    let createdAction: NextAction | null = null;
    if (
      formData.include_next_action &&
      formData.next_action_title &&
      formData.next_action_due_date
    ) {
      const { data: actData, error: actError } = await supabase
        .from("next_actions")
        .insert({
          application_id: newApp.id,
          user_id: userId,
          title: formData.next_action_title.trim(),
          action_type: formData.next_action_type || "custom",
          due_date: formData.next_action_due_date,
          status: "pending",
        })
        .select()
        .single();

      if (actError) {
        throw new Error(`Application created, but failed to save next action: ${actError.message}`);
      }
      createdAction = actData;
    }

    return {
      ...newApp,
      active_action: createdAction,
      interactions: [],
    };
  }

  public static async updateApplication(
    id: string,
    updates: Partial<Application>,
    userId: string
  ): Promise<Application> {
    if (this.isPreviewMode()) {
      return previewStore.updateApplication(id, updates);
    }

    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase is not configured.");

    const { data, error } = await supabase
      .from("applications")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update application: ${error?.message || "Unknown error"}`);
    }

    return this.getApplicationById(id) as Promise<Application>;
  }

  public static async deleteApplication(id: string, userId: string): Promise<void> {
    if (this.isPreviewMode()) {
      previewStore.deleteApplication(id);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase is not configured.");

    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to delete application: ${error.message}`);
    }
  }

  public static async closeApplication(
    id: string,
    closedReason: ClosedReason,
    notes?: string,
    userId?: string
  ): Promise<Application> {
    if (this.isPreviewMode()) {
      return previewStore.closeApplication(id, closedReason, notes);
    }

    const supabase = getSupabaseClient();
    if (!supabase || !userId) throw new Error("Authentication and Supabase are required.");

    // Update application stage to Closed
    const { error: appError } = await supabase
      .from("applications")
      .update({
        stage: "Closed",
        closed_reason: closedReason,
      })
      .eq("id", id)
      .eq("user_id", userId);

    if (appError) {
      throw new Error(`Failed to close application: ${appError.message}`);
    }

    // Cancel pending actions so they are removed from Needs attention
    await supabase
      .from("next_actions")
      .update({
        status: "cancelled",
      })
      .eq("application_id", id)
      .eq("status", "pending")
      .eq("user_id", userId);

    // Record interaction for closing
    await supabase.from("interactions").insert({
      application_id: id,
      user_id: userId,
      interaction_date: getTodayLocalDateString(),
      type: "Status Check",
      summary: `Application marked Closed (${closedReason}). Tasks removed from attention list.`,
      details: notes || null,
    });

    return (await this.getApplicationById(id))!;
  }

  public static async getDueAndUpcomingActions(userId?: string): Promise<{
    dueAndOverdue: NextAction[];
    upcoming: NextAction[];
  }> {
    if (this.isPreviewMode()) {
      return previewStore.getDueAndUpcomingActions();
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }

    // Load non-closed applications to filter actions
    const { data: activeApps, error: appsError } = await supabase
      .from("applications")
      .select("id, company, role, stage")
      .neq("stage", "Closed");

    if (appsError) {
      throw new Error(`Failed to load active applications: ${appsError.message}`);
    }

    if (!activeApps || activeApps.length === 0) {
      return { dueAndOverdue: [], upcoming: [] };
    }

    const activeAppMap = new Map(activeApps.map((a) => [a.id, a]));
    const activeAppIds = Array.from(activeAppMap.keys());

    const { data: actions, error: actError } = await supabase
      .from("next_actions")
      .select("*")
      .in("application_id", activeAppIds)
      .eq("status", "pending")
      .order("due_date", { ascending: true });

    if (actError) {
      throw new Error(`Failed to load actions: ${actError.message}`);
    }

    const today = getTodayLocalDateString();
    const dueAndOverdue: NextAction[] = [];
    const upcoming: NextAction[] = [];

    (actions || []).forEach((action) => {
      const app = activeAppMap.get(action.application_id);
      const enriched: NextAction = {
        ...action,
        company: app?.company || "Company",
        role: app?.role || "Role",
      };

      const category = getDueCategory(action.due_date, today);
      if (category === "overdue" || category === "due_today") {
        dueAndOverdue.push(enriched);
      } else {
        upcoming.push(enriched);
      }
    });

    return { dueAndOverdue, upcoming };
  }

  public static async completeAction(
    actionId: string,
    notes?: string,
    userId?: string
  ): Promise<NextAction> {
    if (this.isPreviewMode()) {
      return previewStore.completeAction(actionId, notes);
    }

    const supabase = getSupabaseClient();
    if (!supabase || !userId) throw new Error("Authentication required.");

    const now = new Date().toISOString();
    const { data: action, error: updateError } = await supabase
      .from("next_actions")
      .update({
        status: "completed",
        completed_at: now,
        notes: notes || undefined,
      })
      .eq("id", actionId)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError || !action) {
      throw new Error(`Failed to complete action: ${updateError?.message || "Unknown error"}`);
    }

    // Add completion entry into interaction history
    await supabase.from("interactions").insert({
      application_id: action.application_id,
      user_id: userId,
      interaction_date: getTodayLocalDateString(),
      type: "Action Completed",
      summary: `Completed action: ${action.title}`,
      details: notes || null,
    });

    return action;
  }

  public static async rescheduleAction(
    actionId: string,
    newDueDate: string,
    notes?: string,
    userId?: string
  ): Promise<NextAction> {
    if (this.isPreviewMode()) {
      return previewStore.rescheduleAction(actionId, newDueDate, notes);
    }

    const supabase = getSupabaseClient();
    if (!supabase || !userId) throw new Error("Authentication required.");

    const now = new Date().toISOString();

    // Get current action to track reschedule count
    const { data: current } = await supabase
      .from("next_actions")
      .select("rescheduled_count, notes, due_date")
      .eq("id", actionId)
      .eq("user_id", userId)
      .single();

    const count = (current?.rescheduled_count || 0) + 1;
    const prevDate = current?.due_date || "";
    const noteEntry = notes
      ? `[Rescheduled from ${prevDate} to ${newDueDate}]: ${notes}`
      : undefined;

    const { data: action, error: updateError } = await supabase
      .from("next_actions")
      .update({
        due_date: newDueDate,
        rescheduled_count: count,
        last_rescheduled_at: now,
        notes: noteEntry || current?.notes,
      })
      .eq("id", actionId)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError || !action) {
      throw new Error(`Failed to reschedule action: ${updateError?.message || "Unknown error"}`);
    }

    return action;
  }

  public static async addAction(
    applicationId: string,
    actionData: {
      title: string;
      action_type: ActionType;
      due_date: string;
      notes?: string;
    },
    userId?: string
  ): Promise<NextAction> {
    if (this.isPreviewMode()) {
      return previewStore.addAction(applicationId, actionData);
    }

    const supabase = getSupabaseClient();
    if (!supabase || !userId) throw new Error("Authentication required.");

    const { data, error } = await supabase
      .from("next_actions")
      .insert({
        application_id: applicationId,
        user_id: userId,
        title: actionData.title.trim(),
        action_type: actionData.action_type,
        due_date: actionData.due_date,
        status: "pending",
        notes: actionData.notes || null,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to add next action: ${error?.message || "Unknown error"}`);
    }

    return data;
  }

  public static async addInteraction(
    applicationId: string,
    interactionData: {
      interaction_date: string;
      type: Interaction["type"];
      summary: string;
      details?: string;
    },
    userId?: string
  ): Promise<Interaction> {
    if (this.isPreviewMode()) {
      return previewStore.addInteraction(applicationId, interactionData);
    }

    const supabase = getSupabaseClient();
    if (!supabase || !userId) throw new Error("Authentication required.");

    const { data, error } = await supabase
      .from("interactions")
      .insert({
        application_id: applicationId,
        user_id: userId,
        interaction_date: interactionData.interaction_date,
        type: interactionData.type,
        summary: interactionData.summary.trim(),
        details: interactionData.details || null,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to log interaction: ${error?.message || "Unknown error"}`);
    }

    return data;
  }
}
