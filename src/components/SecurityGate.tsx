"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Lock, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

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
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get("code") || params.get("security_code") || params.get("access") || params.get("passkey");

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
      setError("Please enter your security passkey.");
      return;
    }

    if (VALID_CODES.includes(clean)) {
      if (typeof window !== "undefined") {
        localStorage.setItem("a2000_access_code", clean);
        document.cookie = "a2000_access=granted; path=/; max-age=604800";
      }
      setIsAuthenticated(true);
    } else {
      setError("Invalid passkey. Please verify your credentials and try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <div className="w-4 h-4 border-2 border-[#17324D] border-t-transparent rounded-full animate-spin"></div>
          <span>Verifying access credentials...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100/80 p-4">
        <div className="w-full max-w-md bg-white border border-slate-300 rounded-lg shadow-lg overflow-hidden transition-all">
          
          {/* Executive Header Banner */}
          <div className="bg-[#17324D] px-6 py-4 text-white flex items-center justify-between border-b-2 border-[#C97835]">
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-200">
              A2000 | AI Enablement
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase bg-white/10 border border-white/20 px-2.5 py-0.5 rounded text-slate-200">
              CONFIDENTIAL
            </span>
          </div>

          <div className="p-7 space-y-6">
            {/* Logo */}
            <div className="flex justify-center">
              <Image
                src="/a2000-logo.png"
                alt="A2000 Logo"
                width={130}
                height={42}
                className="object-contain"
                priority
              />
            </div>

            {/* Title & Subtitle */}
            <div className="text-center space-y-1.5">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
              <p className="text-xs text-slate-500 font-normal leading-relaxed">{subtitle}</p>
            </div>

            {/* Passkey Form */}
            <form onSubmit={handleVerify} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Security Passkey
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={inputCode}
                    onChange={(e) => {
                      setInputCode(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Enter security passkey"
                    autoFocus
                    className={`w-full text-sm px-3.5 py-2.5 border rounded-md bg-white text-slate-900 tracking-wider placeholder:tracking-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#17324D]/20 transition ${
                      error ? "border-red-400 focus:border-red-500" : "border-slate-300 focus:border-[#17324D]"
                    }`}
                  />
                  <div className="absolute right-3 top-3 text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 mt-2 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-white bg-[#17324D] hover:bg-[#0f2235] active:bg-[#0a1826] px-4 py-2.5 rounded-md transition shadow-sm"
              >
                <span>Unlock Assessment</span>
                <ArrowRight className="w-4 h-4 text-[#C97835]" />
              </button>
            </form>

            {/* Enterprise Security Footer */}
            <div className="border-t border-slate-200 pt-4 space-y-1.5 text-center">
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-600 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Authorized Client Discovery Assessment</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Please contact your A2000 engagement team if you require access assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
