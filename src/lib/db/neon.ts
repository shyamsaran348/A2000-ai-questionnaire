import { neon } from "@neondatabase/serverless";

const dbUrl = process.env.DATABASE_URL || "";
export const sql = neon(dbUrl);

// Initialize tables if they don't exist yet
export async function ensureTablesCreated() {
  if (!dbUrl) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS hospital_questionnaire_answers (
        question_key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        department TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
  } catch (err) {
    console.error("Failed to initialize database tables:", err);
  }
}
