"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Lock, ShieldCheck, ArrowRight, KeyRound, AlertCircle, Copy, Check } from "lucide-react";

const VALID_CODES = ["A2000", "A2000AI", "A2000-2026", "ENABLE2026", "DISCOVERY"];

interface SecurityGateProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function SecurityGate({
  children,
  title = "AI Opportunity Discovery Questionnaire",
  subtitle = "Confidential Enterprise Assessment • A2000 AI Enablement Service",
}: SecurityGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [inputCode, setInputCode] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Check URL query params for ?code=...
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get("code") || params.get("security_code") || params.get("access");

      if (urlCode && VALID_CODES.includes(urlCode.trim().toUpperCase())) {
        localStorage.setItem("a2000_access_code", urlCode.trim().toUpperCase());
        document.cookie = "a2000_access=granted; path=/; max-age=604800"; // 7 days
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // 2. Check localStorage
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
      setError("Please enter the security access code.");
      return;
    }

    if (VALID_CODES.includes(clean)) {
      if (typeof window !== "undefined") {
        localStorage.setItem("a2000_access_code", clean);
        document.cookie = "a2000_access=granted; path=/; max-age=604800";
      }
      setIsAuthenticated(true);
    } else {
      setError("Invalid security access code. Please check and try again.");
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
          <span>Verifying security credentials...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200/60 p-4">
        <div className="w-full max-w-md bg-white border border-slate-300 rounded-lg shadow-xl overflow-hidden">
          
          {/* Top Banner */}
          <div className="bg-[#17324D] px-6 py-5 text-white flex items-center justify-between border-b-2 border-[#C97835]">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-[#C97835]" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-wide">RESTRICTED ACCESS</h2>
                <p className="text-[11px] text-slate-300">A2000 AI Enablement Service</p>
              </div>
            </div>
            <span className="text-[10px] font-bold tracking-widest uppercase bg-white/15 px-2 py-0.5 rounded text-slate-200">
              CONFIDENTIAL
            </span>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex justify-center">
              <Image
                src="/a2000-logo.png"
                alt="A2000 Logo"
                width={140}
                height={45}
                className="object-contain"
                priority
              />
            </div>

            <div className="text-center space-y-1.5">
              <h1 className="text-base sm:text-lg font-bold text-slate-900">{title}</h1>
              <p className="text-xs text-slate-600 leading-relaxed">{subtitle}</p>
            </div>

            <div className="bg-amber-50/70 border border-amber-200/80 rounded p-3 text-xs text-amber-800 flex items-start gap-2">
              <KeyRound className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                Please enter the security access code provided to your organization to unlock this discovery session.
              </div>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Security Access Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => {
                      setInputCode(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Enter security code (e.g. A2000)"
                    autoFocus
                    className={`w-full text-sm px-3.5 py-2.5 border rounded bg-slate-50 focus:bg-white text-slate-900 font-mono tracking-wider focus:outline-none transition ${
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
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white bg-[#17324D] hover:bg-[#0f2235] px-4 py-2.5 rounded transition shadow-sm"
              >
                <span>Unlock & Continue</span>
                <ArrowRight className="w-4 h-4 text-[#C97835]" />
              </button>
            </form>

            <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                256-Bit Encrypted Form Session
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 hover:underline"
                title="Copy direct share link with embedded code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Link Copied!" : "Copy Access Link"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

