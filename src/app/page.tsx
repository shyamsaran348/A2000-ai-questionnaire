"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import SecurityGate from "@/components/SecurityGate";
import {
  Building2,
  UtensilsCrossed,
  Gem,
  Landmark,
  Factory,
  ChefHat,
  ArrowRight,
  ShieldCheck,
  Clock,
  FileText,
  Sparkles,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface IndustryCardProps {
  title: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  caseCode: string;
  storageKey: string;
  highlights: string[];
}

function IndustryCard({
  title,
  category,
  description,
  icon,
  href,
  caseCode,
  storageKey,
  highlights,
}: IndustryCardProps) {
  const [hasDraft, setHasDraft] = useState<boolean>(false);

  useEffect(() => {
    try {
      const draft = localStorage.getItem(storageKey);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed && Object.keys(parsed).length > 0) {
          setHasDraft(true);
        }
      }
    } catch {}
  }, [storageKey]);

  return (
    <div className="bg-white border border-slate-300 hover:border-[#17324D] rounded-lg p-6 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between group relative">
      {hasDraft && (
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-full">
          <Clock className="w-3 h-3 text-amber-600" />
          <span>Draft in Progress</span>
        </div>
      )}

      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-lg bg-slate-100 group-hover:bg-[#17324D]/10 flex items-center justify-center transition">
            {icon}
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C97835]">
              {category}
            </span>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-[#17324D] transition">
              {title}
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          {description}
        </p>

        <div className="space-y-1.5 mb-5 border-t border-slate-100 pt-3">
          {highlights.map((h, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{h}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
        <span className="text-[11px] font-mono text-slate-500">
          ID: {caseCode}
        </span>
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#17324D] group-hover:bg-[#0f2235] px-3.5 py-1.5 rounded transition shadow-xs"
        >
          <span>{hasDraft ? "Resume Form" : "Start Form"}</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#C97835] group-hover:translate-x-0.5 transition" />
        </Link>
      </div>
    </div>
  );
}

export default function HomePage() {
  const industries: IndustryCardProps[] = [
    {
      title: "Hospital & Healthcare",
      category: "Healthcare Providers",
      description:
        "Designed for tertiary care, specialty hospitals, clinic networks and surgical centers seeking operational AI enhancements.",
      icon: <Building2 className="w-6 h-6 text-[#17324D]" />,
      href: "/hospital",
      caseCode: "A2000-HOSPITAL",
      storageKey: "a2000_draft_hospital",
      highlights: [
        "12 Sections • HIS/EMR Integration",
        "Clinical Documentation & Multilingual Triage",
        "Pharmacy, Diagnostics & Insurance Desks",
      ],
    },
    {
      title: "Food & Beverage",
      category: "FMCG / Food Processing",
      description:
        "Comprehensive discovery for packaged food manufacturers, beverage brands, spices, bakeries, and HoReCa food providers.",
      icon: <UtensilsCrossed className="w-6 h-6 text-[#17324D]" />,
      href: "/food-and-beverage",
      caseCode: "A2000-FB",
      storageKey: "a2000_draft_food_beverage",
      highlights: [
        "12 Sections • Raw Material Sourcing",
        "Recipe Formulation & Batch QA Consistency",
        "Distributor Sales, Q-Commerce & Logistics",
      ],
    },
    {
      title: "Jewellery & Gems",
      category: "Luxury Goods & Retail",
      description:
        "Tailored for gold/silver/diamond manufacturers, wholesalers, boutique designers and multi-city showroom retail chains.",
      icon: <Gem className="w-6 h-6 text-[#17324D]" />,
      href: "/jewellery",
      caseCode: "A2000-JW",
      storageKey: "a2000_draft_jewellery",
      highlights: [
        "12 Sections • CAD/CAM Design & Casting",
        "Hallmarking, BIS Compliance & Purity Tracking",
        "High-Value Inventory & Showroom Management",
      ],
    },
    {
      title: "Finance & FinTech",
      category: "Banking & Financial Services",
      description:
        "Assessment for banks, NBFCs, lending platforms, digital payment processors, InsurTech and wealth management institutions.",
      icon: <Landmark className="w-6 h-6 text-[#17324D]" />,
      href: "/finance",
      caseCode: "A2000-FN",
      storageKey: "a2000_draft_finance",
      highlights: [
        "12 Sections • Customer Onboarding & KYC",
        "Automated Credit Underwriting & NPA Monitoring",
        "AML, Fraud Detection & Regulatory Reporting",
      ],
    },
    {
      title: "Manufacturing & Industrial",
      category: "Discrete & Process Manufacturing",
      description:
        "Operational assessment for engineering, industrial parts, assembly lines, automated machinery and supply chain tracking.",
      icon: <Factory className="w-6 h-6 text-[#17324D]" />,
      href: "/food-and-beverage", // Shared industrial questionnaire structure
      caseCode: "A2000-MFG",
      storageKey: "a2000_draft_mfg",
      highlights: [
        "Production Scheduling & Material Wastage",
        "Machine Maintenance & Predictive Downtime",
        "Supplier Quality & Warehouse Stock Logistics",
      ],
    },
    {
      title: "Restaurants & Hospitality",
      category: "Food Services & HoReCa",
      description:
        "Specialized discovery for restaurant chains, cloud kitchens, fine dining and hotel food services operations.",
      icon: <ChefHat className="w-6 h-6 text-[#17324D]" />,
      href: "/food-and-beverage", // Food & Beverage covers full HoReCa & dining workflows
      caseCode: "A2000-REST",
      storageKey: "a2000_draft_rest",
      highlights: [
        "Central Kitchen Operations & Yield Tracking",
        "Delivery Platform Reconciliation (Swiggy/Zomato)",
        "Dine-In Customer Experience & Inventory Shelf Life",
      ],
    },
  ];

  return (
    <SecurityGate
      title="A2000 AI Opportunity Discovery Portal"
      subtitle="Confidential Enterprise Questionnaire Platform • Select Your Industry to Begin"
    >
      <div className="max-w-5xl mx-auto pb-16 space-y-8">
        
        {/* Main Portal Header */}
        <div className="bg-white border border-slate-300 rounded-lg shadow-sm p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-6">
            <div className="flex items-center space-x-4">
              <Image
                src="/a2000-logo.png"
                alt="A2000 Logo"
                width={130}
                height={40}
                className="object-contain"
                priority
              />
              <div className="hidden sm:block border-l border-slate-300 pl-4">
                <span className="text-xs font-bold text-slate-800 tracking-wide uppercase block">
                  AI Enablement Service
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Industry Discovery &amp; Readiness Platform
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-widest uppercase text-slate-600 border border-slate-300 bg-slate-50 px-2.5 py-1 rounded flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#C97835]" />
                CONFIDENTIAL
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Enterprise AI Opportunity Discovery Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Select your industry below to open the dedicated discovery questionnaire. All forms feature{" "}
              <strong>continuous real-time autosave</strong>, verified field validations, and one-click{" "}
              <strong>Executive PDF Generation</strong> upon completion.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-medium block">Standard Length</span>
              <span className="text-sm font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                <FileText className="w-3.5 h-3.5 text-[#C97835]" />
                12 Key Sections
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-medium block">Completion Time</span>
              <span className="text-sm font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-[#C97835]" />
                25–35 Minutes
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-medium block">Form State</span>
              <span className="text-sm font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Live Autosave Active
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <span className="text-[10px] text-slate-500 font-medium block">Output Document</span>
              <span className="text-sm font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Confidential PDF
              </span>
            </div>
          </div>
        </div>

        {/* Industry Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {industries.map((ind) => (
            <IndustryCard key={ind.caseCode} {...ind} />
          ))}
        </div>

        {/* Footer Info */}
        <div className="border-t border-slate-300 pt-6 text-center text-xs text-slate-500 space-y-1">
          <p>© 2026 A2000 AI Enablement Service. All rights reserved.</p>
          <p className="text-[11px] text-slate-400">
            Data submitted through this portal is encrypted and treated under strict Non-Disclosure Agreement (NDA).
          </p>
        </div>

      </div>
    </SecurityGate>
  );
}
