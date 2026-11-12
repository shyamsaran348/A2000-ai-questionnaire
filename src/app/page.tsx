"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Plus,
  Printer,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { INDUSTRIES, getIndustry } from "@/lib/data/industries";
import {
  normalizeEmailList,
  normalizePhone,
  normalizeWebsite,
  sanitizePhoneInput,
  validateCustomer,
  validateCustomerField,
  type CustomerErrors,
  type CustomerInput,
} from "@/lib/validation";
import {
  btnGhost,
  btnPrimary,
  btnSecondary,
  cardClass,
  errorTextClass,
  hintClass,
  inputClass,
  labelClass,
} from "@/components/ui";

interface Customer {
  id: string;
  company_name: string;
  website?: string;
  industry: string;
  contact_name: string;
  email: string;
  phone?: string;
  staff_emails?: string;
  access_code: string;
  status: "created" | "in_progress" | "submitted";
  invitation_sent: boolean;
  invitation_sent_at?: string;
  last_active_at?: string;
  submitted_at?: string;
  created_at: string;
}

type StatusFilter = "all" | Customer["status"];

// Per-tab cache so a reload shows the list instantly (cleared when the tab closes).
const CUSTOMERS_CACHE_KEY = "a2000_customers_cache";

const EMPTY_FORM: CustomerInput = {
  companyName: "",
  website: "",
  industry: "hospital",
  contactName: "",
  email: "",
  phone: "",
  staffEmails: "",
  customCode: "",
};

