"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, Loader2, Lock } from "lucide-react";
import BrandLogo from "./BrandLogo";
import { btnPrimary, cardClass, errorTextClass, inputClass, labelClass } from "./ui";

interface SecurityGateProps {
  children: React.ReactNode;
  title?: string;
}

async function unlock(code: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/auth/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    return { ok: res.ok && data.success, error: data.error };
  } catch {
    return { ok: false, error: "We couldn't reach the server. Check your connection and try again." };
  }
}

/** Passkey screen for the open questionnaire pages. The passkey is checked on the server. */
export default function SecurityGate({ children, title = "AI Enablement Questionnaire" }: SecurityGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    (async () => {
      // A link like /hospital?code=XXXX unlocks straight away; the code is then removed from the address bar.
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get("code") || params.get("security_code") || params.get("access") || params.get("passkey");
      try {
        const res = await fetch("/api/auth/access", { cache: "no-store" });
        const data = await res.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
        } else if (urlCode) {
          const r = await unlock(urlCode.trim());
          if (r.ok) setIsAuthenticated(true);
          else setError(r.error || "That passkey isn't recognised.");
        }
      } catch {
        /* show the passkey form */
      }
      if (urlCode) {
        ["code", "security_code", "access", "passkey"].forEach((k) => params.delete(k));
        const qs = params.toString();
        window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash);
      }
      setIsLoading(false);
    })();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputCode.trim();
    if (!clean) {
      setError("Enter the passkey from your A2000 invitation.");
      return;
    }
    setChecking(true);
    const r = await unlock(clean);
    setChecking(false);
    if (r.ok) setIsAuthenticated(true);
    else setError(r.error || "That passkey isn't recognised. Check your invitation and try again.");
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-brand" aria-label="Loading" />
      </div>
    );
  }

  if (isAuthenticated) return <>{children}</>;

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[#f5f7f9] px-4 py-12">
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
          <button type="submit" disabled={checking} className={`${btnPrimary} w-full py-2.5`}>
            {checking && <Loader2 className="h-4 w-4 animate-spin" />}
            Continue
          </button>
        </form>
      </div>
      <p className="mt-6 text-[13px] text-slate-500">Need help? Contact your A2000 engagement team.</p>
    </div>
  );
}
