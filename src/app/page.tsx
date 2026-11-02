"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { HOSPITAL_QUESTIONNAIRE_SECTIONS } from "@/lib/data/hospital-seed";
import { generateA2000Pdf } from "@/lib/services/pdf";
import {
  Download,
  FileSpreadsheet,
  Check,
} from "lucide-react";

export default function GeneralizedQuestionnairePage() {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("saved");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const caseId = "case-default";

  const loadCaseData = useCallback(async () => {
    try {
      const res = await fetch(`/api/cases?caseId=${caseId}`);
      if (res.ok) {
        const data = await res.json();
        setAnswers(data.answers || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    loadCaseData();
  }, [loadCaseData]);

  const saveAnswer = async (questionKey: string, value: any, dept: string) => {
    setSaveStatus("saving");
    setAnswers((prev) => ({
      ...prev,
      [questionKey]: {
        value,
        department: dept,
        updatedAt: new Date().toISOString(),
      },
    }));

    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          questionKey,
          value,
          department: dept,
        }),
      });
      if (res.ok) {
        setSaveStatus("saved");
      } else {
        setSaveStatus("error");
      }
    } catch (err) {
      console.error("Autosave error:", err);
      setSaveStatus("error");
    }
  };

  const hospitalName = (answers["q1_1_hospital_name"]?.value as string) || "Healthcare Facility";

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Loading questionnaire...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Top Simple Action Bar */}
      <div className="sticky top-4 z-40 bg-white/95 backdrop-blur-xs border border-slate-300 rounded shadow-sm px-4 py-2.5 mb-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-600 font-medium">
            AI Opportunity Discovery Questionnaire
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                saveStatus === "saving"
                  ? "bg-amber-400"
                  : saveStatus === "error"
                  ? "bg-red-500"
                  : "bg-emerald-500"
              }`}
            />
            {saveStatus === "saving" ? "Saving..." : saveStatus === "error" ? "Offline" : "Autosaved"}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/food-and-beverage"
            className="text-xs text-slate-500 hover:text-slate-800 underline px-2 py-1"
          >
            Switch to Food & Beverage Form →
          </Link>

          <a
            href="/api/export/excel?caseId=case-default"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Download Excel (.xlsx)
          </a>

          <button
            onClick={() =>
              generateA2000Pdf({
                caseCode: "A2000-DISCOVERY",
                clientName: hospitalName,
                industry: "Healthcare Provider",
                answers,
                sections: HOSPITAL_QUESTIONNAIRE_SECTIONS.map((s) => ({
                  sectionNumber: s.number,
                  title: s.title,
                  department: s.defaultDepartment,
                  status: "completed",
                })),
              })
            }
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#17324D] hover:bg-[#0f2235] px-3.5 py-1.5 rounded transition"
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
          <div className="mb-3">
            <Image
              src="/a2000-logo.png"
              alt="A2000 Logo"
              width={120}
              height={38}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Hospital AI Opportunity Discovery Questionnaire
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Confidential Operational Assessment • A2000 AI Enablement Service
          </p>
        </div>

        {/* Guidance Box */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 leading-relaxed">
          This questionnaire gathers structured operational data across 12 hospital departments to assess automation and AI opportunities. Different departments can fill their respective sections directly. All entries are autosaved to the central database in real time.
        </div>

        {/* 12 Generalized Sections */}
        <div className="space-y-10">
          {HOSPITAL_QUESTIONNAIRE_SECTIONS.map((sec) => (
            <section
              key={sec.number}
              id={`section-${sec.number}`}
              className="border-t border-slate-200 pt-8 first:border-0 first:pt-0"
            >
              {/* Section Heading */}
              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  {sec.title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Department: <strong>{sec.defaultDepartment}</strong>
                </p>
              </div>

              {/* Questions */}
              <div className="space-y-5">
                {sec.questions.map((q, idx) => {
                  const currentVal = answers[q.key]?.value;

                  return (
                    <div key={q.key} className="space-y-1.5 text-sm">
                      <label className="block font-medium text-slate-800">
                        {idx + 1}. {q.label} {q.required && <span className="text-red-500">*</span>}
                      </label>

                      {/* Text Input */}
                      {q.type === "text" && (
                        <input
                          type="text"
                          value={currentVal || ""}
                          placeholder={q.placeholder}
                          onChange={(e) => saveAnswer(q.key, e.target.value, sec.defaultDepartment)}
                          className="w-full text-sm p-2 border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:border-[#17324D]"
                        />
                      )}

                      {/* Textarea */}
                      {q.type === "textarea" && (
                        <textarea
                          rows={3}
                          value={currentVal || ""}
                          placeholder={q.placeholder}
                          onChange={(e) => saveAnswer(q.key, e.target.value, sec.defaultDepartment)}
                          className="w-full text-sm p-2 border border-slate-300 rounded bg-white text-slate-900 focus:outline-none focus:border-[#17324D]"
                        />
                      )}

                      {/* Radio Selection (Click to toggle / deselect) */}
                      {q.type === "radio" && (
                        <div className="space-y-1.5 pt-0.5">
                          {q.options?.map((opt: any) => {
                            const optVal = typeof opt === "string" ? opt : opt.value;
                            const optLabel = typeof opt === "string" ? opt : opt.label;
                            const isChecked = currentVal === optVal;

                            return (
                              <label
                                key={optVal}
                                onClick={(e) => {
                                  e.preventDefault();
                                  // If already selected, deselect it (set to null)
                                  const newVal = isChecked ? null : optVal;
                                  saveAnswer(q.key, newVal, sec.defaultDepartment);
                                }}
                                className="flex items-center gap-2 text-xs cursor-pointer select-none"
                              >
                                <input
                                  type="radio"
                                  name={q.key}
                                  checked={isChecked}
                                  readOnly
                                  className="accent-[#17324D] cursor-pointer"
                                />
                                <span className={isChecked ? "font-semibold text-slate-900" : "text-slate-700"}>
                                  {optLabel}
                                </span>
                              </label>
                            );
                          })}
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
                              <label
                                key={optVal}
                                className="flex items-center gap-2 text-xs cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    const updated = isChecked
                                      ? selectedList.filter((item) => item !== optVal)
                                      : [...selectedList, optVal];
                                    saveAnswer(q.key, updated, sec.defaultDepartment);
                                  }}
                                  className="accent-[#17324D] rounded"
                                />
                                <span className={isChecked ? "font-semibold text-slate-900" : "text-slate-700"}>
                                  {optLabel}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {/* Rating Matrix */}
                      {q.type === "rating_grid" && (
                        <div className="overflow-x-auto border border-slate-200 rounded mt-1.5">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                                <th className="p-2 font-semibold">Priority Area</th>
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
                                              // If already clicked, clicking again deselects it
                                              const updated = { ...gridVals };
                                              if (isSelected) {
                                                delete updated[row];
                                              } else {
                                                updated[row] = ratingNum;
                                              }
                                              saveAnswer(q.key, updated, sec.defaultDepartment);
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
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Bottom Save & Download Bar */}
        <div className="border-t border-slate-300 pt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Answers autosave in real time. Different departments can access and add their details without losing earlier data.</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/export/excel?caseId=case-default"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 px-3 py-2 rounded transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Download Excel (.xlsx)
            </a>

            <button
              onClick={() =>
                generateA2000Pdf({
                  caseCode: "A2000-DISCOVERY",
                  clientName: hospitalName,
                  industry: "Healthcare Provider",
                  answers,
                  sections: HOSPITAL_QUESTIONNAIRE_SECTIONS.map((s) => ({
                    sectionNumber: s.number,
                    title: s.title,
                    department: s.defaultDepartment,
                    status: "completed",
                  })),
                })
              }
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#17324D] hover:bg-[#0f2235] px-4 py-2 rounded transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-[#C97835]" />
              Download PDF
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
