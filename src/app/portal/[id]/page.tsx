"use client";

import React, { useState, useEffect, use, useRef } from "react";
import { AlertCircle, Loader2, Lock } from "lucide-react";
import { getIndustry } from "@/lib/data/industries";
import { generateA2000Pdf, downloadPdf } from "@/lib/services/pdf";
import BrandLogo from "@/components/BrandLogo";
import { QuestionnaireSections, useQuestionnaire, type Answers } from "@/components/Questionnaire";
import { ConfirmSubmit, QuestionnaireShell, SubmittedScreen } from "@/components/QuestionnaireShell";
import { btnPrimary, cardClass, errorTextClass, inputClass, labelClass } from "@/components/ui";

interface Customer {
  id: string;
  companyName: string;
  website?: string;
  industry: string;
  contactName: string;
  email: string;
  phone?: string;
  status: string;
  answers: Answers;
  submittedAt?: string;
}

export default function ClientPortalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: customerId } = use(params);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const ind = getIndustry(customer?.industry);
  const q = useQuestionnaire(ind.sections);
  const { answers, setAnswers } = q;
  const loadedAnswers = useRef<Answers | null>(null);

  // 1. Load the customer record and any saved answers.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/customers/${customerId}`);
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Assessment portal not found");
        const c: Customer = data.customer;
        setCustomer(c);

        if (sessionStorage.getItem(`unlocked_${customerId}`) === "true") setIsUnlocked(true);

        // Pre-fill the profile questions we already know from the customer record.
        const cfg = getIndustry(c.industry).standalone;
        const dept = getIndustry(c.industry).sections[0]?.defaultDepartment ?? "";
        const saved: Answers = c.answers && typeof c.answers === "object" ? { ...c.answers } : {};
        const prefill: Record<string, string | undefined> = {
          [cfg.companyKey]: c.companyName,
          [cfg.contactKey]: c.contactName,
          [cfg.emailKey]: c.email,
          [cfg.phoneKey]: c.phone,
        };
        Object.entries(prefill).forEach(([k, v]) => {
          if (v && !saved[k]?.value) saved[k] = { value: v, department: dept };
        });
        loadedAnswers.current = saved;
        setAnswers(saved);
        if (c.answers && Object.keys(c.answers).length > 0) setLastSaved("Restored");
        if (c.status === "submitted") setIsSubmitted(true);
      } catch (err: any) {
        setLoadError(err.message);
      } finally {
        setLoadingCustomer(false);
      }
    })();
  }, [customerId, setAnswers]);

  // 2. Debounced autosave to the customer record.
  useEffect(() => {
    // Don't write back the snapshot we just loaded, or an empty form.
    if (answers === loadedAnswers.current || Object.keys(answers).length === 0) return;
    if (!isUnlocked || isSubmitted) return;

    setSaving(true);
    const timer = setTimeout(async () => {
      try {
        await fetch(`/api/customers/${customerId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "autosave", answers }),
        });
        setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } catch (e) {
        console.warn("Autosave failed:", e);
      } finally {
        setSaving(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [answers, isUnlocked, customerId, isSubmitted]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setAuthError("Enter the passcode from your invitation email.");
      return;
    }
    setIsVerifying(true);
    setAuthError(null);
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify_code", accessCode: passcode.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.authorized) {
        setIsUnlocked(true);
        sessionStorage.setItem(`unlocked_${customerId}`, "true");
      } else {
        setAuthError(data.error || "That passcode is incorrect. Check your invitation email and try again.");
      }
    } catch {
      setAuthError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const requestSubmit = () => {
    setSubmitError(null);
    if (!q.validateAll()) return;
    setConfirmOpen(true);
  };

  const submit = async () => {
    setConfirmOpen(false);
    setIsSubmitting(true);

    const pdf = generateA2000Pdf({
      caseCode: ind.caseCode,
      clientName: customer?.companyName || "Valued Enterprise Client",
      industry: ind.assessmentTitle,
      answers,
      sections: ind.sections,
    });

    try {
      const res = await fetch("/api/questionnaire/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          industry: ind.assessmentTitle,
          caseCode: ind.caseCode,
          clientName: customer?.companyName,
          email: customer?.email,
          phone: customer?.phone,
          contactPerson: customer?.contactName,
          answers,
          pdfBase64: pdf.base64,
          filename: pdf.filename,
          submittedAt: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error();
      downloadPdf(pdf.doc, pdf.filename);
      setIsSubmitted(true);
    } catch {
      setSubmitError("We couldn't record your submission. Please try again, or contact your A2000 consultant.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------

  if (loadingCustomer) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6">
        <BrandLogo height={44} />
        <Loader2 className="h-5 w-5 animate-spin text-brand" aria-label="Loading" />
      </div>
    );
  }

  if (loadError || !customer) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f7f9] px-4">
        <BrandLogo height={44} className="mb-8" />
        <div className={`${cardClass} w-full max-w-md p-8 text-center`}>
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-600" />
          <h1 className="text-xl font-semibold text-navy">Link not found</h1>
          <p className="mt-2 text-[15px] text-slate-600">
            This assessment link doesn&apos;t exist or is no longer active. Please check your invitation email or
            contact your A2000 consultant.
          </p>
        </div>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f7f9] px-4 py-12">
        <BrandLogo height={48} className="mb-8" />
        <div className={`${cardClass} w-full max-w-md p-7 sm:p-8`}>
          <p className="text-[13px] font-semibold uppercase tracking-wide text-brand">{ind.name}</p>
          <h1 className="mt-1 text-xl font-semibold text-navy">AI Enablement Discovery Assessment</h1>
          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-md bg-slate-50 px-4 py-3 text-[14px]">
            <dt className="text-slate-500">Organisation</dt>
            <dd className="font-medium text-slate-900">{customer.companyName}</dd>
            <dt className="text-slate-500">Prepared for</dt>
            <dd className="font-medium text-slate-900">{customer.contactName}</dd>
          </dl>

          <form onSubmit={handleUnlock} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="portal-passcode" className={labelClass}>
                Access passcode
              </label>
              <div className="relative mt-1.5">
                <input
                  id="portal-passcode"
                  type="password"
                  autoComplete="off"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  placeholder="e.g. A2K-1234"
                  aria-invalid={!!authError}
                  className={inputClass(!!authError, "pr-10 font-mono tracking-wide")}
                  autoFocus
                />
                <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
              {authError ? (
                <p role="alert" className={errorTextClass}>
                  <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
                  {authError}
                </p>
              ) : (
                <p className="mt-1.5 text-[13px] text-slate-500">You&apos;ll find this in your A2000 invitation email.</p>
              )}
            </div>
            <button type="submit" disabled={isVerifying} className={`${btnPrimary} w-full py-2.5`}>
              {isVerifying && <Loader2 className="h-4 w-4 animate-spin" />}
              {isVerifying ? "Verifying…" : "Open assessment"}
            </button>
          </form>
        </div>
        <p className="mt-6 text-[13px] text-slate-500">Your responses are confidential and shared only with A2000.</p>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <SubmittedScreen>
        Thank you, <span className="font-medium text-slate-900">{customer.contactName}</span>. The responses for{" "}
        <span className="font-medium text-slate-900">{customer.companyName}</span> have been received by the A2000 AI
        Enablement team, who will review them ahead of your discovery session.
      </SubmittedScreen>
    );
  }

  return (
    <>
      <QuestionnaireShell
        eyebrow={`${customer.companyName} · Confidential`}
        title={ind.assessmentTitle}
        meta={
          <>
            Prepared for {customer.contactName} · {customer.email}
          </>
        }
        intro="Please answer as accurately as you can — approximate figures are fine. Your answers save automatically, so you can leave and come back using the same link."
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
        body="Your responses will be sent to A2000 and a PDF copy will download to your device. You won't be able to edit them afterwards."
      />
    </>
  );
}
