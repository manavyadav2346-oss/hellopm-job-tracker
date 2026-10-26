import type { ApplicationFormData, InteractionType } from "../types/job";

export interface CapturedDetails {
  application: Partial<ApplicationFormData>;
  summary: string;
  interactionType: InteractionType;
  originalText: string;
  suggestedAction?: { title: string; dueDate: string };
}

function clean(value?: string): string | undefined {
  return value?.trim().replace(/[.!;,]+$/, "").trim() || undefined;
}

// Only accept unambiguous, explicitly dated calendar dates. Never guess the year.
export function parseExplicitDate(text: string): string | undefined {
  const iso = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  const named = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*,?\s*(20\d{2})\b/i);
  const us = text.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\s*,?\s*(20\d{2})\b/i);
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  let y: number, m: number, d: number;
  if (iso) { y = +iso[1]; m = +iso[2]; d = +iso[3]; }
  else if (named) { y = +named[3]; m = months.indexOf(named[2].slice(0, 3).toLowerCase()) + 1; d = +named[1]; }
  else if (us) { y = +us[3]; m = months.indexOf(us[1].slice(0, 3).toLowerCase()) + 1; d = +us[2]; }
  else return;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function captureApplicationText(input: string): CapturedDetails {
  const text = input.trim();
  if (!text) throw new Error("Paste a message or job description first.");
  if (text.length > 12000) throw new Error("Please paste up to 12,000 characters at a time.");
  const companyLabel = text.match(/^\s*(?:company|organisation|organization|employer)\s*:\s*(.+)$/im);
  const roleLabel = text.match(/^\s*(?:role|job title|position)\s*:\s*(.+)$/im);
  const confirmation = text.match(/(?:applying|applied|application)\s+(?:for|to)\s+(?:the\s+)?([^\n.!?]+?)\s+(?:role\s+|position\s+)?at\s+([^\n.!?]+)/i);
  const roleAt = text.match(/^\s*(?:job title:\s*)?([^\n:!?]{2,90}?)\s+at\s+([^\n.!?]{2,90})\s*[.!]?\s*$/im);
  const company = clean(companyLabel?.[1] || confirmation?.[2] || roleAt?.[2]);
  const role = clean(roleLabel?.[1] || confirmation?.[1] || roleAt?.[1])?.replace(/\s+(?:role|position)$/i, "");
  const url = text.match(/https?:\/\/[^\s<>"']+/i)?.[0]?.replace(/[).,;]+$/, "");
  const email = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0];
  const receipt = /\b(?:thank(?:s| you) for applying|we (?:have )?received your application|application (?:has been )?(?:submitted|received)|you(?:'ve| have) applied)\b/i.test(text);
  const dateLine = text.match(/^\s*(?:application date|date applied|applied on)\s*:\s*(.+)$/im)?.[1];
  // Only a clearly stated action deadline becomes a suggestion; review is required.
  const actionLine = text.split(/\n|(?<=[.!?])\s+/).find(line => /\b(?:submit|complete|send)\b/i.test(line) && /\b(?:by|before|due|deadline)\b/i.test(line));
  const dueDate = actionLine ? parseExplicitDate(actionLine) : undefined;
  const suggestedAction = dueDate && actionLine ? { title: actionLine.trim().slice(0, 180), dueDate } : undefined;
  const interactionType: InteractionType = /\b(?:assignment|assessment|take-home)\b/i.test(text) ? "Take-home Assessment" : "Note / Update";
  const summary = text.replace(/\s+/g, " ").slice(0, 240);
  return {
    originalText: text, summary, interactionType, suggestedAction,
    application: {
      company, role,
      // A job listing alone is not evidence that an application was submitted.
      stage: receipt ? "Applied" : "Draft",
      application_date: dateLine ? parseExplicitDate(dateLine) : undefined,
      source: url && /^(?:https?:\/\/)?(?:[\w-]+\.)?linkedin\.com\//i.test(url) ? "LinkedIn" : "Other",
      source_details: "Pasted text",
      job_url: url,
      contact_channel: email,
      notes: `Original pasted text:\n${text}`,
    },
  };
}

export function possibleDuplicate(app: { company: string; role: string; job_url?: string | null }, draft: Partial<ApplicationFormData>): boolean {
  const normalize = (s?: string | null) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
  return Boolean((draft.company && draft.role && normalize(app.company) === normalize(draft.company) && normalize(app.role) === normalize(draft.role)) || (draft.job_url && normalize(app.job_url) === normalize(draft.job_url)));
}
