"use client";

import React, { useCallback, useState } from "react";
import { AlertCircle } from "lucide-react";
import type { QuestionDefinition, SectionDefinition } from "@/lib/data/hospital-seed";
import {
  normalizePhone,
  normalizeWebsite,
  sanitizePhoneInput,
  validateAnswer,
  validateQuestionnaire,
  type StoredAnswer,
} from "@/lib/validation";
import { errorTextClass, hintClass, inputClass } from "./ui";

export type Answers = Record<string, StoredAnswer>;

// ---------------------------------------------------------------------------
// State hook shared by the client portal and the industry questionnaire pages
// ---------------------------------------------------------------------------

export function useQuestionnaire(sections: SectionDefinition[]) {
  const [answers, setAnswers] = useState<Answers>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = useCallback((key: string) => {
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const setAnswer = useCallback(
    (key: string, value: unknown, department: string) => {
      setAnswers((prev) => ({ ...prev, [key]: { ...prev[key], value, department } }));
      clearError(key);
    },
    [clearError]
  );

  const setOther = useCallback(
    (key: string, text: string, department: string) => {
      setAnswers((prev) => ({ ...prev, [key]: { ...prev[key], customOther: text, department } }));
      clearError(`${key}_other`);
    },
    [clearError]
  );

  /** Run on blur so people see format problems immediately, not only at submit. */
  const validateField = useCallback(
    (q: QuestionDefinition, department: string) => {
      const stored = answers[q.key];
      const { error } = validateAnswer({ ...q, required: false }, stored);

      setErrors((prev) => {
        const next = { ...prev };
        if (error) next[q.key] = error;
        else delete next[q.key];
        return next;
      });

      // Tidy valid contact values into a consistent format.
      if (!error && typeof stored?.value === "string") {
        const raw = stored.value;
        const tidy =
          q.format === "phone"
            ? normalizePhone(raw)
            : q.format === "url"
              ? normalizeWebsite(raw)
              : q.format === "email"
                ? raw.trim()
                : raw;
        if (tidy !== raw) {
          setAnswers((prev) => ({ ...prev, [q.key]: { ...prev[q.key], value: tidy, department } }));
        }
      }
    },
    [answers]
  );

  /** Validate everything; scrolls to and focuses the first problem. */
  const validateAll = useCallback((): boolean => {
    const next = validateQuestionnaire(sections, answers);
    setErrors(next);
    const firstKey = sections
      .flatMap((s) => s.questions.map((q) => q.key))
      .find((k) => next[k] || next[`${k}_other`]);
    if (firstKey) {
      const el = document.getElementById(`field-${firstKey}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.querySelector<HTMLElement>("input, textarea")?.focus({ preventScroll: true });
      return false;
    }
    return true;
  }, [sections, answers]);

  const errorCount = Object.keys(errors).length;

  return { answers, setAnswers, errors, setErrors, setAnswer, setOther, validateField, validateAll, errorCount };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

type Api = ReturnType<typeof useQuestionnaire>;

export function QuestionnaireSections({
  sections,
  state,
  disabled,
}: {
  sections: SectionDefinition[];
  state: Api;
  disabled?: boolean;
}) {
  return (
    <div className="divide-y divide-slate-200">
      {sections.map((sec, sIdx) => (
        <section key={sec.key} id={`section-${sec.number}`} className="py-10 first:pt-2 last:pb-2">
          <header className="mb-7">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-brand">
              Section {sIdx + 1} of {sections.length}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-navy">{sec.title.replace(/^\d+\.\s*/, "")}</h2>
            {sec.description && <p className="mt-1.5 max-w-2xl text-[15px] text-slate-600">{sec.description}</p>}
            <p className="mt-2 text-[13px] text-slate-500">
              Typically answered by: <span className="font-medium text-slate-700">{sec.defaultDepartment}</span>
            </p>
          </header>

          <div className="space-y-8">
            {sec.questions.map((q, qIdx) => (
              <QuestionField
                key={q.key}
                q={q}
                number={`${sIdx + 1}.${qIdx + 1}`}
                department={sec.defaultDepartment}
                state={state}
                disabled={disabled}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function optionParts(opt: string | { value: string; label: string }) {
  return typeof opt === "string" ? { value: opt, label: opt } : opt;
}

function QuestionField({
  q,
  number,
  department,
  state,
  disabled,
}: {
  q: QuestionDefinition;
  number: string;
  department: string;
  state: Api;
  disabled?: boolean;
}) {
  const stored = state.answers[q.key];
  const value = stored?.value;
  const error = state.errors[q.key];
  const otherError = state.errors[`${q.key}_other`];
  const inputId = `input-${q.key}`;
  const describedBy = error ? `${inputId}-error` : q.helpText ? `${inputId}-help` : undefined;

  const otherSelected = value === "Other" || (Array.isArray(value) && value.includes("Other"));
  const options = (q.options ?? []).map(optionParts);
  const shortOptions = options.length > 3 && options.every((o) => o.label.length <= 42);

  const textInputProps = (() => {
    switch (q.format) {
      case "email":
        return { type: "email", inputMode: "email" as const, autoComplete: "email" };
      case "phone":
        return { type: "tel", inputMode: "tel" as const, autoComplete: "tel", maxLength: 20 };
      case "url":
        return { type: "url", inputMode: "url" as const, autoComplete: "url" };
      default:
        return q.type === "number"
          ? { type: "text", inputMode: "decimal" as const }
          : { type: "text" };
    }
  })();

  return (
    <div id={`field-${q.key}`} className="scroll-mt-24">
      <label htmlFor={inputId} className="flex gap-3 text-[15px] font-medium text-slate-900">
        <span className="w-8 shrink-0 pt-px font-mono text-[13px] font-medium text-slate-400 sm:w-9">{number}</span>
        <span>
          {q.label}
          {q.required ? (
            <span className="ml-1 text-red-600" aria-hidden>
              *
            </span>
          ) : (
            <span className="ml-2 text-[13px] font-normal text-slate-400">Optional</span>
          )}
        </span>
      </label>

      <div className="mt-2.5 sm:pl-12">
        {q.helpText && (
          <p id={`${inputId}-help`} className="-mt-1 mb-2.5 text-[14px] text-slate-500">
            {q.helpText}
          </p>
        )}

        {(q.type === "text" || q.type === "number") && (
          <input
            id={inputId}
            {...textInputProps}
            value={typeof value === "string" ? value : value == null ? "" : String(value)}
            placeholder={q.placeholder}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            onChange={(e) => {
              let v = e.target.value;
              if (q.format === "phone") v = sanitizePhoneInput(v);
              if (q.type === "number") v = v.replace(/[^\d.]/g, "");
              state.setAnswer(q.key, v, department);
            }}
            onBlur={() => state.validateField(q, department)}
            className={inputClass(!!error, q.format === "phone" ? "sm:max-w-xs" : q.format ? "sm:max-w-md" : "")}
          />
        )}

        {q.type === "textarea" && (
          <textarea
            id={inputId}
            rows={4}
            value={typeof value === "string" ? value : ""}
            placeholder={q.placeholder}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            onChange={(e) => state.setAnswer(q.key, e.target.value, department)}
            className={inputClass(!!error, "resize-y")}
          />
        )}

        {(q.type === "radio" || q.type === "select" || q.type === "checkbox") && (
          <div
            role={q.type === "checkbox" ? "group" : "radiogroup"}
            aria-labelledby={inputId}
            className={`grid gap-1.5 ${shortOptions ? "sm:grid-cols-2" : ""}`}
          >
            {options.map((opt, i) => {
              const isCheckbox = q.type === "checkbox";
              const list = Array.isArray(value) ? (value as string[]) : [];
              const checked = isCheckbox ? list.includes(opt.value) : value === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 text-[15px] transition-colors ${
                    checked
                      ? "border-brand/40 bg-brand-50 text-slate-900"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  } ${disabled ? "pointer-events-none opacity-70" : ""}`}
                >
                  <input
                    id={i === 0 ? inputId : undefined}
                    type={isCheckbox ? "checkbox" : "radio"}
                    name={q.key}
                    checked={checked}
                    disabled={disabled}
                    onChange={() => {
                      if (isCheckbox) {
                        const next = checked ? list.filter((v) => v !== opt.value) : [...list, opt.value];
                        state.setAnswer(q.key, next, department);
                      } else {
                        state.setAnswer(q.key, opt.value, department);
                      }
                    }}
                    className="mt-[3px] h-4 w-4 shrink-0 cursor-pointer"
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
          </div>
        )}

        {otherSelected && (
          <div className="mt-2.5 sm:max-w-md">
            <input
              type="text"
              value={stored?.customOther ?? ""}
              placeholder="Please specify “Other”"
              disabled={disabled}
              aria-invalid={!!otherError}
              aria-label={`${q.label}: specify other`}
              onChange={(e) => state.setOther(q.key, e.target.value, department)}
              className={inputClass(!!otherError)}
            />
            {otherError && (
              <p className={errorTextClass}>
                <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
                {otherError}
              </p>
            )}
          </div>
        )}

        {q.type === "rating_grid" && q.gridRows && (
          <RatingGrid q={q} value={value} department={department} state={state} disabled={disabled} hasError={!!error} />
        )}

        {error && (
          <p id={`${inputId}-error`} role="alert" className={errorTextClass}>
            <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}
        {!error && q.format === "phone" && (
          <p className={hintClass}>10-digit Indian number, or include the country code (e.g. +44) for international.</p>
        )}
      </div>
    </div>
  );
}

function RatingGrid({
  q,
  value,
  department,
  state,
  disabled,
  hasError,
}: {
  q: QuestionDefinition;
  value: unknown;
  department: string;
  state: Api;
  disabled?: boolean;
  hasError: boolean;
}) {
  const columns = q.gridColumns?.length ? q.gridColumns : ["1 (Low)", "2", "3", "4", "5 (High)"];
  const ratings = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, number>) : {};

  return (
    <div className={`overflow-x-auto rounded-md border ${hasError ? "border-red-500" : "border-slate-200"}`}>
      <table className="w-full min-w-[560px] text-left text-[14px]">
        <thead className="bg-slate-50 text-[13px] text-slate-600">
          <tr>
            <th className="px-3 py-2.5 font-medium">Area</th>
            {columns.map((c) => (
              <th key={c} className="w-20 px-2 py-2.5 text-center font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {q.gridRows!.map((row) => (
            <tr key={row} className="hover:bg-slate-50/60">
              <td className="px-3 py-2.5 text-slate-800">{row}</td>
              {columns.map((c, i) => {
                const score = i + 1;
                return (
                  <td key={c} className="px-2 py-2.5 text-center">
                    <input
                      type="radio"
                      name={`${q.key}::${row}`}
                      aria-label={`${row}: ${c}`}
                      checked={ratings[row] === score}
                      disabled={disabled}
                      onChange={() => state.setAnswer(q.key, { ...ratings, [row]: score }, department)}
                      className="h-4 w-4 cursor-pointer"
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
