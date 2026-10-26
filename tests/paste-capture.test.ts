import { describe, it, expect } from "vitest";
import { captureApplicationText, parseExplicitDate, possibleDuplicate } from "../src/lib/paste-capture";

describe("Paste capture review drafts", () => {
  it("extracts a confirmation and retains the original evidence without fabricating dates", () => {
    const text = "Thanks for applying for the Product Analyst role at Acme. We will be in touch.";
    const result = captureApplicationText(text);
    expect(result.application.company).toBe("Acme");
    expect(result.application.role).toBe("Product Analyst");
    expect(result.application.stage).toBe("Applied");
    expect(result.application.application_date).toBeUndefined();
    expect(result.application.notes).toContain(text);
  });
  it("recognises labelled job posts but never treats a listing as an application", () => {
    const result = captureApplicationText("Company: Example Ltd\nRole: APM\nApply here: https://www.linkedin.com/jobs/view/123");
    expect(result.application.company).toBe("Example Ltd");
    expect(result.application.role).toBe("APM");
    expect(result.application.source).toBe("LinkedIn");
    expect(result.application.stage).toBe("Draft");
  });
  it("leaves unknown fields empty instead of inventing a company or a role", () => {
    const result = captureApplicationText("Hello, we will call you next week.");
    expect(result.application.company).toBeUndefined();
    expect(result.application.role).toBeUndefined();
    expect(result.suggestedAction).toBeUndefined();
  });
  it("only proposes an explicitly dated action, never enrolling it automatically", () => {
    const result = captureApplicationText("Please submit your assignment by 29 October 2026.");
    expect(result.suggestedAction?.dueDate).toBe("2026-10-29");
    expect(result.application.application_date).toBeUndefined();
    expect(result.application.include_next_action).toBeUndefined();
    expect(result.interactionType).toBe("Take-home Assessment");
  });
  it.each(["Please submit your assignment by Friday.", "Please submit your assignment by 29 October.", "Interview scheduled on 2026-10-29."])("does not fabricate an action deadline for %s", text => {
    expect(captureApplicationText(text).suggestedAction).toBeUndefined();
  });
  it("only takes the application date from an explicit label", () => {
    expect(captureApplicationText("Company: Acme\nRole: Analyst\nApplication date: 2026-10-20\nSubmit assignment by 2026-10-29.").application.application_date).toBe("2026-10-20");
  });
  it("does not infer rejection or screening from an arbitrary recruiter message", () => {
    expect(captureApplicationText("Unfortunately we will not proceed. Company: Acme").application.stage).toBe("Draft");
  });
  it("rejects empty and oversized input", () => {
    expect(() => captureApplicationText("   ")).toThrow();
    expect(() => captureApplicationText("x".repeat(12001))).toThrow();
  });
});

describe("Explicit dates and duplicate warnings", () => {
  it("accepts explicit date formats and rejects impossible or ambiguous dates", () => {
    expect(parseExplicitDate("29 October 2026")).toBe("2026-10-29");
    expect(parseExplicitDate("October 29, 2026")).toBe("2026-10-29");
    expect(parseExplicitDate("2026-10-29")).toBe("2026-10-29");
    expect(parseExplicitDate("2026-02-30")).toBeUndefined();
    expect(parseExplicitDate("29 October")).toBeUndefined();
    expect(parseExplicitDate("10/11/26")).toBeUndefined();
  });
  it("warns about a matching company and role or URL, but not blank fields", () => {
    const app = { company: "Acme", role: "Product Analyst", job_url: "https://example.com/jobs/1" };
    expect(possibleDuplicate(app, { company: " acme ", role: "Product  Analyst" })).toBe(true);
    expect(possibleDuplicate(app, { job_url: app.job_url })).toBe(true);
    expect(possibleDuplicate(app, {})).toBe(false);
    expect(possibleDuplicate(app, { company: "Acme", role: "Designer" })).toBe(false);
  });
});
