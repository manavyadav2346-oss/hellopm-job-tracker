import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { shouldExitPreview, validateApplicationDate } from "../src/lib/product-validation";
import { getTodayLocalDateString, addDaysToLocalDateString } from "../src/lib/dates";
import { previewStore } from "../src/lib/preview-store";
import { DataService } from "../src/lib/data-service";

const cloud = vi.hoisted(() => ({ client: { from: vi.fn() } }));
vi.mock("../src/lib/supabase/client", () => ({
  getSupabaseClient: () => cloud.client,
  isSupabaseConfigured: () => true,
}));

afterEach(() => vi.restoreAllMocks());

describe("Preview authentication transitions", () => {
  it.each(["INITIAL_SESSION", "SIGNED_IN", "PASSWORD_RECOVERY"])("exits old sample mode on %s with an authenticated session", event => {
    expect(shouldExitPreview(event, true)).toBe(true);
    expect(shouldExitPreview(event, false)).toBe(false);
  });
  it("does not interrupt deliberately selected preview on a token refresh", () => {
    expect(shouldExitPreview("TOKEN_REFRESHED", true)).toBe(false);
  });
});

describe("Application date validation", () => {
  const today = getTodayLocalDateString();
  const tomorrow = addDaysToLocalDateString(today, 1);
  it("rejects a future submitted application but allows a planned draft", () => {
    expect(validateApplicationDate(tomorrow, "Applied")).toContain("future");
    expect(validateApplicationDate(tomorrow, "Interviewing")).toContain("future");
    expect(validateApplicationDate(tomorrow, "Draft")).toBeNull();
    expect(validateApplicationDate(today, "Applied")).toBeNull();
  });
  it("rejects future creation in the data service before a database write", async () => {
    cloud.client.from.mockClear();
    await expect(DataService.createApplication({ company: "Test", role: "PM", application_date: tomorrow, stage: "Applied", source: "LinkedIn", communication_state: "No update received" }, "user-a")).rejects.toThrow("future");
    expect(cloud.client.from).not.toHaveBeenCalled();
  });
});

describe("Action editing and history", () => {
  beforeEach(() => { previewStore.reset(); cloud.client.from.mockReset(); });

  it("does not count saving the same preview due date as rescheduling", async () => {
    vi.spyOn(DataService, "isPreviewMode").mockReturnValue(true);
    const action = previewStore.getDueAndUpcomingActions().dueAndOverdue[0];
    const before = { ...action };
    const result = await DataService.rescheduleAction(action.id, action.due_date, "should not append");
    expect(result.rescheduled_count).toBe(before.rescheduled_count);
    expect(result.notes).toBe(before.notes);
  });

  it("saves a new preview action title and category without changing its date or count", async () => {
    vi.spyOn(DataService, "isPreviewMode").mockReturnValue(true);
    const action = previewStore.getDueAndUpcomingActions().dueAndOverdue[0];
    const before = { ...action };
    await DataService.updateAction(action.id, { title: "Ask my referrer", action_type: "custom" });
    const saved = previewStore.getApplicationById(action.application_id)!.active_action!;
    expect(saved.title).toBe("Ask my referrer");
    expect(saved.action_type).toBe("custom");
    expect(saved.due_date).toBe(before.due_date);
    expect(saved.rescheduled_count).toBe(before.rescheduled_count);
  });

  it("does not update a cloud action or append notes when its date is unchanged", async () => {
    vi.spyOn(DataService, "isPreviewMode").mockReturnValue(false);
    const record = { id: "act", due_date: "2026-10-26", rescheduled_count: 2, notes: "Keep this" };
    const query: any = { select: vi.fn(), eq: vi.fn(), single: vi.fn().mockResolvedValue({ data: record, error: null }), update: vi.fn() };
    query.select.mockReturnValue(query); query.eq.mockReturnValue(query);
    cloud.client.from.mockReturnValue(query);
    expect(await DataService.rescheduleAction("act", record.due_date, "duplicate", "user-a")).toEqual(record);
    expect(query.update).not.toHaveBeenCalled();
  });

  it("updates cloud action title and category with an owner constraint", async () => {
    vi.spyOn(DataService, "isPreviewMode").mockReturnValue(false);
    const query: any = { update: vi.fn(), eq: vi.fn(), select: vi.fn(), single: vi.fn().mockResolvedValue({ data: { title: "Prepare assignment", action_type: "prepare_materials" }, error: null }) };
    query.update.mockReturnValue(query); query.eq.mockReturnValue(query); query.select.mockReturnValue(query);
    cloud.client.from.mockReturnValue(query);
    await DataService.updateAction("act", { title: "Prepare assignment", action_type: "prepare_materials" }, "user-a");
    expect(query.update).toHaveBeenCalledWith({ title: "Prepare assignment", action_type: "prepare_materials" });
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-a");
  });

  it("describes draft creation as planning rather than a submitted application", () => {
    const app = previewStore.createApplication({ company: "Planned", role: "PM", application_date: addDaysToLocalDateString(getTodayLocalDateString(), 3), stage: "Draft", source: "LinkedIn", communication_state: "No update received" });
    expect(app.interactions![0].type).toBe("Note / Update");
    expect(app.interactions![0].summary).toContain("Planned application");
    expect(app.interactions![0].interaction_date).toBe(getTodayLocalDateString());
  });
});
