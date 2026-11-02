import { NextResponse } from "next/server";
import { sql, ensureTablesCreated } from "@/lib/db/neon";
import { memoryStore } from "@/lib/services/store";

export async function GET(request: Request) {
  const isNeonConfigured = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("postgres"));

  if (isNeonConfigured) {
    try {
      await ensureTablesCreated();
      const rows = await sql`
        SELECT question_key, value, department, updated_at 
        FROM hospital_questionnaire_answers
      `;

      const answers: Record<string, any> = {};
      rows.forEach((row: any) => {
        answers[row.question_key] = {
          value: row.value,
          department: row.department,
          updatedAt: row.updated_at,
        };
      });

      return NextResponse.json({ answers, storage: "neon-postgres" });
    } catch (e: any) {
      console.error("Neon fetch error, falling back to local memory:", e.message);
    }
  }

  // Fallback
  return NextResponse.json({
    answers: memoryStore.answers["case-default"] || {},
    storage: "local-memory",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { questionKey, value, department } = body;

    if (!questionKey) {
      return NextResponse.json({ error: "Missing questionKey" }, { status: 400 });
    }

    const isNeonConfigured = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("postgres"));

    if (isNeonConfigured) {
      try {
        await ensureTablesCreated();

        if (value === null || value === undefined) {
          // Deselected / Cleared
          await sql`
            DELETE FROM hospital_questionnaire_answers 
            WHERE question_key = ${questionKey}
          `;
        } else {
          // Upsert answer
          await sql`
            INSERT INTO hospital_questionnaire_answers (question_key, value, department, updated_at)
            VALUES (${questionKey}, ${JSON.stringify(value)}::jsonb, ${department || "General"}, NOW())
            ON CONFLICT (question_key) 
            DO UPDATE SET 
              value = EXCLUDED.value,
              department = EXCLUDED.department,
              updated_at = NOW();
          `;
        }

        return NextResponse.json({
          success: true,
          storage: "neon-postgres",
          savedAt: new Date().toISOString(),
        });
      } catch (err: any) {
        console.error("Neon write error:", err.message);
      }
    }

    // Memory fallback
    if (!memoryStore.answers["case-default"]) {
      memoryStore.answers["case-default"] = {};
    }

    if (value === null) {
      delete memoryStore.answers["case-default"][questionKey];
    } else {
      memoryStore.answers["case-default"][questionKey] = {
        value,
        department: department || "General",
        updatedAt: new Date().toISOString(),
      };
    }

    return NextResponse.json({
      success: true,
      storage: "local-memory",
      savedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
