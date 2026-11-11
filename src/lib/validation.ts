/**
 * Shared validation used by the staff dashboard, the client questionnaire
 * forms, and the API routes (so the server enforces the same rules).
 */

import type { QuestionDefinition, SectionDefinition } from "@/lib/data/hospital-seed";

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[A-Za-z0-9._%+'-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export function validateEmail(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (v.length > 254 || !EMAIL_RE.test(v) || v.includes("..")) {
    return "Enter a valid email address, e.g. name@company.com.";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Phone / mobile
//
// Accepted:
//   Indian numbers   98765 43210 · 098765 43210 · 919876543210 · +91 98765 43210
//                    landlines with STD code, e.g. 044 2345 6789
//   International    any number starting with "+" and a country code (8–15 digits)
// Rejected: letters, too few / too many digits, all-identical digits.
// ---------------------------------------------------------------------------

/** Strip characters that can never appear in a phone number, as the user types. */
export function sanitizePhoneInput(value: string): string {
  let v = value.replace(/[^\d+\s\-().]/g, "");
  // "+" is only meaningful as the very first character.
  v = v.replace(/(?!^)\+/g, "");
  return v.slice(0, 20);
}

type ParsedPhone = { ok: true; e164: string; display: string } | { ok: false; error: string };

function parsePhone(value: string): ParsedPhone {
  const v = value.trim();
  if (/[^\d+\s\-().]/.test(v) || /.\+/.test(v)) {
    return { ok: false, error: "Phone number can only contain digits, spaces, +, - and brackets." };
  }

  const digits = v.replace(/\D/g, "");
  const international = v.startsWith("+");

  let national: string;
  if (international && !digits.startsWith("91")) {
    if (digits.length < 8 || digits.length > 15) {
      return { ok: false, error: "Enter a valid international number with country code (8–15 digits)." };
    }
    if (/^(\d)\1+$/.test(digits)) return { ok: false, error: "Enter a valid phone number." };
    return { ok: true, e164: `+${digits}`, display: `+${digits}` };
  } else if (international) {
    national = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    national = digits.slice(1);
  } else if (digits.length === 12 && digits.startsWith("91")) {
    national = digits.slice(2);
  } else {
    national = digits;
  }

  if (national.length !== 10) {
    return {
      ok: false,
      error:
        national.length < 10
          ? "Phone number is too short. Enter a 10-digit number, e.g. 98765 43210."
          : "Phone number is too long. Enter a 10-digit number, or add the country code with + for international numbers.",
    };
  }
  if (national.startsWith("0")) {
    return { ok: false, error: "Enter the number without the leading 0, e.g. 98765 43210." };
  }
  if (/^(\d)\1{9}$/.test(national)) {
    return { ok: false, error: "Enter a valid phone number." };
  }

  const isMobile = /^[6-9]/.test(national);
  return {
    ok: true,
    e164: `+91${national}`,
    // Mobiles group as 5+5; landline STD codes vary in length, so leave them ungrouped.
    display: isMobile ? `+91 ${national.slice(0, 5)} ${national.slice(5)}` : `+91 ${national}`,
  };
}

export function validatePhone(value: string): string | null {
  if (!value.trim()) return null;
  const parsed = parsePhone(value);
  return parsed.ok ? null : parsed.error;
}

/** Consistent storage format, e.g. "+91 98765 43210". Returns input unchanged if invalid/empty. */
export function normalizePhone(value: string): string {
  if (!value.trim()) return "";
  const parsed = parsePhone(value);
  return parsed.ok ? parsed.display : value.trim();
}

// ---------------------------------------------------------------------------
// Website
// ---------------------------------------------------------------------------

const URL_RE = /^(https?:\/\/)?([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(:\d{2,5})?(\/[^\s]*)?$/i;

export function validateWebsite(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (!URL_RE.test(v)) return "Enter a valid website, e.g. company.com or https://company.com.";
  return null;
}

export function normalizeWebsite(value: string): string {
  const v = value.trim();
  if (!v || validateWebsite(v)) return v;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

/** Split a free-typed list of addresses (comma, semicolon, space or new line separated). */
export function parseEmailList(value: string): string[] {
  return value
    .split(/[\s,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function validateEmailList(value: string, max = 10): string | null {
  const list = parseEmailList(value);
  if (list.length === 0) return null;
  const bad = list.find((e) => validateEmail(e));
  if (bad) return `"${bad}" is not a valid email address.`;
  if (list.length > max) return `Enter at most ${max} email addresses.`;
  return null;
}

/** Normalised, de-duplicated list joined as "a@x.com, b@y.com". */
export function normalizeEmailList(value: string): string {
  return [...new Set(parseEmailList(value))].join(", ");
}

// ---------------------------------------------------------------------------
// Names / passcodes
// ---------------------------------------------------------------------------

export function validateName(value: string, label: string, max = 120): string | null {
  const v = value.trim();
  if (!v) return `${label} is required.`;
  if (v.length < 2) return `${label} must be at least 2 characters.`;
  if (v.length > max) return `${label} must be ${max} characters or fewer.`;
  if (!/\p{L}/u.test(v)) return `${label} must contain letters.`;
  return null;
}

export function validatePersonName(value: string, label = "Contact name"): string | null {
  const base = validateName(value, label, 100);
  if (base) return base;
  if (/\d/.test(value)) return `${label} should not contain numbers.`;
  return null;
}

export function validateAccessCode(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (!/^[A-Za-z0-9-]{4,20}$/.test(v)) {
    return "Passcode must be 4–20 characters: letters, numbers and hyphens only.";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Staff "Create customer" form
// ---------------------------------------------------------------------------

export const INDUSTRY_IDS = ["hospital", "finance", "food-and-beverage", "jewellery"] as const;

export interface CustomerInput {
  companyName: string;
  website: string;
  industry: string;
  contactName: string;
  email: string;
  phone: string;
  staffEmails: string;
  customCode: string;
}

export type CustomerErrors = Partial<Record<keyof CustomerInput, string>>;

export function validateCustomerField(field: keyof CustomerInput, value: string): string | null {
  switch (field) {
    case "companyName":
      return validateName(value, "Company name");
    case "website":
      return validateWebsite(value);
    case "industry":
      return (INDUSTRY_IDS as readonly string[]).includes(value) ? null : "Select an industry questionnaire.";
    case "contactName":
      return validatePersonName(value, "Contact name");
    case "email":
      return value.trim() ? validateEmail(value) : "Email address is required.";
    case "phone":
      return validatePhone(value);
    case "staffEmails":
      return validateEmailList(value);
    case "customCode":
      return validateAccessCode(value);
  }
}

export function validateCustomer(input: CustomerInput): CustomerErrors {
  const errors: CustomerErrors = {};
  (Object.keys(input) as (keyof CustomerInput)[]).forEach((field) => {
    const err = validateCustomerField(field, input[field] ?? "");
    if (err) errors[field] = err;
  });
  return errors;
}

// ---------------------------------------------------------------------------
// Questionnaire answers
// ---------------------------------------------------------------------------

export interface StoredAnswer {
  value?: unknown;
  customOther?: string;
  department?: string;
}

function isEmptyValue(val: unknown): boolean {
  if (val === undefined || val === null) return true;
  if (typeof val === "string") return !val.trim();
  if (Array.isArray(val)) return val.length === 0;
  if (typeof val === "object") return Object.keys(val as object).length === 0;
  return false;
}

/** Format checks for a single answer. Returns the main error and, if relevant, an "Other" error. */
export function validateAnswer(
  q: QuestionDefinition,
  stored: StoredAnswer | undefined
): { error?: string; otherError?: string } {
  const val = stored?.value;

  if (isEmptyValue(val)) {
    return q.required ? { error: "This question is required." } : {};
  }

  if (typeof val === "string") {
    const v = val.trim();
    if (q.format === "email") {
      const e = validateEmail(v);
      if (e) return { error: e };
    } else if (q.format === "phone") {
      const e = validatePhone(v);
      if (e) return { error: e };
    } else if (q.format === "url") {
      const e = validateWebsite(v);
      if (e) return { error: e };
    } else if (q.type === "number") {
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0) return { error: "Enter a valid non-negative number." };
    } else if (q.type === "text" && v.length > 500) {
      return { error: "Please keep this answer under 500 characters." };
    }
  }

  if (q.type === "rating_grid" && q.required && q.gridRows) {
    const rated = val && typeof val === "object" ? Object.keys(val as object).length : 0;
    if (rated < q.gridRows.length) return { error: "Please rate every row." };
  }

  const otherSelected = val === "Other" || (Array.isArray(val) && val.includes("Other"));
  if (otherSelected && !stored?.customOther?.trim()) {
    return { otherError: "Please specify what “Other” refers to." };
  }

  return {};
}

/** Validate a whole questionnaire. Error keys are `q.key` and `${q.key}_other`. */
export function validateQuestionnaire(
  sections: SectionDefinition[],
  answers: Record<string, StoredAnswer>
): Record<string, string> {
  const errors: Record<string, string> = {};
  sections.forEach((sec) =>
    sec.questions.forEach((q) => {
      const { error, otherError } = validateAnswer(q, answers[q.key]);
      if (error) errors[q.key] = error;
      if (otherError) errors[`${q.key}_other`] = otherError;
    })
  );
  return errors;
}