const STATUS_META: Record<Customer["status"], { label: string; className: string }> = {
  created: { label: "Not started", className: "bg-slate-100 text-slate-700 ring-slate-200" },
  in_progress: { label: "In progress", className: "bg-gold-50 text-gold ring-gold-200" },
  submitted: { label: "Submitted", className: "bg-leaf-50 text-leaf ring-leaf-200" },
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function InternalDashboard() {
  // Auth
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");

  // View
  const [view, setView] = useState<"directory" | "create">("directory");

  // Directory
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  // Create form
  const [form, setForm] = useState<CustomerInput>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<CustomerErrors>({});
  const [sendEmail, setSendEmail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<any | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  // Printable blank form
  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("a2000_staff_auth") === "true") setIsAuthenticated(true);
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    // Show the last list immediately on reload, then refresh it from the server.
    try {
      const cached = sessionStorage.getItem(CUSTOMERS_CACHE_KEY);
      if (cached) setCustomers(JSON.parse(cached));
    } catch {
      /* ignore unreadable cache */
    }
    loadCustomers();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  async function loadCustomers() {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/customers", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load customers");
      setCustomers(data.customers ?? []);
      try {
        sessionStorage.setItem(CUSTOMERS_CACHE_KEY, JSON.stringify(data.customers ?? []));
      } catch {
        /* storage unavailable — the cache is only a speed-up */
      }
    } catch (err: any) {
      setLoadError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setAuthError("Enter your staff passkey.");
    } else if (passcode.trim().toUpperCase() === "A2000") {
      setIsAuthenticated(true);
      sessionStorage.setItem("a2000_staff_auth", "true");
      setAuthError("");
    } else {
      setAuthError("Incorrect passkey.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("a2000_staff_auth");
    sessionStorage.removeItem(CUSTOMERS_CACHE_KEY);
    setIsAuthenticated(false);
    setPasscode("");
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setCreateSuccess(null);
    setCreateError(null);
    setView("create");
  };

  const backToDirectory = () => {
    setCreateSuccess(null);
    setCreateError(null);
    setView("directory");
  };

  // --- Form helpers --------------------------------------------------------

  const updateField = (field: keyof CustomerInput, value: string) => {
    let v = value;
    if (field === "phone") v = sanitizePhoneInput(v);
    if (field === "customCode") v = v.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20);
    setForm((f) => ({ ...f, [field]: v }));
    if (formErrors[field]) setFormErrors((e) => ({ ...e, [field]: undefined }));
  };

  const blurField = (field: keyof CustomerInput) => {
    const value = form[field];
    // Only flag empty required fields after submit, not on first blur.
    if (!value.trim() && field !== "industry") return;
    const err = validateCustomerField(field, value);
    setFormErrors((e) => ({ ...e, [field]: err ?? undefined }));
    if (!err) {
      if (field === "phone") setForm((f) => ({ ...f, phone: normalizePhone(f.phone) }));
      if (field === "website") setForm((f) => ({ ...f, website: normalizeWebsite(f.website) }));
      if (field === "email") setForm((f) => ({ ...f, email: f.email.trim() }));
      if (field === "staffEmails") setForm((f) => ({ ...f, staffEmails: normalizeEmailList(f.staffEmails) }));
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    const errors = validateCustomer(form);
    setFormErrors(errors);
    const firstInvalid = (Object.keys(EMPTY_FORM) as (keyof CustomerInput)[]).find((k) => errors[k]);
    if (firstInvalid) {
      document.getElementById(`cf-${firstInvalid}`)?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          companyName: form.companyName.trim(),
          contactName: form.contactName.trim(),
          email: form.email.trim(),
          phone: normalizePhone(form.phone),
          website: normalizeWebsite(form.website),
          staffEmails: normalizeEmailList(form.staffEmails),
          sendEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.fieldErrors) setFormErrors(data.fieldErrors);
        throw new Error(data.error || "Failed to create customer");
      }
      setCreateSuccess(data.customer);
      setForm(EMPTY_FORM);
      setFormErrors({});
      loadCustomers();
    } catch (err: any) {
      setCreateError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Directory helpers ---------------------------------------------------

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
    } catch {
      setNotice({ kind: "error", text: "Couldn't access the clipboard. Copy the value manually." });
    }
  };

  const handleResendInvite = async (c: Customer) => {
    setResendingId(c.id);
    try {
      const res = await fetch(`/api/customers/${c.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend_invite" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Email could not be sent");
      setNotice({ kind: "success", text: `Invitation sent to ${c.email}.` });
      loadCustomers();
    } catch (e: any) {
      setNotice({ kind: "error", text: e.message });
    } finally {
      setResendingId(null);
    }
  };

  const counts = useMemo(() => {
    const c = { all: customers.length, created: 0, in_progress: 0, submitted: 0 };
    customers.forEach((x) => c[x.status]++);
    return c;
  }, [customers]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return customers.filter(
      (c) =>
        (industryFilter === "all" || c.industry === industryFilter) &&
        (statusFilter === "all" || c.status === statusFilter) &&
        (!s ||
          [c.company_name, c.contact_name, c.email, c.access_code, c.phone ?? "", c.staff_emails ?? ""].some((v) =>
            v.toLowerCase().includes(s)
          ))
    );
  }, [customers, search, industryFilter, statusFilter]);

  const portalUrlFor = (id: string) =>
    typeof window !== "undefined" ? `${window.location.origin}/portal/${id}` : `/portal/${id}`;

  // =========================================================================
  // Staff sign-in
  // =========================================================================
  if (!authChecked) return null;

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f7f9] px-4 py-12">
        <BrandLogo height={52} className="mb-8" />
        <div className={`${cardClass} w-full max-w-sm p-7`}>
          <h1 className="text-xl font-semibold text-navy">Staff sign in</h1>
          <p className="mt-1 text-[15px] text-slate-600">AI Enablement · Client assessments</p>

          <form onSubmit={handleStaffLogin} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="staff-passkey" className={labelClass}>
                Passkey
              </label>
              <div className="relative mt-1.5">
                <input
                  id="staff-passkey"
                  type="password"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    if (authError) setAuthError("");
                  }}
                  aria-invalid={!!authError}
                  className={inputClass(!!authError, "pr-10")}
                  autoFocus
                />
                <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
              {authError && (
                <p role="alert" className={errorTextClass}>
                  <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
                  {authError}
                </p>
              )}
            </div>
            <button type="submit" className={`${btnPrimary} w-full py-2.5`}>
              Sign in
            </button>
          </form>
        </div>
        <p className="mt-6 text-[13px] text-slate-500">For authorised A2000 staff only.</p>
      </div>
    );
  }

  // =========================================================================
  // App shell
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#f5f7f9]">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <BrandLogo height={36} />
            <span className="hidden h-7 w-px bg-slate-200 sm:block" />
            <span className="hidden text-[15px] font-medium text-slate-700 sm:block">AI Enablement · Client Assessments</span>
          </div>
          <button type="button" onClick={handleLogout} className={btnGhost}>
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {notice && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm" role="status">
          <div
            className={`flex items-start gap-3 rounded-md border bg-white px-4 py-3 text-sm shadow-lg ${
              notice.kind === "success" ? "border-leaf-200" : "border-red-200"
            }`}
          >
            {notice.kind === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-leaf" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            )}
            <span className="text-slate-800">{notice.text}</span>
            <button onClick={() => setNotice(null)} className="ml-2 text-slate-400 hover:text-slate-700" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {printOpen && (
        <PrintableFormDialog
          onClose={() => setPrintOpen(false)}
          onDone={(name) => setNotice({ kind: "success", text: `${name} downloaded.` })}
          onError={(msg) => setNotice({ kind: "error", text: msg })}
        />
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {view === "create" ? (
          // ===================================================================
          // Create customer
          // ===================================================================
          <div className="mx-auto max-w-3xl">
            <button type="button" onClick={backToDirectory} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-navy">
              <ArrowLeft className="h-4 w-4" />
              All customers
            </button>
            <h1 className="text-2xl font-semibold text-navy">Create customer</h1>
            <p className="mt-1 text-[15px] text-slate-600">
              Set up a private assessment link and passcode for a client organisation.
            </p>

            {createSuccess && (
              <div className={`${cardClass} mt-6 border-leaf-200 p-6`}>
                <div className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
                  <CheckCircle2 className="h-5 w-5 text-leaf" />
                  {createSuccess.companyName} is ready
                </div>
                <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-[140px_1fr]">
                  <dt className="text-slate-500">Questionnaire</dt>
                  <dd className="text-slate-900">{getIndustry(createSuccess.industry).name}</dd>
                  <dt className="text-slate-500">Passcode</dt>
                  <dd className="flex items-center gap-2">
                    <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[14px] font-semibold text-navy">
                      {createSuccess.accessCode}
                    </code>
                    <CopyButton copied={copiedId === "new-code"} onClick={() => copyToClipboard(createSuccess.accessCode, "new-code")} />
                  </dd>
                  <dt className="text-slate-500">Portal link</dt>
                  <dd className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-mono text-[13px] text-slate-700">{createSuccess.portalUrl}</span>
                    <CopyButton copied={copiedId === "new-url"} onClick={() => copyToClipboard(createSuccess.portalUrl, "new-url")} />
                  </dd>
                </dl>
                <p className="mt-4 text-sm text-slate-600">
                  {createSuccess.emailSent
                    ? `Invitation with link and passcode emailed to ${createSuccess.email}${
                        createSuccess.staffEmails ? `, with ${createSuccess.staffEmails} in copy` : ""
                      }.`
                    : createSuccess.emailError
                      ? `The invitation email could not be sent (${createSuccess.emailError}). Share the link and passcode manually.`
                      : "No invitation email was sent. Share the link and passcode with the client."}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button type="button" onClick={backToDirectory} className={btnSecondary}>
                    View all customers
                  </button>
                  <button type="button" onClick={openCreate} className={btnGhost}>
                    Create another
                  </button>
                </div>
              </div>
            )}

            {!createSuccess && (
              <form onSubmit={handleCreateCustomer} noValidate className={`${cardClass} mt-6 divide-y divide-slate-200`}>
                {createError && (
                  <div role="alert" className="flex items-start gap-2.5 bg-red-50 px-6 py-3 text-sm text-red-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                    {createError}
                  </div>
                )}

                <FormSection title="Questionnaire" description="Which industry assessment should this client complete?">
                  <div role="radiogroup" aria-label="Industry questionnaire" className="grid gap-3 sm:grid-cols-2">
                    {INDUSTRIES.map((ind) => {
                      const Icon = ind.icon;
                      const selected = form.industry === ind.id;
                      return (
                        <label
                          key={ind.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors ${
                            selected ? "border-brand bg-brand-50 ring-1 ring-brand" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="industry"
                            value={ind.id}
                            checked={selected}
                            onChange={() => updateField("industry", ind.id)}
                            className="sr-only"
                          />
                          <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${selected ? "text-brand" : "text-slate-400"}`} />
                          <span>
                            <span className="block text-[15px] font-medium text-slate-900">{ind.name}</span>
                            <span className="mt-0.5 block text-[13px] text-slate-500">{ind.description}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <FieldError message={formErrors.industry} />
                </FormSection>

                <FormSection title="Organisation">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field id="companyName" label="Company name" required error={formErrors.companyName}>
                      <input
                        id="cf-companyName"
                        type="text"
                        autoComplete="organization"
                        maxLength={120}
                        value={form.companyName}
                        onChange={(e) => updateField("companyName", e.target.value)}
                        onBlur={() => blurField("companyName")}
                        aria-invalid={!!formErrors.companyName}
                        className={inputClass(!!formErrors.companyName)}
                      />
                    </Field>
                    <Field id="website" label="Website" error={formErrors.website} hint="e.g. company.com">
                      <input
                        id="cf-website"
                        type="url"
                        inputMode="url"
                        autoComplete="url"
                        value={form.website}
                        onChange={(e) => updateField("website", e.target.value)}
                        onBlur={() => blurField("website")}
                        aria-invalid={!!formErrors.website}
                        className={inputClass(!!formErrors.website)}
                      />
                    </Field>
                  </div>
                </FormSection>

                <FormSection title="Primary contact" description="The person who will receive the invitation and complete the assessment.">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field id="contactName" label="Full name" required error={formErrors.contactName}>
                      <input
                        id="cf-contactName"
                        type="text"
                        autoComplete="name"
                        maxLength={100}
                        value={form.contactName}
                        onChange={(e) => updateField("contactName", e.target.value)}
                        onBlur={() => blurField("contactName")}
                        aria-invalid={!!formErrors.contactName}
                        className={inputClass(!!formErrors.contactName)}
                      />
                    </Field>
                    <Field id="email" label="Work email" required error={formErrors.email}>
                      <input
                        id="cf-email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        onBlur={() => blurField("email")}
                        aria-invalid={!!formErrors.email}
                        className={inputClass(!!formErrors.email)}
                      />
                    </Field>
                    <Field
                      id="phone"
                      label="Mobile number"
                      error={formErrors.phone}
                      hint="10-digit Indian number, or +country code for international"
                    >
                      <input
                        id="cf-phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        maxLength={20}
                        placeholder="98765 43210"
                        value={form.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        onBlur={() => blurField("phone")}
                        aria-invalid={!!formErrors.phone}
                        className={inputClass(!!formErrors.phone)}
                      />
                    </Field>
                  </div>
                </FormSection>

                <FormSection
                  title="A2000 team"
                  description="Staff who should receive a copy of the invitation and any reminders."
                >
                  <Field
                    id="staffEmails"
                    label="Staff email addresses"
                    error={formErrors.staffEmails}
                    hint="Separate multiple addresses with commas. The A2000 team inbox is always copied."
                  >
                    <input
                      id="cf-staffEmails"
                      type="text"
                      inputMode="email"
                      autoComplete="off"
                      placeholder="name@a2000india.com"
                      value={form.staffEmails}
                      onChange={(e) => updateField("staffEmails", e.target.value)}
                      onBlur={() => blurField("staffEmails")}
                      aria-invalid={!!formErrors.staffEmails}
                      className={inputClass(!!formErrors.staffEmails)}
                    />
                  </Field>
                </FormSection>

                <FormSection title="Access">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field
                      id="customCode"
                      label="Passcode"
                      error={formErrors.customCode}
                      hint="Leave blank to generate one automatically"
                    >
                      <input
                        id="cf-customCode"
                        type="text"
                        autoComplete="off"
                        placeholder="Auto-generated"
                        value={form.customCode}
                        onChange={(e) => updateField("customCode", e.target.value)}
                        onBlur={() => blurField("customCode")}
                        aria-invalid={!!formErrors.customCode}
                        className={inputClass(!!formErrors.customCode, "font-mono")}
                      />
                    </Field>
                    <label className="flex cursor-pointer items-start gap-3 self-center pt-2 sm:pt-6">
                      <input
                        type="checkbox"
                        checked={sendEmail}
                        onChange={(e) => setSendEmail(e.target.checked)}
                        className="mt-0.5 h-4 w-4"
                      />
                      <span className="text-[15px] text-slate-800">
                        Email the link and passcode to the contact
                      </span>
                    </label>
                  </div>
                </FormSection>

                <div className="flex justify-end gap-2 bg-slate-50 px-6 py-4">
                  <button type="button" onClick={backToDirectory} className={btnGhost}>
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className={btnPrimary}>
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isSubmitting ? "Creating…" : "Create customer"}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          // ===================================================================
          // Directory
          // ===================================================================
          <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-navy">Customers</h1>
                <p className="mt-1 text-[15px] text-slate-600">Track each client&apos;s assessment from invitation to submission.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setPrintOpen(true)} className={btnSecondary}>
                  <Printer className="h-4 w-4" />
                  Printable form
                </button>
                <button type="button" onClick={openCreate} className={btnPrimary}>
                  <Plus className="h-4 w-4" />
                  Create customer
                </button>
              </div>
            </div>

            {/* Status tabs */}
            <div className="mt-6 flex gap-6 overflow-x-auto border-b border-slate-200">
              {(
                [
                  ["all", "All"],
                  ["created", "Not started"],
                  ["in_progress", "In progress"],
                  ["submitted", "Submitted"],
                ] as [StatusFilter, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`-mb-px whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors ${
                    statusFilter === key
                      ? "border-brand text-navy"
                      : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                  }`}
                >
                  {label}
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                      statusFilter === key ? "bg-brand-50 text-brand" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {counts[key]}
                  </span>
                </button>
              ))}
            </div>

            {/* Toolbar */}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search company, contact, email, phone or passcode"
                  aria-label="Search customers"
                  className={inputClass(false, "pl-9")}
                />
              </div>
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                aria-label="Filter by industry"
                className={inputClass(false, "sm:w-56")}
              >
                <option value="all">All industries</option>
                {INDUSTRIES.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
              <button type="button" onClick={loadCustomers} className={btnSecondary} aria-label="Refresh">
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                <span className="sm:hidden lg:inline">Refresh</span>
              </button>
            </div>

            {/* Table */}
            <div className={`${cardClass} mt-4 overflow-hidden`}>
              {loadError ? (
                <div className="px-6 py-14 text-center">
                  <AlertCircle className="mx-auto h-6 w-6 text-red-600" />
                  <p className="mt-2 text-[15px] font-medium text-slate-900">Couldn&apos;t load customers</p>
                  <p className="mt-1 text-sm text-slate-500">{loadError}</p>
                  <button type="button" onClick={loadCustomers} className={`${btnSecondary} mt-4`}>
                    Try again
                  </button>
                </div>
              ) : isLoading && customers.length === 0 ? (
                <div className="flex justify-center px-6 py-16">
                  <Loader2 className="h-5 w-5 animate-spin text-brand" aria-label="Loading" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <p className="text-[15px] font-medium text-slate-900">
                    {customers.length === 0 ? "No customers yet" : "No customers match your filters"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {customers.length === 0
                      ? "Create a customer to generate their private assessment link."
                      : "Try a different search term, status or industry."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-[13px] text-slate-600">
                      <tr>
                        <th className="px-5 py-3 font-medium">Client</th>
                        <th className="px-5 py-3 font-medium">Industry</th>
                        <th className="px-5 py-3 font-medium">Passcode</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium">Last activity</th>
                        <th className="px-5 py-3 text-right font-medium">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map((c) => {
                        const status = STATUS_META[c.status] ?? STATUS_META.created;
                        const url = portalUrlFor(c.id);
                        const activity =
                          c.status === "submitted"
                            ? `Submitted ${formatDate(c.submitted_at)}`
                            : c.last_active_at
                              ? `Active ${formatDate(c.last_active_at)}`
                              : `Created ${formatDate(c.created_at)}`;
                        return (
                          <tr key={c.id} className="align-top hover:bg-slate-50/70">
                            <td className="px-5 py-4">
                              <div className="font-semibold text-slate-900">{c.company_name}</div>
                              <div className="mt-0.5 text-[13px] text-slate-600">{c.contact_name}</div>
                              <div className="text-[13px] text-slate-500">
                                {c.email}
                                {c.phone ? ` · ${c.phone}` : ""}
                              </div>
                              {c.staff_emails && (
                                <div className="mt-1 text-[12px] text-slate-500">
                                  <span className="font-medium text-slate-600">A2000 cc:</span> {c.staff_emails}
                                </div>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 text-slate-700">{getIndustry(c.industry).shortName}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5">
                                <code className="font-mono text-[13px] font-semibold text-navy">{c.access_code}</code>
                                <CopyButton copied={copiedId === `code-${c.id}`} onClick={() => copyToClipboard(c.access_code, `code-${c.id}`)} label="Copy passcode" />
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${status.className}`}>
                                {status.label}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 text-[13px] text-slate-600">{activity}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-1">
                                <IconAction
                                  label={copiedId === `url-${c.id}` ? "Link copied" : "Copy portal link"}
                                  onClick={() => copyToClipboard(url, `url-${c.id}`)}
                                >
                                  {copiedId === `url-${c.id}` ? <Check className="h-4 w-4 text-leaf" /> : <Copy className="h-4 w-4" />}
                                </IconAction>
                                <IconAction
                                  label="Email invitation"
                                  onClick={() => handleResendInvite(c)}
                                  disabled={resendingId === c.id}
                                >
                                  {resendingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                                </IconAction>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="ml-1 inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
                                >
                                  Open
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Printable blank questionnaire
// ---------------------------------------------------------------------------

function PrintableFormDialog({
  onClose,
  onDone,
  onError,
}: {
  onClose: () => void;
  onDone: (filename: string) => void;
  onError: (message: string) => void;
}) {
  const [industryId, setIndustryId] = useState<string>(INDUSTRIES[0].id);
  const [organisation, setOrganisation] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const download = async () => {
    setBusy(true);
    try {
      // Loaded on demand so the PDF library isn't part of the dashboard's initial load.
      const { generateBlankQuestionnairePdf } = await import("@/lib/services/blank-pdf");
      const ind = getIndustry(industryId);
      const { doc, filename } = generateBlankQuestionnairePdf({
        industryTitle: ind.assessmentTitle,
        caseCode: ind.caseCode,
        sections: ind.sections,
        preparedFor: organisation.trim() || undefined,
      });
      doc.save(filename);
      onDone(filename);
      onClose();
    } catch (e: any) {
      onError(`Could not create the PDF: ${e?.message ?? "unknown error"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-title"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`${cardClass} w-full max-w-xl shadow-xl`}>
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 id="print-title" className="text-lg font-semibold text-navy">
              Printable questionnaire
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Download a blank PDF that clients can print and complete by hand.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div>
            <p className={labelClass}>Industry</p>
            <div role="radiogroup" aria-label="Industry" className="mt-2 grid gap-2 sm:grid-cols-2">
              {INDUSTRIES.map((ind) => {
                const Icon = ind.icon;
                const selected = industryId === ind.id;
                return (
                  <label
                    key={ind.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-3 transition-colors ${
                      selected ? "border-brand bg-brand-50 ring-1 ring-brand" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="print-industry"
                      checked={selected}
                      onChange={() => setIndustryId(ind.id)}
                      className="sr-only"
                    />
                    <Icon className={`h-5 w-5 shrink-0 ${selected ? "text-brand" : "text-slate-400"}`} />
                    <span className="text-[15px] font-medium text-slate-900">{ind.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="print-org" className={labelClass}>
              Organisation name <span className="ml-1 font-normal text-slate-400">Optional</span>
            </label>
            <input
              id="print-org"
              type="text"
              maxLength={120}
              value={organisation}
              onChange={(e) => setOrganisation(e.target.value)}
              className={`${inputClass(false)} mt-1.5`}
            />
            <p className={hintClass}>Printed on the cover page. Leave blank for a fully blank form.</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 rounded-b-lg border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button type="button" onClick={onClose} className={btnGhost}>
            Cancel
          </button>
          <button type="button" onClick={download} disabled={busy} className={btnPrimary}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {busy ? "Preparing…" : "Download PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="px-6 py-6">
      <h2 className="text-[15px] font-semibold text-navy">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={`cf-${id}`} className={labelClass}>
        {label}
        {required ? <span className="ml-0.5 text-red-600">*</span> : <span className="ml-1.5 font-normal text-slate-400">Optional</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? <FieldError message={error} /> : hint ? <p className={hintClass}>{hint}</p> : null}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className={errorTextClass}>
      <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}

function CopyButton({ copied, onClick, label = "Copy" }: { copied: boolean; onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} title={label} aria-label={label} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
      {copied ? <Check className="h-3.5 w-3.5 text-leaf" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function IconAction({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
    >
      {children}
    </button>
  );
}
