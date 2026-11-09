"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Building2,
  Landmark,
  UtensilsCrossed,
  Gem,
  Copy,
  Check,
  Send,
  ExternalLink,
  Search,
  Filter,
  ShieldCheck,
  Clock,
  CheckCircle2,
  FileText,
  AlertCircle,
  RefreshCw,
  LogOut,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface Customer {
  id: string;
  company_name: string;
  website?: string;
  industry: string;
  contact_name: string;
  email: string;
  phone?: string;
  access_code: string;
  status: "created" | "in_progress" | "submitted";
  invitation_sent: boolean;
  invitation_sent_at?: string;
  last_active_at?: string;
  submitted_at?: string;
  created_at: string;
  answered_questions_count?: number;
}

const INDUSTRY_OPTIONS = [
  {
    id: "hospital",
    name: "Hospital & Healthcare",
    icon: Building2,
    color: "#2563eb",
    bgColor: "bg-blue-50 text-blue-700 border-blue-200",
    description: "Multi-specialty tertiary care, hospital networks, clinics",
  },
  {
    id: "finance",
    name: "Finance & FinTech",
    icon: Landmark,
    color: "#059669",
    bgColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "NBFCs, digital lending, payments, wealth management",
  },
  {
    id: "food-and-beverage",
    name: "Food & Beverage",
    icon: UtensilsCrossed,
    color: "#d97706",
    bgColor: "bg-amber-50 text-amber-700 border-amber-200",
    description: "Packaged foods, FMCG manufacturing, beverage bottling",
  },
  {
    id: "jewellery",
    name: "Jewellery & Retail",
    icon: Gem,
    color: "#9333ea",
    bgColor: "bg-purple-50 text-purple-700 border-purple-200",
    description: "Precious metal manufacturing, wholesale & retail showrooms",
  },
];

