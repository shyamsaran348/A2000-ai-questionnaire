"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { FOOD_BEVERAGE_QUESTIONNAIRE_SECTIONS } from "@/lib/data/food-beverage-seed";
import { generateA2000Pdf } from "@/lib/services/pdf";
import SecurityGate from "@/components/SecurityGate";
import {
  Download,
  RefreshCw,
  UtensilsCrossed,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";

export default function FoodBeverageQuestionnairePage() {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const isInitialMount = useRef(true);

  // 1. Restore from localStorage on initial load
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem("a2000_draft_food_beverage");
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed && typeof parsed === "object") {
          setAnswers(parsed);
          setLastSaved("Restored from draft");
        }
      }
    } catch (e) {
      console.warn("Could not restore draft:", e);
    }
  }, []);

  // 2. Debounced Autosave to localStorage & server
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (Object.keys(answers).length === 0) return;

    setIsSaving(true);
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem("a2000_draft_food_beverage", JSON.stringify(answers));
        const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setLastSaved(now);

        fetch("/api/questionnaire/autosave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseCode: "A2000-FB",
            industry: "Food & Beverage",
            answers,
          }),
        }).catch(() => {});
      } catch (err) {
        console.warn("Autosave error:", err);
      } finally {
        setIsSaving(false);
      }
    }, 600);

    return () => clearTimeout(timeoutId);
  }, [answers]);

  const setAnswer = (questionKey: string, value: any, dept: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionKey]: {
        value,
        department: dept,
      },
    }));

    // Clear error on change if fixed
    if (errors[questionKey]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[questionKey];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    FOOD_BEVERAGE_QUESTIONNAIRE_SECTIONS.forEach((sec) => {
      sec.questions.forEach((q) => {
        const stored = answers[q.key];
        const val = stored?.value;

        // 1. Required check
        if (q.required) {
          if (!val || (typeof val === "string" && !val.trim())) {
            newErrors[q.key] = `${q.label} is required.`;
            return;
          }
        }

        // 2. Email format validation
        if (q.key.includes("email") && val && typeof val === "string" && val.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(val.trim())) {
            newErrors[q.key] = "Please enter a valid email address (e.g., name@company.com).";
            return;
          }
        }

        // 3. Phone format validation
        if (q.key.includes("phone") && val && typeof val === "string" && val.trim()) {
          const digitsOnly = val.replace(/\D/g, "");
          if (digitsOnly.length < 10) {
            newErrors[q.key] = "Please enter a valid phone number with at least 10 digits.";
            return;
          }
        }

        // 4. "Other" specification check
        const isOther =
          val === "Other" || (Array.isArray(val) && val.includes("Other"));
        if (isOther && (!stored?.customOther || !stored.customOther.trim())) {
          newErrors[`${q.key}_other`] = "Please specify details for 'Other'.";
        }
      });
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // Scroll to first error
      const firstErrorKey = Object.keys(newErrors)[0].replace("_other", "");
      const el = document.getElementById(`field-${firstErrorKey}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return false;
    }

    return true;
  };

  const handleDownload = async () => {
    if (!validateForm()) {
      alert("Please fill in the required fields highlighted in red before submitting.");
      return;
    }

    setIsSubmitting(true);
    const companyName = (answers["fb_q1_company_name"]?.value as string) || "Food & Beverage Enterprise";

    // 1. Generate PDF deliverable & get base64
    const pdfResult = generateA2000Pdf({
      caseCode: "A2000-FB",
      clientName: companyName,
      industry: "Food & Beverage",
      answers,
      sections: FOOD_BEVERAGE_QUESTIONNAIRE_SECTIONS,
    });

    // 2. Persist in database & email PDF to ramyadevi@a2000india.com
    try {
      const res = await fetch("/api/questionnaire/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: "Food & Beverage",
          caseCode: "A2000-FB",
          clientName: companyName,
          email: answers["fb_q1_email"]?.value || "",
          phone: answers["fb_q1_phone"]?.value || "",
          contactPerson: answers["fb_q1_contact_person"]?.value || "",
          answers,
          pdfBase64: pdfResult.base64,
          filename: pdfResult.filename,
          submittedAt: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(
          "Thank you! Your questionnaire has been submitted to A2000, stored in the database, and a copy has been sent to ramyadevi@a2000india.com. The PDF has also been saved to your device."
        );
      }
    } catch (e) {
      console.warn("Could not submit copy to server:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear all filled answers? This will also remove the saved draft.")) {
      setAnswers({});
      setErrors({});
      localStorage.removeItem("a2000_draft_food_beverage");
      setLastSaved(null);
    }
  };

  return (
    <SecurityGate
      title="Food & Beverage Discovery Questionnaire"
      subtitle="A2000 | AI Enablement"
    >
      <div className="max-w-4xl mx-auto pb-16">
        {/* Top Floating Action Bar */}
        <div className="sticky top-4 z-40 bg-white/95 backdrop-blur-xs border border-slate-300 rounded shadow-sm px-4 py-2.5 mb-6 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1 rounded hover:bg-slate-100 transition"
              title="Return to industry directory"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Questionnaires</span>
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-800 font-semibold flex items-center gap-1.5">
              <UtensilsCrossed className="w-4 h-4 text-[#C97835]" />
              Food & Beverage Questionnaire
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500 mr-1">
              {isSaving ? (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : lastSaved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Saved</span>
                </>
              ) : null}
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              Clear
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#17324D] hover:bg-[#0f2235] px-3.5 py-1.5 rounded transition shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-[#C97835]" />
              {isSubmitting ? "Submitting..." : "Submit & Download PDF"}
            </button>
          </div>
        </div>

      {/* Main Single Document Form */}
      <div className="bg-white border border-slate-300 rounded shadow-sm p-6 sm:p-10 space-y-8">
        
        {/* Document Header */}
        <div className="border-b border-slate-300 pb-6">
          <div className="flex items-center justify-between mb-3">
            <Image
              src="/a2000-logo.png"
              alt="A2000 Logo"
              width={120}
              height={38}
              className="object-contain"
              priority
            />
            <span className="text-[11px] font-bold tracking-widest uppercase text-slate-500 border border-slate-300 bg-slate-50 px-2.5 py-1 rounded">
              CONFIDENTIAL
            </span>
          </div>
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-[#17324D]" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Food & Beverage Discovery Questionnaire
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            A2000 | AI Enablement • Confidential Assessment • Case: A2000-FB
          </p>
        </div>

        {/* Guidance Box */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 leading-relaxed">
          Your answers will help A2000 understand your business operations, technology, and challenges to identify opportunities for AI enablement. Approximate answers are fine. Autosave is active and your responses are saved automatically.
        </div>

        {/* 12 Sections */}
        <div className="space-y-10">
          {FOOD_BEVERAGE_QUESTIONNAIRE_SECTIONS.map((sec) => (
            <section
              key={sec.number}
              id={`section-${sec.number}`}
              className="border-t border-slate-200 pt-8 first:border-0 first:pt-0"
            >
              {/* Clean Section Heading */}
              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  {sec.title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Scope: <strong>{sec.description}</strong>
                </p>
              </div>

              {/* Questions */}
              <div className="space-y-5">
                {sec.questions.map((q, idx) => {
                  const storedObj = answers[q.key];
                  const currentVal = storedObj?.value;
                  const customOtherText = storedObj?.customOther || "";
                  const errorMsg = errors[q.key] || errors[`${q.key}_other`];

                  const isOtherSelected =
                    q.type === "radio"
                      ? currentVal === "Other"
                      : Array.isArray(currentVal) && currentVal.includes("Other");

                  return (
                    <div
                      key={q.key}
                      id={`field-${q.key}`}
                      className={`space-y-1.5 text-sm p-2 rounded transition ${
                        errorMsg ? "bg-red-50/50 border border-red-200" : ""
                      }`}
                    >
                      <label className="block font-medium text-slate-800">
                        {sec.number}.{idx + 1} {q.label} {q.required && <span className="text-red-500 font-bold">*</span>}
                      </label>

                      {/* Text Input */}
                      {q.type === "text" && (
                        <input
                          type={q.key.includes("email") ? "email" : q.key.includes("phone") ? "tel" : "text"}
                          value={currentVal || ""}
                          placeholder={q.placeholder}
                          onChange={(e) => setAnswer(q.key, e.target.value, sec.defaultDepartment)}
                          className={`w-full text-sm p-2 border rounded bg-white text-slate-900 focus:outline-none ${
                            errorMsg ? "border-red-400 focus:border-red-500" : "border-slate-300 focus:border-[#17324D]"
                          }`}
                        />
                      )}

                      {/* Textarea */}
                      {q.type === "textarea" && (
                        <textarea
                          rows={3}
                          value={currentVal || ""}
                          placeholder={q.placeholder}
                          onChange={(e) => setAnswer(q.key, e.target.value, sec.defaultDepartment)}
                          className={`w-full text-sm p-2 border rounded bg-white text-slate-900 focus:outline-none ${
                            errorMsg ? "border-red-400 focus:border-red-500" : "border-slate-300 focus:border-[#17324D]"
                          }`}
                        />
                      )}

                      {/* Radio Selection (Native click with toggle/deselect) */}
                      {q.type === "radio" && (
                        <div className="space-y-1.5 pt-0.5">
                          {q.options?.map((opt: any) => {
                            const optVal = typeof opt === "string" ? opt : opt.value;
                            const optLabel = typeof opt === "string" ? opt : opt.label;
                            const isChecked = currentVal === optVal;

                            return (
                              <div
                                key={optVal}
                                className="flex items-center gap-2 text-xs"
                              >
                                <input
                                  type="radio"
                                  id={`${q.key}-${optVal}`}
                                  name={q.key}
                                  checked={isChecked}
                                  onClick={() => {
                                    // Clean native single-click toggle
                                    const newVal = isChecked ? null : optVal;
                                    setAnswer(q.key, newVal, sec.defaultDepartment);
                                  }}
                                  onChange={() => {}}
                                  className="accent-[#17324D] cursor-pointer w-4 h-4"
                                />
                                <label
                                  htmlFor={`${q.key}-${optVal}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    const newVal = isChecked ? null : optVal;
                                    setAnswer(q.key, newVal, sec.defaultDepartment);
                                  }}
                                  className={`cursor-pointer select-none ${isChecked ? "font-semibold text-slate-900" : "text-slate-700"}`}
                                >
                                  {optLabel}
                                </label>
                              </div>
                            );
                          })}

                          {/* Typed Input for "Other" */}
                          {isOtherSelected && (
                            <div className="pt-1.5 pl-6">
                              <input
                                type="text"
                                placeholder="Please specify other details... *"
                                value={customOtherText}
                                onChange={(e) => {
                                  const otherText = e.target.value;
                                  setAnswers((prev) => ({
                                    ...prev,
                                    [q.key]: {
                                      value: "Other",
                                      customOther: otherText,
                                      department: sec.defaultDepartment,
                                    },
                                  }));
                                  if (errors[`${q.key}_other`]) {
                                    setErrors((prev) => {
                                      const next = { ...prev };
                                      delete next[`${q.key}_other`];
                                      return next;
                                    });
                                  }
                                }}
                                className={`w-full sm:w-80 text-xs p-1.5 border rounded bg-slate-50 text-slate-900 focus:outline-none ${
                                  errors[`${q.key}_other`] ? "border-red-400" : "border-slate-300 focus:border-[#17324D]"
                                }`}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Checkbox Options */}
                      {q.type === "checkbox" && (
                        <div className="space-y-1.5 pt-0.5">
                          {q.options?.map((opt: any) => {
                            const optVal = typeof opt === "string" ? opt : opt.value;
                            const optLabel = typeof opt === "string" ? opt : opt.label;
                            const selectedList: string[] = Array.isArray(currentVal) ? currentVal : [];
                            const isChecked = selectedList.includes(optVal);

                            return (
                              <div
                                key={optVal}
                                className="flex items-center gap-2 text-xs"
                              >
                                <input
                                  type="checkbox"
                                  id={`${q.key}-${optVal}`}
                                  checked={isChecked}
                                  onChange={() => {
                                    const updated = isChecked
                                      ? selectedList.filter((item) => item !== optVal)
                                      : [...selectedList, optVal];
                                    setAnswer(q.key, updated, sec.defaultDepartment);
                                  }}
                                  className="accent-[#17324D] cursor-pointer w-4 h-4 rounded"
                                />
                                <label
                                  htmlFor={`${q.key}-${optVal}`}
                                  className={`cursor-pointer select-none ${isChecked ? "font-semibold text-slate-900" : "text-slate-700"}`}
                                >
                                  {optLabel}
                                </label>
                              </div>
                            );
                          })}

                          {/* Typed Input for "Other" */}
                          {isOtherSelected && (
                            <div className="pt-1.5 pl-6">
                              <input
                                type="text"
                                placeholder="Please specify other details... *"
                                value={customOtherText}
                                onChange={(e) => {
                                  const otherText = e.target.value;
                                  setAnswers((prev) => ({
                                    ...prev,
                                    [q.key]: {
                                      ...prev[q.key],
                                      customOther: otherText,
                                      department: sec.defaultDepartment,
                                    },
                                  }));
                                  if (errors[`${q.key}_other`]) {
                                    setErrors((prev) => {
                                      const next = { ...prev };
                                      delete next[`${q.key}_other`];
                                      return next;
                                    });
                                  }
                                }}
                                className={`w-full sm:w-80 text-xs p-1.5 border rounded bg-slate-50 text-slate-900 focus:outline-none ${
                                  errors[`${q.key}_other`] ? "border-red-400" : "border-slate-300 focus:border-[#17324D]"
                                }`}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Rating Matrix */}
                      {q.type === "rating_grid" && (
                        <div className="overflow-x-auto border border-slate-200 rounded mt-1.5">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                                <th className="p-2 font-semibold">Business Area</th>
                                {q.gridColumns?.map((col) => (
                                  <th key={col} className="p-2 text-center font-medium text-slate-600">
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {q.gridRows?.map((row) => {
                                const gridVals = (typeof currentVal === "object" && currentVal !== null) ? currentVal : {};
                                const activeRating = gridVals[row];

                                return (
                                  <tr key={row}>
                                    <td className="p-2 text-slate-800">{row}</td>
                                    {q.gridColumns?.map((col, cIdx) => {
                                      const ratingNum = cIdx + 1;
                                      const isSelected = activeRating === ratingNum;

                                      return (
                                        <td key={col} className="p-1.5 text-center">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updated = { ...gridVals };
                                              if (isSelected) {
                                                delete updated[row];
                                              } else {
                                                updated[row] = ratingNum;
                                              }
                                              setAnswer(q.key, updated, sec.defaultDepartment);
                                            }}
                                            className={`w-6 h-6 rounded-full text-xs font-medium transition ${
                                              isSelected
                                                ? "bg-[#C97835] text-white"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            }`}
                                          >
                                            {ratingNum}
                                          </button>
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Error Message */}
                      {errorMsg && (
                        <div className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{errorMsg}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Bottom Actions Bar */}
        <div className="border-t border-slate-300 pt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Click Submit & Download PDF to save your questionnaire to the database, email a copy to A2000, and download your copy.
          </p>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#17324D] hover:bg-[#0f2235] px-4 py-2 rounded transition shadow-sm disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[#C97835]" />
            {isSubmitting ? "Submitting..." : "Submit & Download PDF"}
          </button>
        </div>

      </div>
    </div>
    </SecurityGate>
  );
}
