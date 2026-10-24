/**
 * Date utility functions designed for date-only deadlines (YYYY-MM-DD).
 * Ensures consistency across user local timezones without UTC date-shift bugs.
 */

export function getTodayLocalDateString(refDate: Date = new Date()): string {
  const year = refDate.getFullYear();
  const month = String(refDate.getMonth() + 1).padStart(2, "0");
  const day = String(refDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateString: string): Date {
  const parts = dateString.split("-");
  if (parts.length !== 3) {
    return new Date();
  }
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day, 12, 0, 0, 0); // Noon local avoids daylight savings boundary issues
}

export function formatLocalDate(
  dateString: string,
  options: {
    includeRelative?: boolean;
    referenceDate?: string;
  } = {}
): string {
  if (!dateString) return "";
  const { includeRelative = true, referenceDate = getTodayLocalDateString() } = options;
  const d = parseLocalDate(dateString);

  if (includeRelative) {
    const diffDays = getRelativeDays(dateString, referenceDate);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays < -1) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays <= 7) return `In ${diffDays}d`;
  }

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

export function getRelativeDays(targetDateString: string, referenceDateString: string = getTodayLocalDateString()): number {
  const target = parseLocalDate(targetDateString);
  const reference = parseLocalDate(referenceDateString);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((target.getTime() - reference.getTime()) / msPerDay);
}

export type DueCategory = "overdue" | "due_today" | "upcoming";

export function getDueCategory(dueDateString: string, referenceDateString: string = getTodayLocalDateString()): DueCategory {
  if (!dueDateString) return "upcoming";
  if (dueDateString < referenceDateString) {
    return "overdue";
  }
  if (dueDateString === referenceDateString) {
    return "due_today";
  }
  return "upcoming";
}

export function isDueOrOverdue(dueDateString: string, referenceDateString: string = getTodayLocalDateString()): boolean {
  const category = getDueCategory(dueDateString, referenceDateString);
  return category === "overdue" || category === "due_today";
}

export function addDaysToLocalDateString(dateString: string, daysToAdd: number): string {
  const base = parseLocalDate(dateString);
  base.setDate(base.getDate() + daysToAdd);
  return getTodayLocalDateString(base);
}