export default function InternalDashboard() {
  // Staff Auth Gate State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");

  // Tabs: 'manage' or 'create'
  const [activeTab, setActiveTab] = useState<"manage" | "create">("manage");

  // Customers Data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedIndustryFilter, setSelectedIndustryFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  // Create Customer Form State
  const [formCompany, setFormCompany] = useState("");
  const [formWebsite, setFormWebsite] = useState("");
  const [formIndustry, setFormIndustry] = useState("hospital");
  const [formContactName, setFormContactName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formCustomCode, setFormCustomCode] = useState("");
  const [formSendEmail, setFormSendEmail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<any | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  // Check session storage on mount
  useEffect(() => {
    const sessionAuth = sessionStorage.getItem("a2000_staff_auth");
    if (sessionAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch customers when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadCustomers();
    }
  }, [isAuthenticated]);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      if (data.customers) {
        setCustomers(data.customers);
      }
    } catch (err) {
      console.warn("Failed to load customers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim().toUpperCase() === "A2000") {
      setIsAuthenticated(true);
      sessionStorage.setItem("a2000_staff_auth", "true");
      setAuthError("");
    } else {
      setAuthError("Invalid A2000 staff security credentials.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("a2000_staff_auth");
    setIsAuthenticated(false);
    setPasscode("");
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: formCompany,
          website: formWebsite,
          industry: formIndustry,
          contactName: formContactName,
          email: formEmail,
          phone: formPhone,
          customCode: formCustomCode,
          sendEmail: formSendEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create customer");
      }

      setCreateSuccess(data.customer);
      // Reset form
      setFormCompany("");
      setFormWebsite("");
      setFormContactName("");
      setFormEmail("");
      setFormPhone("");
      setFormCustomCode("");
      // Reload list in background
      loadCustomers();
    } catch (err: any) {
      setCreateError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleResendInvite = async (customerId: string) => {
    setResendingId(customerId);
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend_invite" }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Invitation email sent successfully to the client!");
        loadCustomers();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Network error: ${e.message}`);
    } finally {
      setResendingId(null);
    }
  };

  // Filter customers
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.access_code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesIndustry =
      selectedIndustryFilter === "all" || c.industry === selectedIndustryFilter;

    return matchesSearch && matchesIndustry;
  });

  // -------------------------------------------------------------
  // VIEW: Staff Passcode Login Gate
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center mb-4">
            <Image
              src="/a2000-logo.png"
              alt="A2000"
              width={160}
              height={50}
              className="h-11 w-auto brightness-0 invert"
              priority
            />
          </div>
          <h2 className="text-center text-xl font-bold tracking-tight text-white">
            A2000 | AI Enablement Staff Portal
          </h2>
          <p className="mt-1 text-center text-xs text-slate-400">
            Internal Operations & Client Assessment Management
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-slate-800 py-8 px-6 shadow-xl sm:rounded-lg sm:px-10 border border-slate-700">
            <form onSubmit={handleStaffLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Staff Access Passkey
                </label>
                <div className="mt-2">
                  <input
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter A2000 internal passkey"
                    className="block w-full rounded border border-slate-600 bg-slate-900/80 px-3.5 py-2.5 text-white placeholder-slate-500 focus:border-[#C97835] focus:outline-none focus:ring-1 focus:ring-[#C97835] sm:text-sm"
                    autoFocus
                  />
                </div>
              </div>

              {authError && (
                <div className="flex items-center gap-2 rounded bg-red-950/60 border border-red-800/80 p-2.5 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded text-sm font-semibold text-white bg-[#C97835] hover:bg-[#b56728] transition shadow-md"
              >
                Access Internal Hub
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-700/80 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Authorized A2000 Consultants & Staff Only</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: Main Internal Operations Hub
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navigation */}
      <header className="bg-[#17324D] border-b border-slate-800 text-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image
              src="/a2000-logo.png"
              alt="A2000"
              width={130}
              height={40}
              className="h-8 w-auto brightness-0 invert"
            />
            <div className="h-6 w-px bg-slate-600" />
            <div>
              <span className="text-sm font-bold tracking-tight text-white block">
                AI Enablement
              </span>
              <span className="text-[10px] text-slate-300 uppercase tracking-wider block">
                Client Assessment Hub
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveTab("manage")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold transition ${
                activeTab === "manage"
                  ? "bg-white text-[#17324D] shadow-sm"
                  : "text-slate-200 hover:text-white hover:bg-slate-700/60"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Manage Customers</span>
              <span className="ml-1 text-[10px] bg-slate-200/20 px-1.5 py-0.5 rounded-full">
                {customers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("create")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold transition ${
                activeTab === "create"
                  ? "bg-[#C97835] text-white shadow-sm"
                  : "bg-slate-700/60 text-slate-200 hover:text-white hover:bg-slate-700"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Customer</span>
            </button>

            <div className="h-5 w-px bg-slate-600 hidden sm:block" />

            <button
              onClick={handleLogout}
              className="text-xs text-slate-300 hover:text-white p-1.5 rounded hover:bg-slate-800 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ========================================================= */}
        {/* TAB 1: CREATE CUSTOMER                                    */}
        {/* ========================================================= */}
        {activeTab === "create" && (
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Create Client Assessment</h1>
              <p className="text-sm text-slate-600 mt-1">
                Provision a dedicated discovery questionnaire for a client enterprise. A unique secure URL and passcode will be generated automatically.
              </p>
            </div>

            {createSuccess && (
              <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Customer Portal Created Successfully!</span>
                  </div>
                  <button
                    onClick={() => setCreateSuccess(null)}
                    className="text-xs text-emerald-700 hover:text-emerald-900 underline"
                  >
                    Dismiss
                  </button>
                </div>

                <div className="mt-4 bg-white rounded border border-emerald-200 p-4 space-y-3">
                  <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Company Name:</span>
                    <span className="font-semibold text-slate-900">{createSuccess.companyName}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Industry:</span>
                    <span className="font-semibold uppercase text-slate-700">{createSuccess.industry}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Assigned Passcode:</span>
                    <span className="font-mono font-bold text-lg text-[#C97835] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {createSuccess.accessCode}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Unique Portal URL:</span>
                    <div className="flex items-center gap-2">
                      <a
                        href={createSuccess.portalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline max-w-[260px] truncate"
                      >
                        {createSuccess.portalUrl}
                      </a>
                      <button
                        onClick={() => copyToClipboard(createSuccess.portalUrl, "new-url")}
                        className="inline-flex items-center gap-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded transition border border-slate-300"
                      >
                        {copiedId === "new-url" ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {createSuccess.emailSent ? (
                  <p className="mt-3 text-xs text-emerald-700 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Invitation email with access link and passcode has been dispatched to {createSuccess.email}.
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">
                    No email was automatically sent. You can share the link and passcode directly with the client.
                  </p>
                )}

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setActiveTab("manage")}
                    className="text-xs font-semibold bg-[#17324D] hover:bg-[#0f2235] text-white px-3.5 py-2 rounded transition shadow-sm"
                  >
                    View in Customer Dashboard &rarr;
                  </button>
                </div>
              </div>
            )}

            {createError && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded p-4 text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            {/* Create Form Card */}
            <div className="bg-white border border-slate-300 rounded-lg shadow-sm p-6 sm:p-8">
              <form onSubmit={handleCreateCustomer} className="space-y-6">
                {/* 1. Industry Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    1. Select Industry Questionnaire *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {INDUSTRY_OPTIONS.map((ind) => {
                      const Icon = ind.icon;
                      const isSelected = formIndustry === ind.id;
                      return (
                        <div
                          key={ind.id}
                          onClick={() => setFormIndustry(ind.id)}
                          className={`cursor-pointer rounded-lg border p-4 transition flex items-start gap-3 ${
                            isSelected
                              ? "border-[#17324D] bg-slate-50 ring-2 ring-[#17324D]/10"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div
                            className={`p-2 rounded ${
                              isSelected ? "bg-[#17324D] text-white" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{ind.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{ind.description}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Company Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Company / Organization Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formCompany}
                      onChange={(e) => setFormCompany(e.target.value)}
                      placeholder="e.g., Apollo Health City / Apex Finance"
                      className="w-full text-sm border border-slate-300 rounded px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#C97835]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Company Website (Optional)
                    </label>
                    <input
                      type="text"
                      value={formWebsite}
                      onChange={(e) => setFormWebsite(e.target.value)}
                      placeholder="e.g., https://example.com"
                      className="w-full text-sm border border-slate-300 rounded px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#C97835]"
                    />
                  </div>
                </div>

                {/* 3. Contact Person Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Person & Designation *
                    </label>
                    <input
                      type="text"
                      required
                      value={formContactName}
                      onChange={(e) => setFormContactName(e.target.value)}
                      placeholder="e.g., Rajesh Sharma, COO"
                      className="w-full text-sm border border-slate-300 rounded px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#C97835]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Official Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="client.executive@company.com"
                      className="w-full text-sm border border-slate-300 rounded px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#C97835]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full text-sm border border-slate-300 rounded px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#C97835]"
                    />
                  </div>
                </div>

                {/* 4. Security Passcode & Dispatch Settings */}
                <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Custom Security Passcode (Optional)
                    </label>
                    <input
                      type="text"
                      value={formCustomCode}
                      onChange={(e) => setFormCustomCode(e.target.value)}
                      placeholder="Leave blank to auto-generate (e.g. A2K-7842)"
                      className="w-full text-sm border border-slate-300 rounded px-3 py-2 text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:border-[#C97835]"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      If left blank, a random 4-digit security code is generated.
                    </p>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formSendEmail}
                        onChange={(e) => setFormSendEmail(e.target.checked)}
                        className="rounded border-slate-300 text-[#C97835] focus:ring-[#C97835] w-4 h-4"
                      />
                      <span className="text-xs font-semibold text-slate-800">
                        Automatically dispatch invitation email with portal link to client
                      </span>
                    </label>
                    <p className="text-[11px] text-slate-500 ml-6.5 mt-0.5">
                      Sends via A2000's direct Gmail relay to the client, CC'ing ramyadevi@a2000india.com.
                    </p>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("manage")}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-[#17324D] hover:bg-[#0f2235] px-5 py-2.5 rounded transition shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating Portal...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-[#C97835]" />
                        <span>Generate Client Link & Access Code</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: MANAGE CUSTOMERS (DASHBOARD)                       */}
        {/* ========================================================= */}
        {activeTab === "manage" && (
          <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Client Assessment Directory</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monitor completion status, copy client access links, view security passcodes, and track submissions.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadCustomers}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-300 px-3 py-1.5 rounded transition shadow-2xs"
                  title="Refresh list"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => setActiveTab("create")}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#C97835] hover:bg-[#b56728] px-3.5 py-1.5 rounded transition shadow-2xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>New Customer</span>
                </button>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="flex-1 min-w-[240px] relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by company, contact person, email, or passcode..."
                  className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded focus:outline-none focus:border-[#17324D]"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500 font-medium">Industry:</span>
                <select
                  value={selectedIndustryFilter}
                  onChange={(e) => setSelectedIndustryFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
                >
                  <option value="all">All Industries ({customers.length})</option>
                  <option value="hospital">Hospital & Healthcare</option>
                  <option value="finance">Finance & FinTech</option>
                  <option value="food-and-beverage">Food & Beverage</option>
                  <option value="jewellery">Jewellery & Retail</option>
                </select>
              </div>
            </div>

            {/* Customers Table / Cards */}
            {filteredCustomers.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No Customers Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  {searchQuery
                    ? "No customer records match your search criteria. Try a different query."
                    : "You haven't provisioned any client assessment portals yet."}
                </p>
                <button
                  onClick={() => setActiveTab("create")}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#17324D] hover:bg-[#0f2235] px-4 py-2 rounded transition shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#C97835]" />
                  <span>Create First Customer</span>
                </button>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold">
                      <tr>
                        <th scope="col" className="px-5 py-3.5">
                          Company / Client
                        </th>
                        <th scope="col" className="px-4 py-3.5">
                          Industry
                        </th>
                        <th scope="col" className="px-4 py-3.5">
                          Assigned Passcode
                        </th>
                        <th scope="col" className="px-4 py-3.5">
                          Dedicated Link
                        </th>
                        <th scope="col" className="px-4 py-3.5">
                          Status
                        </th>
                        <th scope="col" className="px-4 py-3.5">
                          Activity
                        </th>
                        <th scope="col" className="px-4 py-3.5 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCustomers.map((c) => {
                        const portalUrl = typeof window !== "undefined"
                          ? `${window.location.origin}/portal/${c.id}`
                          : `/portal/${c.id}`;

                        const indConfig = INDUSTRY_OPTIONS.find((i) => i.id === c.industry);

                        return (
                          <tr key={c.id} className="hover:bg-slate-50/80 transition">
                            {/* Company Info */}
                            <td className="px-5 py-4">
                              <div className="font-semibold text-slate-900 text-sm">
                                {c.company_name}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {c.contact_name} &bull; {c.email}
                              </div>
                              {c.phone && (
                                <div className="text-[10px] text-slate-400">{c.phone}</div>
                              )}
                            </td>

                            {/* Industry Badge */}
                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium border ${
                                  indConfig?.bgColor || "bg-slate-100 text-slate-700 border-slate-200"
                                }`}
                              >
                                {indConfig && <indConfig.icon className="w-3 h-3" />}
                                {indConfig?.name || c.industry}
                              </span>
                            </td>

                            {/* Access Passcode */}
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-xs bg-amber-50 text-[#C97835] border border-amber-200 px-2 py-0.5 rounded">
                                  {c.access_code}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(c.access_code, `code-${c.id}`)}
                                  className="text-slate-400 hover:text-slate-700 p-1 rounded"
                                  title="Copy Passcode"
                                >
                                  {copiedId === `code-${c.id}` ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* Client Dedicated Link */}
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={portalUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 hover:text-blue-800 font-mono text-[11px] hover:underline flex items-center gap-1"
                                >
                                  <span>/portal/{c.id.substring(0, 12)}...</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                                <button
                                  onClick={() => copyToClipboard(portalUrl, `url-${c.id}`)}
                                  className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100"
                                  title="Copy Full Portal Link"
                                >
                                  {copiedId === `url-${c.id}` ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-4">
                              {c.status === "submitted" ? (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Submitted
                                </span>
                              ) : c.status === "in_progress" ? (
                                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                                  <Clock className="w-3 h-3" />
                                  In Progress
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                                  Created
                                </span>
                              )}
                            </td>

                            {/* Activity */}
                            <td className="px-4 py-4 text-[11px] text-slate-500">
                              {c.status === "submitted" && c.submitted_at ? (
                                <div>Submitted: {new Date(c.submitted_at).toLocaleDateString()}</div>
                              ) : c.last_active_at ? (
                                <div>Active: {new Date(c.last_active_at).toLocaleDateString()}</div>
                              ) : (
                                <div>Created: {new Date(c.created_at).toLocaleDateString()}</div>
                              )}
                              <div className="text-[10px] text-slate-400">
                                {c.answered_questions_count || 0} fields answered
                              </div>
                            </td>

                            {/* Action Buttons */}
                            <td className="px-4 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleResendInvite(c.id)}
                                  disabled={resendingId === c.id}
                                  className="inline-flex items-center gap-1 text-[11px] text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2 py-1 rounded transition"
                                  title="Resend invitation email with passcode to client"
                                >
                                  <Send className={`w-3 h-3 ${resendingId === c.id ? "animate-pulse" : ""}`} />
                                  <span>{c.invitation_sent ? "Resend Invite" : "Send Invite"}</span>
                                </button>

                                <a
                                  href={portalUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-[#17324D] hover:text-white bg-slate-100 hover:bg-[#17324D] border border-slate-300 px-2 py-1 rounded transition"
                                >
                                  <span>Open</span>
                                  <ChevronRight className="w-3 h-3" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
