"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
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
  AlertCircle,
  RefreshCw,
  LogOut,
  ChevronRight,
  ArrowLeft,
  Lock,
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
    badge: "Healthcare",
    description: "Multi-specialty tertiary care, hospital networks, clinics",
  },
  {
    id: "finance",
    name: "Finance & FinTech",
    icon: Landmark,
    badge: "Financial Services",
    description: "NBFCs, digital lending, payments, wealth management",
  },
  {
    id: "food-and-beverage",
    name: "Food & Beverage",
    icon: UtensilsCrossed,
    badge: "FMCG / Processing",
    description: "Packaged foods, FMCG manufacturing, beverage bottling",
  },
  {
    id: "jewellery",
    name: "Jewellery & Retail",
    icon: Gem,
    badge: "Retail & Manufacturing",
    description: "Precious metal manufacturing, wholesale & retail showrooms",
  },
];

export default function InternalDashboard() {
  // Staff Auth Gate State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");

  // View: 'directory' or 'create'
  const [currentView, setCurrentView] = useState<"directory" | "create">("directory");

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

  useEffect(() => {
    const sessionAuth = sessionStorage.getItem("a2000_staff_auth");
    if (sessionAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

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
      setAuthError("Invalid access credentials. Please verify your passkey.");
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
      setFormCompany("");
      setFormWebsite("");
      setFormContactName("");
      setFormEmail("");
      setFormPhone("");
      setFormCustomCode("");
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
        alert("Invitation email sent successfully to the client.");
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
      <div className="min-h-screen bg-white flex flex-col justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Official Brand Logo */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center shadow-xs">
              <Image
                src="/a2000-logo.png"
                alt="A2000"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-[#17324D]">
                A2000 | AI Enablement
              </div>
              <div className="text-xs text-slate-500">
                Internal Assessment Hub
              </div>
            </div>
          </div>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <div className="bg-white py-8 px-6 border border-slate-200 rounded-lg shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-1">
              Internal Access
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Enter your authorized staff passkey to manage client assessments.
            </p>

            <form onSubmit={handleStaffLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Passkey
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter passkey"
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#C97835] focus:ring-1 focus:ring-[#C97835]"
                    autoFocus
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {authError && (
                <div className="flex items-center gap-2 rounded bg-red-50 border border-red-200 p-2 text-xs text-red-700">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 rounded text-xs font-semibold text-white bg-[#17324D] hover:bg-[#0f2235] transition"
              >
                Sign In
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Authorized personnel only</span>
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
      <header className="bg-[#17324D] text-white border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-white rounded p-0.5 flex items-center justify-center shrink-0">
              <Image
                src="/a2000-logo.png"
                alt="A2000"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white leading-tight">
                A2000 | AI Enablement
              </div>
              <div className="text-[11px] text-slate-300 leading-none">
                Client Assessment Hub
              </div>
            </div>
          </div>

          {/* Action / View Switch */}
          <div className="flex items-center space-x-3">
            {currentView === "directory" ? (
              <button
                onClick={() => {
                  setCreateSuccess(null);
                  setCreateError(null);
                  setCurrentView("create");
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold text-white bg-[#C97835] hover:bg-[#b56728] transition shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Customer</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setCreateSuccess(null);
                  setCreateError(null);
                  setCurrentView("directory");
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 transition border border-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Directory</span>
              </button>
            )}

            <div className="h-4 w-px bg-slate-700" />

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
        {/* VIEW 1: CREATE CUSTOMER                                   */}
        {/* ========================================================= */}
        {currentView === "create" && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-slate-900">Create Customer Assessment</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Provision a dedicated questionnaire link and secure access passcode for a client.
                </p>
              </div>

              <button
                onClick={() => {
                  setCreateSuccess(null);
                  setCreateError(null);
                  setCurrentView("directory");
                }}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Directory</span>
              </button>
            </div>

            {/* Success Box - Shows only immediately after creating */}
            {createSuccess && (
              <div className="mb-6 bg-white border border-emerald-300 rounded-lg p-5 shadow-xs">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Client Assessment Portal Ready</span>
                </div>

                <div className="bg-slate-50 rounded border border-slate-200 p-3.5 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Company:</span>
                    <span className="font-semibold text-slate-900">{createSuccess.companyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Industry:</span>
                    <span className="font-medium text-slate-700 capitalize">{createSuccess.industry}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Access Passcode:</span>
                    <span className="font-mono font-bold text-[#C97835] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {createSuccess.accessCode}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Portal URL:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-slate-700 text-[11px] truncate max-w-[200px]">
                        {createSuccess.portalUrl}
                      </span>
                      <button
                        onClick={() => copyToClipboard(createSuccess.portalUrl, "new-url")}
                        className="text-[11px] font-medium bg-white hover:bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-300"
                      >
                        {copiedId === "new-url" ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>

                {createSuccess.emailSent && (
                  <p className="mt-2.5 text-[11px] text-emerald-700 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Invitation email with access link sent to {createSuccess.email}.
                  </p>
                )}

                <div className="mt-4">
                  <button
                    onClick={() => {
                      setCreateSuccess(null);
                      setCurrentView("directory");
                    }}
                    className="text-xs font-medium text-[#17324D] hover:underline"
                  >
                    &larr; View in Directory
                  </button>
                </div>
              </div>
            )}

            {createError && (
              <div className="mb-5 bg-red-50 border border-red-200 rounded p-3 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            {/* Create Customer Form */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
              <form onSubmit={handleCreateCustomer} className="space-y-5">
                
                {/* 1. Industry Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-2">
                    Industry Questionnaire *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {INDUSTRY_OPTIONS.map((ind) => {
                      const Icon = ind.icon;
                      const isSelected = formIndustry === ind.id;
                      return (
                        <div
                          key={ind.id}
                          onClick={() => setFormIndustry(ind.id)}
                          className={`cursor-pointer rounded border p-3 transition flex items-start gap-2.5 ${
                            isSelected
                              ? "border-[#17324D] bg-slate-50 ring-1 ring-[#17324D]"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? "text-[#C97835]" : "text-slate-400"}`} />
                          <div>
                            <div className="text-xs font-semibold text-slate-900">{ind.name}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">{ind.description}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Company Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formCompany}
                      onChange={(e) => setFormCompany(e.target.value)}
                      placeholder="e.g. Apollo Healthcare / Aachi Masala"
                      className="w-full text-xs border border-slate-300 rounded px-2.5 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#C97835]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Website (Optional)
                    </label>
                    <input
                      type="text"
                      value={formWebsite}
                      onChange={(e) => setFormWebsite(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full text-xs border border-slate-300 rounded px-2.5 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#C97835]"
                    />
                  </div>
                </div>

                {/* 3. Contact Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      required
                      value={formContactName}
                      onChange={(e) => setFormContactName(e.target.value)}
                      placeholder="Full Name & Role"
                      className="w-full text-xs border border-slate-300 rounded px-2.5 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#C97835]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Official Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="client@company.com"
                      className="w-full text-xs border border-slate-300 rounded px-2.5 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#C97835]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="+91..."
                      className="w-full text-xs border border-slate-300 rounded px-2.5 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#C97835]"
                    />
                  </div>
                </div>

                {/* 4. Passcode & Options */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Custom Passcode (Optional)
                    </label>
                    <input
                      type="text"
                      value={formCustomCode}
                      onChange={(e) => setFormCustomCode(e.target.value)}
                      placeholder="Leave blank to auto-generate"
                      className="w-full text-xs border border-slate-300 rounded px-2.5 py-2 text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:border-[#C97835]"
                    />
                  </div>

                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formSendEmail}
                        onChange={(e) => setFormSendEmail(e.target.checked)}
                        className="rounded border-slate-300 text-[#C97835] focus:ring-[#C97835]"
                      />
                      <span className="text-xs font-medium text-slate-800">
                        Email invitation link & passcode to client
                      </span>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateSuccess(null);
                      setCreateError(null);
                      setCurrentView("directory");
                    }}
                    className="text-xs text-slate-600 hover:text-slate-800 px-3 py-1.5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#17324D] hover:bg-[#0f2235] px-4 py-2 rounded transition shadow-xs disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <span>Generate Customer Link</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: MANAGE CUSTOMERS (DIRECTORY)                      */}
        {/* ========================================================= */}
        {currentView === "directory" && (
          <div className="space-y-4">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-slate-900">Client Directory</h1>
                <p className="text-xs text-slate-500">
                  {customers.length} total customer assessment portals provisioned
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadCustomers}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1.5 rounded transition shadow-xs"
                  title="Refresh list"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>

                <button
                  onClick={() => {
                    setCreateSuccess(null);
                    setCreateError(null);
                    setCurrentView("create");
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#C97835] hover:bg-[#b56728] px-3.5 py-1.5 rounded transition shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Customer</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by company, contact, or code..."
                  className="w-full text-xs pl-8 pr-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-[#17324D]"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <Filter className="w-3 h-3 text-slate-400" />
                <select
                  value={selectedIndustryFilter}
                  onChange={(e) => setSelectedIndustryFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 focus:outline-none"
                >
                  <option value="all">All Industries</option>
                  <option value="hospital">Hospital & Healthcare</option>
                  <option value="finance">Finance & FinTech</option>
                  <option value="food-and-beverage">Food & Beverage</option>
                  <option value="jewellery">Jewellery & Retail</option>
                </select>
              </div>
            </div>

            {/* Table */}
            {filteredCustomers.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg p-10 text-center">
                <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-700">No customers found</p>
                <button
                  onClick={() => {
                    setCreateSuccess(null);
                    setCreateError(null);
                    setCurrentView("create");
                  }}
                  className="mt-3 text-xs font-semibold text-[#17324D] hover:underline"
                >
                  Create your first customer &rarr;
                </button>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="px-4 py-3">Client</th>
                        <th className="px-4 py-3">Industry</th>
                        <th className="px-4 py-3">Passcode</th>
                        <th className="px-4 py-3">Portal Link</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Activity</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCustomers.map((c) => {
                        const portalUrl = typeof window !== "undefined"
                          ? `${window.location.origin}/portal/${c.id}`
                          : `/portal/${c.id}`;

                        const ind = INDUSTRY_OPTIONS.find((i) => i.id === c.industry);

                        return (
                          <tr key={c.id} className="hover:bg-slate-50/60 transition">
                            {/* Client */}
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-900">{c.company_name}</div>
                              <div className="text-[11px] text-slate-500">{c.contact_name} &bull; {c.email}</div>
                            </td>

                            {/* Industry */}
                            <td className="px-4 py-3">
                              <span className="inline-block text-[11px] text-slate-700 font-medium">
                                {ind?.badge || c.industry}
                              </span>
                            </td>

                            {/* Passcode */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-xs bg-amber-50 text-[#C97835] border border-amber-200 px-1.5 py-0.5 rounded">
                                  {c.access_code}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(c.access_code, `code-${c.id}`)}
                                  className="text-slate-400 hover:text-slate-600 p-0.5"
                                  title="Copy code"
                                >
                                  {copiedId === `code-${c.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* Portal Link */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[11px] text-slate-600 max-w-[140px] truncate">
                                  /portal/{c.id}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(portalUrl, `url-${c.id}`)}
                                  className="text-slate-400 hover:text-slate-600 p-0.5"
                                  title="Copy link"
                                >
                                  {copiedId === `url-${c.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3">
                              {c.status === "submitted" ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Submitted
                                </span>
                              ) : c.status === "in_progress" ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                                  <Clock className="w-3 h-3" />
                                  In Progress
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                                  Created
                                </span>
                              )}
                            </td>

                            {/* Activity */}
                            <td className="px-4 py-3 text-[11px] text-slate-500">
                              {c.status === "submitted" && c.submitted_at ? (
                                <div>Submitted: {new Date(c.submitted_at).toLocaleDateString()}</div>
                              ) : c.last_active_at ? (
                                <div>Active: {new Date(c.last_active_at).toLocaleDateString()}</div>
                              ) : (
                                <div>Created: {new Date(c.created_at).toLocaleDateString()}</div>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleResendInvite(c.id)}
                                  disabled={resendingId === c.id}
                                  className="text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded transition"
                                  title="Resend email invitation"
                                >
                                  {resendingId === c.id ? "Sending..." : "Send Invite"}
                                </button>

                                <a
                                  href={portalUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] font-medium text-[#17324D] hover:text-white bg-slate-100 hover:bg-[#17324D] border border-slate-200 px-2 py-1 rounded transition flex items-center gap-0.5"
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
