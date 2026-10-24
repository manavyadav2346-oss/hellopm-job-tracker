import { describe, it, expect } from "vitest";
import {
  getTodayLocalDateString,
  parseLocalDate,
  formatLocalDate,
  getRelativeDays,
  getDueCategory,
  isDueOrOverdue,
  addDaysToLocalDateString,
} from "../src/lib/dates";

describe("Date utilities for date-only deadlines", () => {
  it("formats today as YYYY-MM-DD in local time", () => {
    const today = getTodayLocalDateString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("parses local date without timezone shift", () => {
    const dateStr = "2026-10-24";
    const d = parseLocalDate(dateStr);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(9); // 0-indexed October
    expect(d.getDate()).toBe(24);
  });

  it("calculates relative days accurately", () => {
    const ref = "2026-10-24";
    expect(getRelativeDays("2026-10-24", ref)).toBe(0);
    expect(getRelativeDays("2026-10-25", ref)).toBe(1);
    expect(getRelativeDays("2026-10-23", ref)).toBe(-1);
    expect(getRelativeDays("2026-10-28", ref)).toBe(4);
    expect(getRelativeDays("2026-10-20", ref)).toBe(-4);
  });

  it("categorizes due status: overdue, due today, and upcoming", () => {
    const ref = "2026-10-24";
    expect(getDueCategory("2026-10-23", ref)).toBe("overdue");
    expect(getDueCategory("2026-10-20", ref)).toBe("overdue");
    expect(getDueCategory("2026-10-24", ref)).toBe("due_today");
    expect(getDueCategory("2026-10-25", ref)).toBe("upcoming");
    expect(getDueCategory("2026-11-01", ref)).toBe("upcoming");
  });

  it("isDueOrOverdue correctly identifies actions needing immediate attention", () => {
    const ref = "2026-10-24";
    expect(isDueOrOverdue("2026-10-23", ref)).toBe(true);
    expect(isDueOrOverdue("2026-10-24", ref)).toBe(true);
    expect(isDueOrOverdue("2026-10-25", ref)).toBe(false);
  });

  it("adds days to date string correctly", () => {
    expect(addDaysToLocalDateString("2026-10-24", 1)).toBe("2026-10-25");
    expect(addDaysToLocalDateString("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDaysToLocalDateString("2026-10-24", -2)).toBe("2026-10-22");
  });

  it("formats local dates with relative labels", () => {
    const ref = "2026-10-24";
    expect(formatLocalDate("2026-10-24", { referenceDate: ref })).toBe("Today");
    expect(formatLocalDate("2026-10-25", { referenceDate: ref })).toBe("Tomorrow");
    expect(formatLocalDate("2026-10-23", { referenceDate: ref })).toBe("Yesterday");
    expect(formatLocalDate("2026-10-20", { referenceDate: ref })).toBe("4d overdue");
    expect(formatLocalDate("2026-10-28", { referenceDate: ref })).toBe("In 4d");
  });
});
