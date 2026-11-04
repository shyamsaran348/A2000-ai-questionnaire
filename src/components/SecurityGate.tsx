"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Lock, ArrowRight, KeyRound, AlertCircle, Copy, Check } from "lucide-react";

const VALID_CODES = ["A2000", "A2000AI", "A2000-2026", "ENABLE2026", "DISCOVERY"];

interface SecurityGateProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function SecurityGate({
  children,
  title = "AI Enablement Questionnaire",
  subtitle = "A2000 | AI Enablement",
}: SecurityGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [inputCode, setInputCode] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get("code") || params.get("security_code") || params.get("access");

      if (urlCode && VALID_CODES.includes(urlCode.trim().toUpperCase())) {
        localStorage.setItem("a2000_access_code", urlCode.trim().toUpperCase());
        document.cookie = "a2000_access=granted; path=/; max-age=604800";
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      const savedCode = localStorage.getItem("a2000_access_code");
      if (savedCode && VALID_CODES.includes(savedCode.trim().toUpperCase())) {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    }
  }, []);

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");

    const clean = inputCode.trim().toUpperCase();
    if (!clean) {
      setError("Please enter the access code.");
      return;
    }

    if (VALID_CODES.includes(clean)) {
      if (typeof window !== "undefined") {
        localStorage.setItem("a2000_access_code", clean);
        document.cookie = "a2000_access=granted; path=/; max-age=604800";
      }
      setIsAuthenticated(true);
    } else {
      setError("Invalid access code. Please try again.");
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("code", "A2000");
      navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100/70">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="w-4 h-4 border-2 border-[#17324D] border-t-transparent rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100/80 p-4">
        <div className="w-full max-w-sm bg-white border border-slate-300 rounded shadow-md overflow-hidden">
          
          <div className="bg-[#17324D] px-5 py-3.5 text-white flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase">
              A2000 | AI Enablement
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase bg-white/15 px-2 py-0.5 rounded text-slate-200">
              CONFIDENTIAL
            </span>
          </div>

          <div className="p-6 space-y-5">
            <div className="flex justify-center">
              <Image
                src="/a2000-logo.png"
                alt="A2000 Logo"
                width={120}
                height={38}
                className="object-contain"
                priority
              />
            </div>

            <div className="text-center space-y-1">
              <h1 className="text-base font-bold text-slate-900">{title}</h1>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>

            <form onSubmit={handleVerify} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Access Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => {
                      setInputCode(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Enter code (e.g. A2000)"
                    autoFocus
                    className={`w-full text-sm px-3 py-2 border rounded bg-white text-slate-900 font-mono focus:outline-none transition ${
                      error ? "border-red-400 focus:border-red-500" : "border-slate-300 focus:border-[#17324D]"
                    }`}
                  />
                  <div className="absolute right-2.5 top-2.5 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-[#17324D] hover:bg-[#0f2235] px-4 py-2 rounded transition shadow-xs"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C97835]" />
              </button>
            </form>

            <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[11px] text-slate-500">
              <span>Code: <strong>A2000</strong></span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 hover:underline"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Link Copied" : "Copy Direct Link"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
