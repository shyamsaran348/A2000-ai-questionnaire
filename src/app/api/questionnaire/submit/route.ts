import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { sql, ensureTablesCreated } from "@/lib/db/neon";
import { memoryStore } from "@/lib/services/store";
import { sendSubmissionNotification } from "@/lib/services/email";
import { INDUSTRIES } from "@/lib/data/industries";
import { validateEmail, validatePhone, validateQuestionnaire } from "@/lib/validation";

// Ensure DB tables are created once per cold-start, not on every request
let tablesReady = false;

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
      pdfBase64,
      filename,
      submittedAt = new Date().toISOString(),
    } = body;

    if (!caseCode || !answers || typeof answers !== "object") {
      return NextResponse.json({ error: "Missing required fields: caseCode and answers" }, { status: 400 });
    }

    // Enforce the same rules as the browser (required answers, email/phone/website formats).
    const industryConfig = INDUSTRIES.find((i) => i.caseCode === caseCode);
    if (industryConfig) {
      const fieldErrors = validateQuestionnaire(industryConfig.sections, answers);
      if (Object.keys(fieldErrors).length > 0) {
        return NextResponse.json(
          { error: "Some answers are missing or invalid. Please review the highlighted questions.", fieldErrors },
          { status: 400 }
        );
      }
    }
    // Portal submissions carry contact details from the staff-created record; standalone
    // pages send what the client typed, so check those.
    if (!body.customerId) {
      if (typeof email === "string" && validateEmail(email)) {
        return NextResponse.json({ error: "The contact email address is not valid." }, { status: 400 });
      }
      if (typeof phone === "string" && validatePhone(phone)) {
        return NextResponse.json({ error: "The contact phone number is not valid." }, { status: 400 });
      }
    }

    const safeClientName = clientName || "Valued Enterprise Client";
    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const targetRecipient = process.env.NOTIFICATION_EMAIL || "ramyadevi@a2000india.com";

    const submissionRecord = {
      id: submissionId,
      caseCode,
      industry: industry || "General",
      clientName: safeClientName,
      contactPerson: contactPerson || answers?.contact_person?.value || "",
      email: email || answers?.email?.value || "",
      phone: phone || answers?.phone?.value || "",
      answers,
      pdfSent: false,
      pdfSentTo: targetRecipient,
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

    // 2. Local Disk Backup (JSON and PDF file storage)
    // On Vercel, process.cwd() is read-only; /tmp is writable on all platforms.
    try {
      const backupDir = path.join("/tmp", "submissions");
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      // Save JSON
      const jsonFilePath = path.join(backupDir, `${caseCode}_${Date.now()}.json`);
      fs.writeFileSync(jsonFilePath, JSON.stringify(submissionRecord, null, 2), "utf8");

      // Save PDF if base64 provided
      if (pdfBase64) {
        const safeBaseName = safeClientName.replace(/[^a-zA-Z0-9_-]/g, "_");
        const pdfFilePath = path.join(backupDir, `${safeBaseName}_${caseCode}_${Date.now()}.pdf`);
        fs.writeFileSync(pdfFilePath, Buffer.from(pdfBase64, "base64"));
      }
    } catch (fsErr: any) {
      console.warn("Local disk backup warning:", fsErr.message);
    }

    // 3. PostgreSQL / Neon persistence
    let storedInDb = false;
    const isNeonConfigured = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("postgres"));

    if (isNeonConfigured) {
      try {
        if (!tablesReady) {
          await ensureTablesCreated();
          tablesReady = true;
        }

        // 3a. Insert master submission record
        await sql`
          INSERT INTO questionnaire_submissions (
            id,
            case_code,
            industry,
            client_name,
            contact_person,
            email,
            phone,
            answers,
            pdf_sent,
            pdf_sent_to,
            submitted_at,
            created_at
          ) VALUES (
            ${submissionId},
            ${caseCode},
            ${industry || "General"},
            ${safeClientName},
            ${contactPerson || answers?.contact_person?.value || ""},
            ${email || answers?.email?.value || ""},
            ${phone || answers?.phone?.value || ""},
            ${JSON.stringify(answers)}::jsonb,
            false,
            ${targetRecipient},
            ${submittedAt}::timestamptz,
            NOW()
          );
        `;

        // 3b. Upsert question answers into questionnaire_answers
        for (const [qKey, valObj] of Object.entries(answers)) {
          const v = (valObj as any)?.value !== undefined ? (valObj as any).value : valObj;
          const customOther = (valObj as any)?.customOther || null;
          const dept = (valObj as any)?.department || "General";

          await sql`
            INSERT INTO questionnaire_answers (
              case_code,
              question_key,
              value,
              custom_other,
              department,
              updated_at
            ) VALUES (
              ${caseCode},
              ${qKey},
              ${JSON.stringify(v)}::jsonb,
              ${customOther},
              ${dept},
              NOW()
            )
            ON CONFLICT (case_code, question_key)
            DO UPDATE SET
              value = EXCLUDED.value,
              custom_other = EXCLUDED.custom_other,
              department = EXCLUDED.department,
              updated_at = NOW();
          `;
        }

        // 3c. If Hospital case, keep backwards compatibility with hospital_questionnaire_answers
        if (caseCode === "A2000-HOSPITAL") {
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
        }

        // 3d. Update customer record if this submission belongs to a managed customer
        const customerId = body.customerId;
        if (customerId) {
          await sql`
            UPDATE customers
            SET status = 'submitted',
                answers = ${JSON.stringify(answers)}::jsonb,
                submitted_at = NOW(),
                last_active_at = NOW()
            WHERE id = ${customerId};
          `;
        }

        storedInDb = true;
      } catch (dbErr: any) {
        console.error("PostgreSQL database save error:", dbErr.message);
      }
    }

    // 4. Email Notification with attached PDF to ramyadevi@a2000india.com
    const emailResult = await sendSubmissionNotification({
      caseCode,
      industry: industry || "General",
      clientName: safeClientName,
      contactPerson: contactPerson || answers?.contact_person?.value || "",
      email: email || answers?.email?.value || "",
      phone: phone || answers?.phone?.value || "",
      answers,
      pdfBase64,
      filename,
    });

    // 5. Update pdf_sent status in DB if email was sent
    if (storedInDb && emailResult.success) {
      try {
        await sql`
          UPDATE questionnaire_submissions
          SET pdf_sent = true, pdf_sent_to = ${emailResult.recipient}
          WHERE id = ${submissionId};
        `;
      } catch (e: any) {
        console.warn("Failed to update pdf_sent status:", e.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Questionnaire submitted successfully! Stored in database${
        emailResult.success ? ` and sent to ${targetRecipient}` : ""
      }.`,
      submissionId,
      caseCode,
      clientName: safeClientName,
      storedInDb,
      emailResult,
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
    const caseCode = searchParams.get("caseCode");

    const isNeonConfigured = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("postgres"));

    if (isNeonConfigured) {
      try {
        if (!tablesReady) {
          await ensureTablesCreated();
          tablesReady = true;
        }
        let rows;
        if (caseCode) {
          rows = await sql`
            SELECT id, case_code, industry, client_name, contact_person, email, phone, pdf_sent, pdf_sent_to, submitted_at, created_at
            FROM questionnaire_submissions
            WHERE case_code = ${caseCode}
            ORDER BY submitted_at DESC
          `;
        } else {
          rows = await sql`
            SELECT id, case_code, industry, client_name, contact_person, email, phone, pdf_sent, pdf_sent_to, submitted_at, created_at
            FROM questionnaire_submissions
            ORDER BY submitted_at DESC
          `;
        }
        return NextResponse.json({
          source: "neon-postgres",
          total: rows.length,
          submissions: rows,
        });
      } catch (err: any) {
        console.warn("Neon read error, falling back to disk/memory:", err.message);
      }
    }

    // Fallback: Read JSON submissions from disk
    const backupDir = path.join(process.cwd(), "tmp", "submissions");
    let allSubmissions: any[] = [];

    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir).filter((f) => f.endsWith(".json"));
      allSubmissions = files
        .map((file) => {
          try {
            const content = fs.readFileSync(path.join(backupDir, file), "utf8");
            return JSON.parse(content);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    }

    return NextResponse.json({
      source: "disk-json",
      total: allSubmissions.length,
      submissions: allSubmissions,
      memoryAnswers: caseCode ? memoryStore.answers[caseCode] || {} : memoryStore.answers,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
