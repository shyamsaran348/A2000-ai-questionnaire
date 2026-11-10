"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getIndustry, type IndustryConfig } from "@/lib/data/industries";
import { generateA2000Pdf, downloadPdf } from "@/lib/services/pdf";
import SecurityGate from "./SecurityGate";
import { QuestionnaireSections, useQuestionnaire } from "./Questionnaire";
import { ConfirmSubmit, QuestionnaireShell, SubmittedScreen } from "./QuestionnaireShell";
import { btnGhost, btnPrimary } from "./ui";

/** Shared implementation of the /hospital, /finance, /food-and-beverage and /jewellery pages. */
export default function StandaloneQuestionnaire({ industryId }: { industryId: IndustryConfig["id"] }) {
  const ind = getIndustry(industryId);
  const cfg = ind.standalone;
  const q = useQuestionnaire(ind.sections);
  const { answers, setAnswers, setErrors } = q;

  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const restored = useRef(false);

  // Restore local draft.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(cfg.draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setAnswers(parsed);
          setLastSaved("Restored");
        }
      }
    } catch {
      /* ignore corrupt drafts */
    }
    restored.current = true;
  }, [cfg.draftKey, setAnswers]);

  // Debounced autosave (local + server).
  useEffect(() => {
    if (!restored.current || Object.keys(answers).length === 0 || isSubmitted) return;
    setSaving(true);
    const t = setTimeout(() => {
      try {
        localStorage.setItem(cfg.draftKey, JSON.stringify(answers));
      } catch {
        /* storage full / blocked */
      }
      fetch("/api/questionnaire/autosave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseCode: ind.caseCode, industry: cfg.industryLabel, answers }),
      }).catch(() => {});
      setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setSaving(false);
    }, 700);
    return () => clearTimeout(t);
  }, [answers, cfg.draftKey, cfg.industryLabel, ind.caseCode, isSubmitted]);

  const requestSubmit = () => {
    setSubmitError(null);
    if (!q.validateAll()) return;
    setConfirmOpen(true);
  };

  const submit = async () => {
    setConfirmOpen(false);
    setIsSubmitting(true);
    const str = (k: string) => (typeof answers[k]?.value === "string" ? (answers[k].value as string) : "");
    const companyName = str(cfg.companyKey) || cfg.companyFallback;

    const pdf = generateA2000Pdf({
      caseCode: ind.caseCode,
      clientName: companyName,
      industry: cfg.industryLabel,
      answers,
      sections: ind.sections,
    });

    try {
      const res = await fetch("/api/questionnaire/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: cfg.industryLabel,
          caseCode: ind.caseCode,
          clientName: companyName,
          email: str(cfg.emailKey),
          phone: str(cfg.phoneKey),
          contactPerson: str(cfg.contactKey),
          answers,
          pdfBase64: pdf.base64,
          filename: pdf.filename,
          submittedAt: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Submission failed");
      downloadPdf(pdf.doc, pdf.filename);
      localStorage.removeItem(cfg.draftKey);
      setIsSubmitted(true);
    } catch (e: any) {
      setSubmitError(
        e?.message && e.message !== "Submission failed"
          ? e.message
          : "We couldn't record your submission. Please try again or contact your A2000 representative."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearAll = () => {
    setAnswers({});
    setErrors({});
    localStorage.removeItem(cfg.draftKey);
    setLastSaved(null);
    setConfirmClear(false);
  };

  return (
    <SecurityGate title={cfg.title}>
      {isSubmitted ? (
        <SubmittedScreen
          action={
            <Link href="/" className={btnPrimary}>
              Return to home
            </Link>
          }
        >
          Thank you. Your responses have been received by A2000 and a PDF copy has been downloaded to your device. Our
          team will review your submission and be in touch shortly.
        </SubmittedScreen>
      ) : (
        <>
          <QuestionnaireShell
            eyebrow="A2000 AI Enablement · Confidential"
            title={cfg.title}
            intro="Your answers help A2000 understand your operations, technology and challenges, so we can identify where AI will make the biggest difference. Approximate answers are fine."
            headerRight={
              confirmClear ? (
                <span className="flex items-center gap-1 text-[13px] text-slate-600">
                  Clear all answers?
                  <button type="button" onClick={clearAll} className="font-semibold text-red-600 hover:underline">
                    Yes
                  </button>
                  <span>/</span>
                  <button type="button" onClick={() => setConfirmClear(false)} className="font-medium hover:underline">
                    No
                  </button>
                </span>
              ) : (
                <span className="hidden sm:block">
                  <button type="button" onClick={() => setConfirmClear(true)} className={btnGhost}>
                    Clear
                  </button>
                </span>
              )
            }
            saving={saving}
            lastSaved={lastSaved}
            onSubmit={requestSubmit}
            isSubmitting={isSubmitting}
            submitError={submitError}
            errorCount={q.errorCount}
          >
            <QuestionnaireSections sections={ind.sections} state={q} disabled={isSubmitting} />
          </QuestionnaireShell>
          <ConfirmSubmit
            open={confirmOpen}
            onCancel={() => setConfirmOpen(false)}
            onConfirm={submit}
            body="Your responses will be sent to A2000 and a PDF copy will download to your device."
          />
        </>
      )}
    </SecurityGate>
  );
}
