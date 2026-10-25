import type { ApplicationStage } from "../types/job";
import { getTodayLocalDateString } from "./dates";

export function validateApplicationDate(date: string, stage: ApplicationStage): string | null {
  if (!date) return "Application date is required.";
  if (stage !== "Draft" && date > getTodayLocalDateString()) {
    return "An application already submitted cannot have a future application date. Use today's date or an earlier date, or choose Draft to plan an application.";
  }
  return null;
}

// A newly authenticated session must leave sample mode. A token refresh
// should not interrupt someone who deliberately opened the sample afterwards.
export function shouldExitPreview(event: string, hasSession: boolean): boolean {
  return hasSession && ["INITIAL_SESSION", "SIGNED_IN", "PASSWORD_RECOVERY"].includes(event);
}
