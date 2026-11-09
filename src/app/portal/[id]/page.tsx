"use client";

import React, { useState, useEffect, use, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Building2,
  Landmark,
  UtensilsCrossed,
  Gem,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

// Seeds & Generators
import { HOSPITAL_QUESTIONNAIRE_SECTIONS } from "@/lib/data/hospital-seed";
import { FINANCE_QUESTIONNAIRE_SECTIONS } from "@/lib/data/finance-seed";
import { FOOD_BEVERAGE_QUESTIONNAIRE_SECTIONS } from "@/lib/data/food-beverage-seed";
import { JEWELLERY_QUESTIONNAIRE_SECTIONS } from "@/lib/data/jewellery-seed";
import { generateA2000Pdf, downloadPdf } from "@/lib/services/pdf";

interface Customer {
  id: string;
  companyName: string;
  website?: string;
  industry: string;
  contactName: string;
  email: string;
  phone?: string;
  status: string;
  answers: Record<string, any>;
  submittedAt?: string;
}

const INDUSTRY_CONFIGS: Record<string, {
  title: string;
  caseCode: string;
  icon: any;
  sections: any[];
}> = {
  hospital: {
    title: "Hospital & Healthcare Discovery Assessment",
    caseCode: "A2000-HOSPITAL",
    icon: Building2,
    sections: HOSPITAL_QUESTIONNAIRE_SECTIONS,
  },
  finance: {
    title: "Finance & FinTech Discovery Assessment",
    caseCode: "A2000-FN",
    icon: Landmark,
    sections: FINANCE_QUESTIONNAIRE_SECTIONS,
  },
  "food-and-beverage": {
    title: "Food & Beverage Discovery Assessment",
    caseCode: "A2000-FB",
    icon: UtensilsCrossed,
    sections: FOOD_BEVERAGE_QUESTIONNAIRE_SECTIONS,
  },
  jewellery: {
    title: "Jewellery & Retail Discovery Assessment",
    caseCode: "A2000-JW",
    icon: Gem,
    sections: JEWELLERY_QUESTIONNAIRE_SECTIONS,
  },
};

export default function ClientPortalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const customerId = resolvedParams.id;

  // Customer State
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Authentication State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Form State
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isInitialMount = useRef(true);

  // 1. Fetch customer details on mount
  useEffect(() => {
    async function fetchCustomer() {
      try {
        const res = await fetch(`/api/customers/${customerId}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Assessment portal not found");
        }
        setCustomer(data.customer);

        // Check if unlocked previously in this session
        const sessionKey = `unlocked_${customerId}`;
        if (sessionStorage.getItem(sessionKey) === "true") {
          setIsUnlocked(true);
        }

        // Initialize answers from server
        if (data.customer.answers && Object.keys(data.customer.answers).length > 0) {
          setAnswers(data.customer.answers);
          setLastSaved("Restored from database");
        }

        if (data.customer.status === "submitted") {
          setIsSubmitted(true);
        }
      } catch (err: any) {
        setLoadError(err.message);
      } finally {
        setLoadingCustomer(false);
      }
    }
    fetchCustomer();
  }, [customerId]);

  // 2. Autosave answers to server (debounced 800ms)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!isUnlocked || Object.keys(answers).length === 0 || isSubmitted) return;

    setIsSaving(true);
    const timer = setTimeout(async () => {
      try {
        await fetch(`/api/customers/${customerId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "autosave",
            answers,
          }),
        });
        const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setLastSaved(timeStr);
      } catch (e) {
        console.warn("Autosave failed:", e);
      } finally {
        setIsSaving(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [answers, isUnlocked, customerId, isSubmitted]);

  // Handle Passcode Unlock
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setAuthError("Please enter your assigned security passcode.");
      return;
    }

    setIsVerifying(true);
    setAuthError(null);

    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_code",
          accessCode: passcode.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.authorized) {
        setIsUnlocked(true);
        sessionStorage.setItem(`unlocked_${customerId}`, "true");
      } else {
        setAuthError(data.error || "Incorrect security passcode. Please verify the code provided by A2000.");
      }
    } catch (e: any) {
      setAuthError("Network error. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Update Answer Helper
  const setAnswer = (questionKey: string, value: any, dept: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionKey]: {
        value,
        department: dept,
        customOther: prev[questionKey]?.customOther || "",
      },
    }));

    if (errors[questionKey]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[questionKey];
        return next;
      });
    }
  };

  const setCustomOther = (questionKey: string, otherText: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionKey]: {
        ...(prev[questionKey] || {}),
        customOther: otherText,
      },
    }));
  };

  const indConfig = customer ? INDUSTRY_CONFIGS[customer.industry] || INDUSTRY_CONFIGS.hospital : INDUSTRY_CONFIGS.hospital;

  // Form Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    indConfig.sections.forEach((sec) => {
      sec.questions.forEach((q: any) => {
        if (q.required) {
          const val = answers[q.key]?.value;
          if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
            newErrors[q.key] = `${q.label} is required.`;
          }
        }
      });
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrorKey = Object.keys(newErrors)[0];
      const el = document.getElementById(`field-${firstErrorKey}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return false;
    }
    return true;
  };

  // Handle Final Submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      alert("Please complete the required fields highlighted in red before submitting.");
      return;
    }

    if (!confirm("Are you ready to submit your assessment to A2000? You will receive a downloadable executive PDF.")) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    // 1. Generate Deliverable PDF
    const pdfResult = generateA2000Pdf({
      caseCode: indConfig.caseCode,
      clientName: customer?.companyName || "Valued Enterprise Client",
      industry: indConfig.title,
      answers,
      sections: indConfig.sections,
    });

    // 2. Submit to Server
    try {
      const res = await fetch("/api/questionnaire/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          industry: indConfig.title,
          caseCode: indConfig.caseCode,
          clientName: customer?.companyName,
          email: customer?.email,
          phone: customer?.phone,
          contactPerson: customer?.contactName,
          answers,
          pdfBase64: pdfResult.base64,
          filename: pdfResult.filename,
          submittedAt: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Trigger client download
        downloadPdf(pdfResult.doc, pdfResult.filename);
        setIsSubmitted(true);
      } else {
        setSubmitError("There was an issue recording your submission. Please notify your A2000 consultant.");
      }
    } catch (e: any) {
      setSubmitError("Failed to submit due to network issue. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // STATE 1: LOADING OR ERROR
  // -------------------------------------------------------------
  if (loadingCustomer) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-[#C97835] animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-700">Loading Client Assessment Portal...</p>
        </div>
      </div>
    );
  }

  if (loadError || !customer) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-300 rounded-lg p-8 text-center shadow-sm">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Assessment Portal Not Found</h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            This dedicated link does not exist or has expired. Please check your invitation email or contact your A2000 enablement consultant.
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 2: PASSCODE SECURITY GATE
  // -------------------------------------------------------------
  if (!isUnlocked) {
    const IndIcon = indConfig.icon;
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center mb-5">
            <Image
              src="/a2000-logo.png"
              alt="A2000"
              width={160}
              height={50}
              className="h-10 w-auto"
              priority
            />
          </div>

          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-2 border border-slate-200">
              <IndIcon className="w-3.5 h-3.5 text-[#C97835]" />
              <span>{customer.companyName}</span>
            </div>
            <h1 className="text-xl font-bold text-[#17324D] tracking-tight">
              Enterprise Discovery Assessment
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Confidential Client Enablement Portal
            </p>
          </div>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 shadow-sm border border-slate-300 sm:rounded-lg sm:px-10">
            <div className="mb-5 pb-4 border-b border-slate-100">
              <div className="text-xs text-slate-500">Prepared for:</div>
              <div className="text-sm font-bold text-slate-900">{customer.contactName}</div>
              <div className="text-xs text-slate-600">{customer.email}</div>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Security Passcode
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter assigned passcode"
                    className="w-full rounded border border-slate-300 px-3.5 py-2.5 text-sm font-mono tracking-wider text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#C97835] focus:ring-1 focus:ring-[#C97835]"
                    autoFocus
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Your security passcode was sent in your A2000 invitation email.
                </p>
              </div>

              {authError && (
                <div className="p-2.5 rounded bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded text-sm font-semibold text-white bg-[#17324D] hover:bg-[#0f2235] transition shadow-sm disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#C97835]" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Unlock Assessment</span>
                    <ArrowRight className="w-4 h-4 text-[#C97835]" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Encrypted & Confidential &bull; A2000 Consulting</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 3: POST-SUBMISSION SUCCESS SCREEN
  // -------------------------------------------------------------
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white border border-slate-300 rounded-lg p-8 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#17324D] mb-2">Assessment Submitted</h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Thank you, <strong>{customer.contactName}</strong>. Your responses for <strong>{customer.companyName}</strong> have been securely recorded. The A2000 AI Enablement team has received your submission and will begin synthesis for your discovery session.
          </p>

          <div className="p-4 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700 text-left mb-6 space-y-1.5">
            <div><strong>Organization:</strong> {customer.companyName}</div>
            <div><strong>Industry Track:</strong> {indConfig.title}</div>
            <div><strong>Delivery:</strong> Executive PDF dispatched to A2000 consulting team</div>
          </div>

          <p className="text-xs text-slate-400">
            A copy of the executive deliverable was downloaded to your device. If you need any assistance, reach out directly to your assigned A2000 consultant.
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 4: FULL QUESTIONNAIRE FORM (AUTHENTICATED)
  // -------------------------------------------------------------
  const IndIcon = indConfig.icon;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900">
      {/* Top Floating Action Bar */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-300 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center space-x-3">
            <Image
              src="/a2000-logo.png"
              alt="A2000"
              width={100}
              height={30}
              className="h-6 w-auto"
            />
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-800">
              <IndIcon className="w-4 h-4 text-[#C97835]" />
              <span>{customer.companyName}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Autosave status indicator */}
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              {isSaving ? (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                  <span>Saving draft...</span>
                </>
              ) : lastSaved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Saved at {lastSaved}</span>
                </>
              ) : null}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#17324D] hover:bg-[#0f2235] px-3.5 py-1.5 rounded transition shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-[#C97835]" />
              {isSubmitting ? "Submitting..." : "Submit Assessment & Download PDF"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-20">
        {submitError && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Main Document Card */}
        <div className="bg-white border border-slate-300 rounded shadow-sm p-6 sm:p-10 space-y-8">
          
          {/* Header */}
          <div className="border-b border-slate-200 pb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C97835]">
                A2000 | AI Enablement
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                Confidential Client Portal
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#17324D]">
              {indConfig.title}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Custom Discovery for <strong>{customer.companyName}</strong> &bull; Contact: {customer.contactName} ({customer.email})
            </p>
          </div>

          {/* Render All Sections */}
          <div className="space-y-10">
            {indConfig.sections.map((sec: any) => (
              <section key={sec.key} className="space-y-6 pt-2">
                <div className="border-b border-slate-200 pb-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-[#17324D]">{sec.title}</h2>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">
                      {sec.defaultDepartment}
                    </span>
                  </div>
                  {sec.description && (
                    <p className="text-xs text-slate-500 mt-1">{sec.description}</p>
                  )}
                </div>

                <div className="space-y-6">
                  {sec.questions.map((q: any) => {
                    const currentVal = answers[q.key]?.value;
                    const hasError = !!errors[q.key];

                    return (
                      <div
                        key={q.key}
                        id={`field-${q.key}`}
                        className={`p-4 rounded border transition ${
                          hasError
                            ? "border-red-400 bg-red-50/30"
                            : "border-slate-200 hover:border-slate-300 bg-slate-50/30"
                        }`}
                      >
                        <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                          {q.label}
                          {q.required && <span className="text-red-500 ml-1">*</span>}
                        </label>

                        {q.helpText && (
                          <p className="text-[11px] text-slate-500 mb-2">{q.helpText}</p>
                        )}

                        {/* TEXT / NUMBER */}
                        {(q.type === "text" || q.type === "number") && (
                          <input
                            type={q.type}
                            value={currentVal !== undefined ? currentVal : ""}
                            onChange={(e) => setAnswer(q.key, e.target.value, sec.defaultDepartment)}
                            placeholder={q.placeholder || "Enter details..."}
                            className="w-full text-xs border border-slate-300 rounded px-3 py-2 text-slate-900 bg-white focus:outline-none focus:border-[#C97835]"
                          />
                        )}

                        {/* TEXTAREA */}
                        {q.type === "textarea" && (
                          <textarea
                            rows={3}
                            value={currentVal !== undefined ? currentVal : ""}
                            onChange={(e) => setAnswer(q.key, e.target.value, sec.defaultDepartment)}
                            placeholder={q.placeholder || "Enter comprehensive details..."}
                            className="w-full text-xs border border-slate-300 rounded px-3 py-2 text-slate-900 bg-white focus:outline-none focus:border-[#C97835]"
                          />
                        )}

                        {/* RADIO */}
                        {q.type === "radio" && (
                          <div className="space-y-2 mt-2">
                            {q.options?.map((opt: any) => {
                              const val = typeof opt === "string" ? opt : opt.value;
                              const label = typeof opt === "string" ? opt : opt.label;
                              const isChecked = currentVal === val;

                              return (
                                <label
                                  key={val}
                                  className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer"
                                >
                                  <input
                                    type="radio"
                                    name={q.key}
                                    checked={isChecked}
                                    onChange={() => setAnswer(q.key, val, sec.defaultDepartment)}
                                    className="text-[#C97835] focus:ring-[#C97835]"
                                  />
                                  <span>{label}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {/* CHECKBOX */}
                        {q.type === "checkbox" && (
                          <div className="space-y-2 mt-2">
                            {q.options?.map((opt: any) => {
                              const val = typeof opt === "string" ? opt : opt.value;
                              const label = typeof opt === "string" ? opt : opt.label;
                              const arr = Array.isArray(currentVal) ? currentVal : [];
                              const isChecked = arr.includes(val);

                              return (
                                <label
                                  key={val}
                                  className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const next = e.target.checked
                                        ? [...arr, val]
                                        : arr.filter((item: string) => item !== val);
                                      setAnswer(q.key, next, sec.defaultDepartment);
                                    }}
                                    className="rounded border-slate-300 text-[#C97835] focus:ring-[#C97835]"
                                  />
                                  <span>{label}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {/* RATING GRID */}
                        {q.type === "rating_grid" && q.gridRows && (
                          <div className="mt-3 overflow-x-auto border border-slate-200 rounded">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                                <tr>
                                  <th className="px-3 py-2">Workflow / Capability</th>
                                  {[1, 2, 3, 4, 5].map((num) => (
                                    <th key={num} className="px-2 py-2 text-center w-12">
                                      {num}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {q.gridRows.map((rowName: string) => {
                                  const gridVal = currentVal && typeof currentVal === "object" ? currentVal[rowName] : undefined;
                                  return (
                                    <tr key={rowName}>
                                      <td className="px-3 py-2 text-slate-700 font-medium">{rowName}</td>
                                      {[1, 2, 3, 4, 5].map((score) => (
                                        <td key={score} className="px-2 py-2 text-center">
                                          <input
                                            type="radio"
                                            name={`${q.key}-${rowName}`}
                                            checked={gridVal === score}
                                            onChange={() => {
                                              const updated = {
                                                ...(typeof currentVal === "object" ? currentVal : {}),
                                                [rowName]: score,
                                              };
                                              setAnswer(q.key, updated, sec.defaultDepartment);
                                            }}
                                            className="text-[#C97835] focus:ring-[#C97835]"
                                          />
                                        </td>
                                      ))}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {hasError && (
                          <p className="text-[11px] text-red-600 mt-1.5 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{errors[q.key]}</span>
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* Bottom Actions Bar */}
          <div className="border-t border-slate-200 pt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Drafts are autosaved continuously. Click submit to deliver to A2000 and receive your executive PDF.
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-[#17324D] hover:bg-[#0f2235] px-5 py-2.5 rounded transition shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-[#C97835]" />
              {isSubmitting ? "Submitting Assessment..." : "Submit Assessment & Download PDF"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

