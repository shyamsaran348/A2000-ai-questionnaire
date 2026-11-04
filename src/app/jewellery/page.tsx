"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { JEWELLERY_QUESTIONNAIRE_SECTIONS } from "@/lib/data/jewellery-seed";
import { generateA2000Pdf } from "@/lib/services/pdf";
import SecurityGate from "@/components/SecurityGate";
import {
  Download,
  RefreshCw,
  Gem,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";

export default function JewelleryQuestionnairePage() {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const isInitialMount = useRef(true);

  // 1. Restore from localStorage on initial load
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem("a2000_draft_jewellery");
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
        localStorage.setItem("a2000_draft_jewellery", JSON.stringify(answers));
        const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setLastSaved(now);

        fetch("/api/questionnaire/autosave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseCode: "A2000-JW",
            industry: "Jewellery Industry",
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

    JEWELLERY_QUESTIONNAIRE_SECTIONS.forEach((sec) => {
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
      alert("Please correct the highlighted fields before downloading the PDF.");
      return;
    }

    const companyName = (answers["jw_q1_company_name"]?.value as string) || "Jewellery Company";

    generateA2000Pdf({
      caseCode: "A2000-JW",
      clientName: companyName,
      industry: "Jewellery Industry",
      answers,
      sections: JEWELLERY_QUESTIONNAIRE_SECTIONS,
    });

    try {
      await fetch("/api/questionnaire/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: "Jewellery Industry",
          caseCode: "A2000-JW",
          clientName: companyName,
          email: answers["jw_q1_email"]?.value || "",
          phone: answers["jw_q1_phone"]?.value || "",
          contactPerson: answers["jw_q1_contact_person"]?.value || "",
          answers,
          submittedAt: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.warn("Server backup error:", e);
    }
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear all filled answers? This will also remove the saved draft.")) {
      setAnswers({});
      setErrors({});
      localStorage.removeItem("a2000_draft_jewellery");
      setLastSaved(null);
    }
  };

  return (
    <SecurityGate
      title="Jewellery Industry AI Discovery Questionnaire"
      subtitle="Manufacturing, Retail, Diamond Trading & Bullion Operational Assessment"
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
              <span>All Industries</span>
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-800 font-semibold flex items-center gap-1.5">
              <Gem className="w-4 h-4 text-[#C97835]" />
              Jewellery Industry AI Discovery
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
                  <span>Saved {lastSaved}</span>
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
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#17324D] hover:bg-[#0f2235] px-3.5 py-1.5 rounded transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-[#C97835]" />
              Download PDF
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Jewellery Industry Discovery Questionnaire
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Your answers will help A2000 understand your company&apos;s business operations, existing technology, departmental activities and challenges to identify potential opportunities for AI adoption and business process improvement.
          </p>
        </div>

        {/* Guidance Box */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 leading-relaxed">
          Please fill in the form below. Once completed, click <strong>Download PDF</strong> at the top or bottom of the page to save a copy to your device and email it to the A2000 team.
        </div>

        {/* 12 Sections */}
        <div className="space-y-10">
          {JEWELLERY_QUESTIONNAIRE_SECTIONS.map((sec) => (
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

                      {/* Radio Selection (Click to toggle/deselect) */}
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
            Click Download PDF to save your completed responses as a PDF file.
          </p>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#17324D] hover:bg-[#0f2235] px-4 py-2 rounded transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-[#C97835]" />
            Download PDF
          </button>
        </div>

      </div>
    </div>
    </SecurityGate>
  );
}

