import { neon } from "@neondatabase/serverless";

const dbUrl = process.env.DATABASE_URL || "";
export const sql = neon(dbUrl);

// Initialize tables if they don't exist yet
export async function ensureTablesCreated() {
  if (!dbUrl) return;
  try {
    // 1. Master Submissions Table (All Industries)
    await sql`
      CREATE TABLE IF NOT EXISTS questionnaire_submissions (
        id TEXT PRIMARY KEY,
        case_code TEXT NOT NULL,
        industry TEXT NOT NULL,
        client_name TEXT NOT NULL,
        contact_person TEXT,
        email TEXT,
        phone TEXT,
        answers JSONB NOT NULL,
        pdf_sent BOOLEAN DEFAULT false,
        pdf_sent_to TEXT,
        submitted_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 2. Answers Table (Composite Primary Key per case_code & question_key)
    await sql`
      CREATE TABLE IF NOT EXISTS questionnaire_answers (
        case_code TEXT NOT NULL,
        question_key TEXT NOT NULL,
        value JSONB NOT NULL,
        custom_other TEXT,
        department TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (case_code, question_key)
      );
    `;

    // 3. Hospital answers table (backwards compatibility)
    await sql`
      CREATE TABLE IF NOT EXISTS hospital_questionnaire_answers (
        question_key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        department TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 4. Customers Table (Multi-tenant Client Management)
    await sql`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        company_name TEXT NOT NULL,
        website TEXT,
        industry TEXT NOT NULL,
        contact_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        access_code TEXT NOT NULL,
        status TEXT DEFAULT 'created',
        answers JSONB DEFAULT '{}'::jsonb,
        invitation_sent BOOLEAN DEFAULT false,
        invitation_sent_at TIMESTAMPTZ,
        last_active_at TIMESTAMPTZ DEFAULT NOW(),
        submitted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // A2000 staff copied on the customer's invitation emails (comma-separated).
    await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS staff_emails TEXT DEFAULT '';`;
  } catch (err: any) {
    console.error("Failed to initialize database tables:", err.message);
  }
}
