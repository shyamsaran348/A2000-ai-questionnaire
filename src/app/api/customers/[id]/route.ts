import { NextResponse } from "next/server";
import { sql } from "@/lib/db/neon";
import nodemailer from "nodemailer";

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
      const gmailUser = process.env.GMAIL_USER;
      const gmailPass = process.env.GMAIL_APP_PASSWORD;

      if (!gmailUser || !gmailPass) {
        return NextResponse.json({ error: "Gmail SMTP not configured" }, { status: 500 });
      }

      const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://a2000-questionnaire.vercel.app";
      const portalUrl = `${origin}/portal/${id}`;

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass },
      });

      await transporter.sendMail({
        from: `"A2000 | AI Enablement" <${gmailUser}>`,
        to: customer.email,
        cc: "ramyadevi@a2000india.com",
        subject: `[Reminder] A2000 AI Enablement Assessment Portal for ${customer.company_name}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>A2000 | AI Enablement Discovery Assessment</h2>
            <p>Dear ${customer.contact_name},</p>
            <p>Here are your access details for your dedicated assessment portal:</p>
            <p><strong>Portal Link:</strong> <a href="${portalUrl}">${portalUrl}</a></p>
            <p><strong>Security Passcode:</strong> <code>${customer.access_code}</code></p>
          </div>
        `,
      });

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

