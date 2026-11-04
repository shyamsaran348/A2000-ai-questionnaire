import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { sql, ensureTablesCreated } from "@/lib/db/neon";
import { memoryStore } from "@/lib/services/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      industry,
      caseCode,
      clientName,
      answers,
      email,
      phone,
      contactPerson,
      submittedAt = new Date().toISOString(),
    } = body;

    if (!caseCode || !answers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const submissionRecord = {
      id: `${caseCode}-${Date.now()}`,
      caseCode,
      industry: industry || "General",
      clientName: clientName || "Valued Enterprise Client",
      email: email || answers?.email?.value || "",
      phone: phone || answers?.phone?.value || "",
      contactPerson: contactPerson || answers?.contact_person?.value || "",
      answers,
      submittedAt,
    };

    // 1. In-memory store persistence
    if (!memoryStore.answers[caseCode]) {
      memoryStore.answers[caseCode] = {};
    }
    Object.entries(answers).forEach(([qKey, aVal]: [string, any]) => {
      memoryStore.answers[caseCode][qKey] = {
        value: aVal?.value !== undefined ? aVal.value : aVal,
        department: aVal?.department || "General",
        updatedAt: submittedAt,
      };
    });

    // 2. Local Disk Backup (JSON file storage)
    try {
      const backupDir = path.join(process.cwd(), "tmp", "submissions");
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      const filePath = path.join(backupDir, `${caseCode}_${Date.now()}.json`);
      fs.writeFileSync(filePath, JSON.stringify(submissionRecord, null, 2), "utf8");
    } catch (fsErr: any) {
      console.warn("Local filesystem submission save warning:", fsErr.message);
    }

    // 3. PostgreSQL / Neon persistence (if configured)
    const isNeonConfigured = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("postgres"));
    if (isNeonConfigured) {
      try {
        await ensureTablesCreated();
        for (const [qKey, valObj] of Object.entries(answers)) {
          const v = (valObj as any)?.value !== undefined ? (valObj as any).value : valObj;
          const dept = (valObj as any)?.department || "General";
          await sql`
            INSERT INTO hospital_questionnaire_answers (question_key, value, department, updated_at)
            VALUES (${qKey}, ${JSON.stringify(v)}::jsonb, ${dept}, NOW())
            ON CONFLICT (question_key)
            DO UPDATE SET
              value = EXCLUDED.value,
              department = EXCLUDED.department,
              updated_at = NOW();
          `;
        }
      } catch (dbErr: any) {
        console.warn("Database storage warning:", dbErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Questionnaire data successfully recorded and backed up.",
      caseCode,
      clientName,
      submittedAt,
    });
  } catch (error: any) {
    console.error("Submission API Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const caseCode = searchParams.get("caseCode") || "case-default";

    // Read all submissions from disk if available
    const backupDir = path.join(process.cwd(), "tmp", "submissions");
    let allSubmissions: any[] = [];

    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir).filter((f) => f.endsWith(".json"));
      allSubmissions = files.map((file) => {
        try {
          const content = fs.readFileSync(path.join(backupDir, file), "utf8");
          return JSON.parse(content);
        } catch {
          return null;
        }
      }).filter(Boolean);
    }

    return NextResponse.json({
      totalStored: allSubmissions.length,
      submissions: allSubmissions,
      memoryAnswers: memoryStore.answers[caseCode] || {},
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

