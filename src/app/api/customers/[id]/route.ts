import { NextResponse } from "next/server";
import { sql } from "@/lib/db/neon";
import { getIndustry } from "@/lib/data/industries";
import { appOrigin, DEFAULT_TEAM_EMAIL, isMailConfigured, sendMail } from "@/lib/services/mailer";
import { invitationEmail } from "@/lib/services/email-templates";

// GET: Fetch customer details and saved answers for their portal
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rows = await sql`
      SELECT 
        id,
        company_name,
        website,
        industry,
        contact_name,
        email,
        phone,
        access_code,
        status,
        answers,
        submitted_at
      FROM customers
      WHERE id = ${id}
      LIMIT 1;
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Customer assessment portal not found" }, { status: 404 });
    }

    const customer = rows[0];

    // Return sanitized data (don't reveal raw code over public unauthenticated API without challenge)
    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        companyName: customer.company_name,
        website: customer.website,
        industry: customer.industry,
        contactName: customer.contact_name,
        email: customer.email,
        phone: customer.phone,
        status: customer.status,
        answers: customer.answers || {},
        submittedAt: customer.submitted_at,
        // We include whether code is configured (for validation challenge)
        codeLength: customer.access_code ? customer.access_code.length : 0,
      },
    });
  } catch (error: any) {
    console.error("Portal fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Verify access code OR update answers (autosave/submit)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, accessCode, answers, isSubmitted } = body;

    const rows = await sql`
      SELECT id, access_code, status, company_name, industry, contact_name, email, phone
      FROM customers
      WHERE id = ${id}
      LIMIT 1;
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const customer = rows[0];

    // 1. Verify Passcode Action
    if (action === "verify_code") {
      const isMatch = customer.access_code.toUpperCase().trim() === (accessCode || "").toUpperCase().trim();
      if (!isMatch) {
        return NextResponse.json({ success: false, error: "Invalid security passcode" }, { status: 401 });
      }

      await sql`
        UPDATE customers
        SET last_active_at = NOW(),
            status = CASE WHEN status = 'created' THEN 'in_progress' ELSE status END
        WHERE id = ${id};
      `;

      return NextResponse.json({ success: true, authorized: true });
    }

    // 2. Autosave Answers Action
    if (action === "autosave") {
      await sql`
        UPDATE customers
        SET answers = ${JSON.stringify(answers || {})}::jsonb,
            last_active_at = NOW(),
            status = CASE WHEN status = 'created' THEN 'in_progress' ELSE status END
        WHERE id = ${id};
      `;
      return NextResponse.json({ success: true, message: "Draft saved" });
    }

    // 3. Resend Invite Email Action (staff triggered)
    if (action === "resend_invite") {
      if (!isMailConfigured()) {
        return NextResponse.json({ error: "Email is not configured on the server" }, { status: 500 });
      }

      const portalUrl = `${appOrigin(request)}/portal/${id}`;
      const mail = invitationEmail({
        contactName: customer.contact_name,
        companyName: customer.company_name,
        industryName: getIndustry(customer.industry).name,
        portalUrl,
        accessCode: customer.access_code,
        isReminder: true,
      });
      await sendMail({ to: customer.email, cc: process.env.NOTIFICATION_EMAIL || DEFAULT_TEAM_EMAIL, ...mail });

      await sql`
        UPDATE customers
        SET invitation_sent = true, invitation_sent_at = NOW()
        WHERE id = ${id};
      `;

      return NextResponse.json({ success: true, message: "Invitation resent" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Portal API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

