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
  Clock,
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
    <div className="bg-white border border-slate-300 hover:border-[#17324D] rounded p-5 shadow-xs hover:shadow-sm transition flex flex-col justify-between group relative">
      {hasDraft && (
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-medium px-2 py-0.5 rounded">
          <Clock className="w-3 h-3 text-amber-600" />
          <span>Draft saved</span>
        </div>
      )}

      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded bg-slate-100 group-hover:bg-[#17324D]/10 flex items-center justify-center transition">
            {icon}
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C97835]">
              {category}
            </span>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#17324D] transition">
              {title}
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          {description}
        </p>

        <div className="space-y-1 mb-4 border-t border-slate-100 pt-3">
          {highlights.map((h, i) => (
            <div key={i} className="text-[11px] text-slate-600 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-slate-400"></span>
              <span>{h}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-3.5 flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-500">
          Confidential Discovery
        </span>
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#17324D] group-hover:bg-[#0f2235] px-3.5 py-1.5 rounded transition"
        >
          <span>{hasDraft ? "Resume Assessment" : "Start Assessment"}</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#C97835]" />
        </Link>
      </div>
    </div>
  );
}

export default function HomePage() {
  const industries: IndustryCardProps[] = [
    {
      title: "Hospital & Healthcare",
      category: "Healthcare",
      description: "For hospitals, specialty clinics and healthcare facilities.",
      icon: <Building2 className="w-5 h-5 text-[#17324D]" />,
      href: "/hospital",
      caseCode: "A2000-HOSPITAL",
      storageKey: "a2000_draft_hospital",
      highlights: [
        "HIS / EMR systems and data architecture",
        "Front desk, triage and clinical records",
        "Pharmacy, billing, diagnostics and insurance",
      ],
    },
    {
      title: "Food & Beverage",
      category: "FMCG / Food Processing",
      description: "For packaged food manufacturers, beverage makers and spices producers.",
      icon: <UtensilsCrossed className="w-5 h-5 text-[#17324D]" />,
      href: "/food-and-beverage",
      caseCode: "A2000-FB",
      storageKey: "a2000_draft_food_beverage",
      highlights: [
        "Raw material sourcing and batch consistency",
        "Production scheduling and quality control",
        "Distribution, retail and delivery channels",
      ],
    },
    {
      title: "Jewellery Industry",
      category: "Jewellery & Retail",
      description: "For jewellery manufacturers, wholesalers and retail showrooms.",
      icon: <Gem className="w-5 h-5 text-[#17324D]" />,
      href: "/jewellery",
      caseCode: "A2000-JW",
      storageKey: "a2000_draft_jewellery",
      highlights: [
        "CAD design, casting and stone setting",
        "Purity testing, hallmarking and compliance",
        "Inventory reconciliation across showrooms",
      ],
    },
    {
      title: "Finance & FinTech",
      category: "Financial Services",
      description: "For banks, NBFCs, lenders, fintechs and payment companies.",
      icon: <Landmark className="w-5 h-5 text-[#17324D]" />,
      href: "/finance",
      caseCode: "A2000-FN",
      storageKey: "a2000_draft_finance",
      highlights: [
        "Customer onboarding and KYC workflows",
        "Credit underwriting and collections",
        "Payment reconciliation, fraud and compliance",
      ],
    },
    {
      title: "Manufacturing & Industrial",
      category: "Manufacturing",
      description: "For discrete and process manufacturers, machinery and assembly units.",
      icon: <Factory className="w-5 h-5 text-[#17324D]" />,
      href: "/food-and-beverage",
      caseCode: "A2000-MFG",
      storageKey: "a2000_draft_mfg",
      highlights: [
        "Production planning and machine downtime",
        "Quality assurance and material wastage",
        "Warehouse logistics and vendor tracking",
      ],
    },
    {
      title: "Restaurants & Food Services",
      category: "Hospitality & QSR",
      description: "For restaurant chains, cloud kitchens, fine dining and food services.",
      icon: <ChefHat className="w-5 h-5 text-[#17324D]" />,
      href: "/food-and-beverage",
      caseCode: "A2000-REST",
      storageKey: "a2000_draft_rest",
      highlights: [
        "Central kitchen operations and yield tracking",
        "Delivery platform orders (Swiggy / Zomato)",
        "Daily sales reconciliation and procurement",
      ],
    },
  ];

  return (
    <SecurityGate
      title="A2000 | AI Enablement"
      subtitle="Industry Discovery Questionnaires"
    >
      <div className="max-w-5xl mx-auto pb-16 space-y-6">
        
        {/* Header */}
        <div className="bg-white border border-slate-300 rounded p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5 mb-5">
            <div className="flex items-center space-x-3">
              <Image
                src="/a2000-logo.png"
                alt="A2000 Logo"
                width={120}
                height={38}
                className="object-contain"
                priority
              />
              <div className="border-l border-slate-300 pl-3">
                <span className="text-xs font-bold text-slate-800 tracking-wide uppercase block">
                  A2000 | AI Enablement
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Discovery Questionnaires
                </span>
              </div>
            </div>

            <span className="text-[11px] font-bold tracking-widest uppercase text-slate-600 border border-slate-300 bg-slate-50 px-2.5 py-1 rounded flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#C97835]" />
              CONFIDENTIAL
            </span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Industry Discovery Questionnaires
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Select your industry below. Your answers will help A2000 understand your business operations, technology, and challenges to identify opportunities for AI adoption and process improvement.
            </p>
          </div>
        </div>

        {/* Industry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {industries.map((ind) => (
            <IndustryCard key={ind.caseCode} {...ind} />
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-300 pt-5 text-center text-xs text-slate-500">
          <p>A2000 | AI Enablement • Confidential</p>
        </div>

      </div>
    </SecurityGate>
  );
}
