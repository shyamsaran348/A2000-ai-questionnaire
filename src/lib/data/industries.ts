import { Building2, Gem, Landmark, UtensilsCrossed, type LucideIcon } from "lucide-react";
import type { SectionDefinition } from "./hospital-seed";
import { HOSPITAL_QUESTIONNAIRE_SECTIONS } from "./hospital-seed";
import { FINANCE_QUESTIONNAIRE_SECTIONS } from "./finance-seed";
import { FOOD_BEVERAGE_QUESTIONNAIRE_SECTIONS } from "./food-beverage-seed";
import { JEWELLERY_QUESTIONNAIRE_SECTIONS } from "./jewellery-seed";

export interface IndustryConfig {
  id: "hospital" | "finance" | "food-and-beverage" | "jewellery";
  name: string;
  shortName: string;
  description: string;
  icon: LucideIcon;
  caseCode: string;
  /** Title used on the client portal and in the PDF. */
  assessmentTitle: string;
  sections: SectionDefinition[];
  /** Used only by the standalone (non-portal) questionnaire pages. */
  standalone: {
    title: string;
    industryLabel: string;
    draftKey: string;
    companyKey: string;
    companyFallback: string;
    contactKey: string;
    emailKey: string;
    phoneKey: string;
  };
}

export const INDUSTRIES: IndustryConfig[] = [
  {
    id: "hospital",
    name: "Hospital & Healthcare",
    shortName: "Healthcare",
    description: "Multi-specialty care, hospital networks and clinics",
    icon: Building2,
    caseCode: "A2000-HOSPITAL",
    assessmentTitle: "Hospital & Healthcare Discovery Assessment",
    sections: HOSPITAL_QUESTIONNAIRE_SECTIONS,
    standalone: {
      title: "Hospital Discovery Questionnaire",
      industryLabel: "Healthcare Provider",
      draftKey: "a2000_draft_hospital",
      companyKey: "q1_1_hospital_name",
      companyFallback: "Healthcare Facility",
      contactKey: "q1_contact_person",
      emailKey: "q1_email",
      phoneKey: "q1_phone",
    },
  },
  {
    id: "finance",
    name: "Finance & FinTech",
    shortName: "Financial Services",
    description: "NBFCs, digital lending, payments and wealth management",
    icon: Landmark,
    caseCode: "A2000-FN",
    assessmentTitle: "Finance & FinTech Discovery Assessment",
    sections: FINANCE_QUESTIONNAIRE_SECTIONS,
    standalone: {
      title: "Finance & FinTech Discovery Questionnaire",
      industryLabel: "Finance & FinTech",
      draftKey: "a2000_draft_finance",
      companyKey: "fn_q1_company_name",
      companyFallback: "Financial Services Enterprise",
      contactKey: "fn_q1_contact_person",
      emailKey: "fn_q1_email",
      phoneKey: "fn_q1_phone",
    },
  },
  {
    id: "food-and-beverage",
    name: "Food & Beverage",
    shortName: "Food & Beverage",
    description: "Packaged foods, FMCG manufacturing and beverage bottling",
    icon: UtensilsCrossed,
    caseCode: "A2000-FB",
    assessmentTitle: "Food & Beverage Discovery Assessment",
    sections: FOOD_BEVERAGE_QUESTIONNAIRE_SECTIONS,
    standalone: {
      title: "Food & Beverage Discovery Questionnaire",
      industryLabel: "Food & Beverage",
      draftKey: "a2000_draft_food_beverage",
      companyKey: "fb_q1_company_name",
      companyFallback: "Food & Beverage Enterprise",
      contactKey: "fb_q1_contact_person",
      emailKey: "fb_q1_email",
      phoneKey: "fb_q1_phone",
    },
  },
  {
    id: "jewellery",
    name: "Jewellery & Retail",
    shortName: "Jewellery & Retail",
    description: "Precious-metal manufacturing, wholesale and retail showrooms",
    icon: Gem,
    caseCode: "A2000-JW",
    assessmentTitle: "Jewellery & Retail Discovery Assessment",
    sections: JEWELLERY_QUESTIONNAIRE_SECTIONS,
    standalone: {
      title: "Jewellery Industry Discovery Questionnaire",
      industryLabel: "Jewellery Industry",
      draftKey: "a2000_draft_jewellery",
      companyKey: "jw_q1_company_name",
      companyFallback: "Jewellery Company",
      contactKey: "jw_q1_contact_person",
      emailKey: "jw_q1_email",
      phoneKey: "jw_q1_phone",
    },
  },
];

export function getIndustry(id: string | undefined): IndustryConfig {
  return INDUSTRIES.find((i) => i.id === id) ?? INDUSTRIES[0];
}
