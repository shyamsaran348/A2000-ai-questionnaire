import { NextResponse } from "next/server";
import { generateCaseWorkbook } from "@/lib/services/excel";
import { memoryStore } from "@/lib/services/store";
import { HOSPITAL_QUESTIONNAIRE_SECTIONS } from "@/lib/data/hospital-seed";
import { FOOD_BEVERAGE_QUESTIONNAIRE_SECTIONS } from "@/lib/data/food-beverage-seed";
import { sql, ensureTablesCreated } from "@/lib/db/neon";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get("caseId") || "case-default";
    const type = searchParams.get("type");

    const sections = type === "fb" ? FOOD_BEVERAGE_QUESTIONNAIRE_SECTIONS : HOSPITAL_QUESTIONNAIRE_SECTIONS;
    const defaultIndustry = type === "fb" ? "Food & Beverage / FMCG" : "Healthcare Provider";
    const defaultNameKey = type === "fb" ? "fb_q1_company_name" : "q1_1_hospital_name";

    let caseAnswers: Record<string, any> = {};
    const isNeonConfigured = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("postgres"));

    if (isNeonConfigured) {
      try {
        await ensureTablesCreated();
        const rows = await sql`
          SELECT question_key, value, department, updated_at 
          FROM hospital_questionnaire_answers
        `;
        rows.forEach((row: any) => {
          caseAnswers[row.question_key] = {
            value: row.value,
            department: row.department,
            updatedAt: row.updated_at,
          };
        });
      } catch (err) {
        console.error("Neon read error during excel export:", err);
      }
    }

    if (Object.keys(caseAnswers).length === 0) {
      caseAnswers = memoryStore.answers[caseId] || {};
    }

    const clientName = (caseAnswers[defaultNameKey]?.value as string) || (type === "fb" ? "Food & Beverage Company" : "Healthcare Facility");

    const buffer = await generateCaseWorkbook({
      caseCode: type === "fb" ? "A2000-FB-DISCOVERY" : "A2000-DISCOVERY",
      clientName: clientName,
      industry: defaultIndustry,
      status: "In Progress",
      workflowMode: "Standard",
      createdAt: new Date().toISOString(),
      sections: sections.map((s) => ({
        sectionNumber: s.number,
        title: s.title,
        department: s.defaultDepartment,
        status: "Submitted",
      })),
      answers: caseAnswers,
      auditLogs: [],
    });

    const safeClientName = clientName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `${safeClientName}_A2000_Questionnaire.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Excel generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate Excel export", details: error.message },
      { status: 500 }
    );
  }
}
