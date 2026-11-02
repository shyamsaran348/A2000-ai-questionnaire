import { HOSPITAL_QUESTIONNAIRE_SECTIONS } from "@/lib/data/hospital-seed";

export interface AnswerItem {
  value: any;
  department?: string;
  updatedAt: string;
}

// In-memory store for questionnaire instances
export const memoryStore = {
  cases: [
    {
      id: "case-default",
      caseCode: "A2000-DISCOVERY-001",
      title: "Hospital AI Opportunity Discovery Questionnaire",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  answers: {
    "case-default": {} as Record<string, AnswerItem>,
  } as Record<string, Record<string, AnswerItem>>,
};
