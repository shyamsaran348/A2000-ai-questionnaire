import { neon } from "@neondatabase/serverless";
import type { Pool } from "pg";

/**
 * Database access for the whole app: `sql\`SELECT ... ${value}\``.
 *
 * Works with any PostgreSQL database — only DATABASE_URL needs to change:
 *   - Neon (*.neon.tech)        → Neon's HTTP driver (best for Vercel serverless)
 *   - Anything else (AWS RDS / Aurora, Supabase, self-hosted)
 *                               → standard `pg` driver with a connection pool
 * Override the automatic choice with DB_DRIVER=neon-http | pg.
 */

type Row = Record<string, any>;
type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Row[]>;

const dbUrl = process.env.DATABASE_URL || "";
const driver = process.env.DB_DRIVER || (/\.neon\.tech/i.test(dbUrl) ? "neon-http" : "pg");

function createPgTag(): SqlTag {
  let pool: Pool | null = null;
  return async (strings, ...values) => {
    if (!pool) {
      const { Pool } = await import("pg");
      pool = new Pool({
        connectionString: dbUrl,
        max: Number(process.env.DB_POOL_MAX || 5),
        idleTimeoutMillis: 30_000,
      });
    }
    // Turn the template into a parameterised query: "... $1 ... $2".
    const text = strings.reduce((acc, part, i) => acc + part + (i < values.length ? `$${i + 1}` : ""), "");
    const result = await pool.query(text, values as unknown[]);
    return result.rows;
  };
}

export const sql: SqlTag = driver === "neon-http" ? (neon(dbUrl) as unknown as SqlTag) : createPgTag();

/**
 * Creates tables, columns and indexes if they are missing.
 * Runs once per server instance (not on every request) — schema checks were
 * previously adding several database round trips to every dashboard load.
 */
let schemaReady: Promise<void> | null = null;

export function ensureTablesCreated(): Promise<void> {
  if (!dbUrl) return Promise.resolve();
  if (!schemaReady) {
    schemaReady = createSchema().catch((err) => {
      console.error("Failed to initialize database tables:", err.message);
      schemaReady = null; // retry on the next request
    });
  }
  return schemaReady;
}

async function createSchema() {
  // 1. Master submissions table (all industries)
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

  // 2. Answers per case_code & question_key
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

  // 4. Customers (multi-tenant client management)
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

  // Indexes for the dashboard list (newest first), passcode lookups and submissions history.
  await sql`CREATE INDEX IF NOT EXISTS customers_created_at_idx ON customers (created_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS customers_access_code_idx ON customers (UPPER(access_code));`;
  await sql`CREATE INDEX IF NOT EXISTS submissions_case_code_idx ON questionnaire_submissions (case_code, submitted_at DESC);`;
}
