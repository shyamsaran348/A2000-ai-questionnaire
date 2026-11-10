"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, Loader2, Lock } from "lucide-react";
import BrandLogo from "./BrandLogo";
import { btnPrimary, cardClass, errorTextClass, inputClass, labelClass } from "./ui";

const VALID_CODES = ["A2000", "A2000AI", "A2000-2026", "ENABLE2026", "DISCOVERY"];

interface SecurityGateProps {
  children: React.ReactNode;
  title?: string;
}

export default function SecurityGate({ children, title = "AI Enablement Questionnaire" }: SecurityGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get("code") || params.get("security_code") || params.get("access") || params.get("passkey");

    if (urlCode && VALID_CODES.includes(urlCode.trim().toUpperCase())) {
      localStorage.setItem("a2000_access_code", urlCode.trim().toUpperCase());
      document.cookie = "a2000_access=granted; path=/; max-age=604800";
      setIsAuthenticated(true);
    } else {
      const savedCode = localStorage.getItem("a2000_access_code");
      if (savedCode && VALID_CODES.includes(savedCode.trim().toUpperCase())) setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputCode.trim().toUpperCase();
    if (!clean) {
      setError("Enter the passkey from your A2000 invitation.");
      return;
    }
    if (VALID_CODES.includes(clean)) {
      localStorage.setItem("a2000_access_code", clean);
      document.cookie = "a2000_access=granted; path=/; max-age=604800";
      setIsAuthenticated(true);
    } else {
      setError("That passkey isn't recognised. Check your invitation and try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-brand" aria-label="Loading" />
      </div>
    );
  }

  if (isAuthenticated) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f7f9] px-4 py-12">
      <BrandLogo height={48} className="mb-8" />
      <div className={`${cardClass} w-full max-w-sm p-7`}>
        <h1 className="text-xl font-semibold text-navy">{title}</h1>
        <p className="mt-1 text-[15px] text-slate-600">Enter your passkey to begin.</p>

        <form onSubmit={handleVerify} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="gate-passkey" className={labelClass}>
              Passkey
            </label>
            <div className="relative mt-1.5">
              <input
                id="gate-passkey"
                type="password"
                autoComplete="off"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  if (error) setError("");
                }}
                autoFocus
                aria-invalid={!!error}
                className={inputClass(!!error, "pr-10")}
              />
              <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
            {error && (
              <p role="alert" className={errorTextClass}>
                <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}
          </div>
          <button type="submit" className={`${btnPrimary} w-full py-2.5`}>
            Continue
          </button>
        </form>
      </div>
      <p className="mt-6 text-[13px] text-slate-500">Need help? Contact your A2000 engagement team.</p>
    </div>
  );
}
