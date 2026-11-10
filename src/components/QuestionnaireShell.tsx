"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Check, CheckCircle2, Loader2 } from "lucide-react";
import BrandLogo from "./BrandLogo";
import { btnPrimary, cardClass } from "./ui";

export function SaveStatus({ saving, lastSaved }: { saving: boolean; lastSaved: string | null }) {
  if (saving) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Saving…
      </span>
    );
  }
  if (!lastSaved) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-500">
      <Check className="h-3.5 w-3.5 text-leaf" />
      {lastSaved.startsWith("Restored") ? "Draft restored" : `Saved ${lastSaved}`}
    </span>
  );
}

/** Page frame for a questionnaire: header bar, document card and submit footer. */
export function QuestionnaireShell({
  eyebrow,
  title,
  meta,
  intro,
  headerRight,
  saving,
  lastSaved,
  onSubmit,
  isSubmitting,
  submitLabel = "Submit assessment",
  submitError,
  errorCount,
  backHref,
  children,
}: {
  eyebrow: string;
  title: string;
  meta?: React.ReactNode;
  intro?: React.ReactNode;
  headerRight?: React.ReactNode;
  saving: boolean;
  lastSaved: string | null;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitLabel?: string;
  submitError?: string | null;
  errorCount: number;
  backHref?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f5f7f9]">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            {backHref && (
              <Link href={backHref} className="text-slate-500 hover:text-slate-800" aria-label="Back">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            )}
            <BrandLogo height={34} />
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">
              <SaveStatus saving={saving} lastSaved={lastSaved} />
            </span>
            {headerRight}
            <button type="button" onClick={onSubmit} disabled={isSubmitting} className={btnPrimary}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "Submitting…" : submitLabel}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        {submitError && (
          <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <span>{submitError}</span>
          </div>
        )}

        <article className={`${cardClass} px-5 py-8 sm:px-12 sm:py-12`}>
          <div className="border-b border-slate-200 pb-8">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-brand">{eyebrow}</p>
            <h1 className="mt-2 text-[26px] font-semibold leading-tight text-navy sm:text-[30px]">{title}</h1>
            {meta && <div className="mt-3 text-[15px] text-slate-600">{meta}</div>}
            {intro && (
              <div className="mt-6 rounded-md border-l-4 border-brand bg-brand-50 px-4 py-3 text-[15px] text-slate-700">
                {intro}
              </div>
            )}
          </div>

          {children}

          <footer className="mt-4 flex flex-col gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[14px] text-slate-500">
              {errorCount > 0 ? (
                <span className="font-medium text-red-600">
                  {errorCount} {errorCount === 1 ? "answer needs" : "answers need"} attention before you can submit.
                </span>
              ) : (
                "Your progress is saved automatically. You can return to this page at any time."
              )}
            </div>
            <button type="button" onClick={onSubmit} disabled={isSubmitting} className={`${btnPrimary} px-5 py-2.5`}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "Submitting…" : submitLabel}
            </button>
          </footer>
        </article>

        <p className="mt-6 text-center text-[13px] text-slate-400">Confidential · Prepared for A2000 AI Enablement</p>
      </main>
    </div>
  );
}

/** Confirmation shown after a successful submission. */
export function SubmittedScreen({
  heading = "Assessment submitted",
  children,
  action,
}: {
  heading?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f7f9] px-4 py-12">
      <BrandLogo height={44} className="mb-8" />
      <div className={`${cardClass} w-full max-w-lg p-8 text-center sm:p-10`}>
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-leaf-50">
          <CheckCircle2 className="h-7 w-7 text-leaf" />
        </div>
        <h1 className="text-2xl font-semibold text-navy">{heading}</h1>
        <div className="mt-3 text-[15px] leading-relaxed text-slate-600">{children}</div>
        {action && <div className="mt-8">{action}</div>}
      </div>
    </div>
  );
}

/** In-page confirmation dialog (replaces the unstyled browser confirm()). */
export function ConfirmSubmit({
  open,
  onCancel,
  onConfirm,
  body,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  body: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4" role="dialog" aria-modal="true">
      <div className={`${cardClass} w-full max-w-md p-6 shadow-xl`}>
        <h2 className="text-lg font-semibold text-navy">Submit your assessment?</h2>
        <div className="mt-2 text-[15px] text-slate-600">{body}</div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Keep editing
          </button>
          <button type="button" onClick={onConfirm} className={btnPrimary} autoFocus>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
