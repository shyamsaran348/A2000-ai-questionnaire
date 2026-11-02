import { NextResponse } from "next/server";
import { generateCaseWorkbook } from "@/lib/services/excel";
import { memoryStore } from "@/lib/services/store";
import { HOSPITAL_QUESTIONNAIRE_SECTIONS } from "@/lib/data/hospital-seed";
import { sql, ensureTablesCreated } from "@/lib/db/neon";

export async function GET(request: Request) {
  try {
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
      caseAnswers = memoryStore.answers["case-default"] || {};
    }

    const clientName = (caseAnswers["q1_1_hospital_name"]?.value as string) || "Healthcare Facility";

    const buffer = await generateCaseWorkbook({
      caseCode: "A2000-DISCOVERY",
      clientName: clientName,
      industry: "Healthcare Provider",
      status: "In Progress",
      workflowMode: "Standard",
      createdAt: new Date().toISOString(),
      sections: HOSPITAL_QUESTIONNAIRE_SECTIONS.map((s) => ({
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
