import { clientIp, grantPortal, hasPortalAccess, isStaff, recordFailure, clearFailures, tooManyAttempts, unauthorized } from "@/lib/auth";
import { NextResponse } from "next/server";
import { sql, ensureTablesCreated } from "@/lib/db/neon";
import { getIndustry } from "@/lib/data/industries";
import { appOrigin, internalCc, isMailConfigured, sendMail } from "@/lib/services/mailer";
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
        industry,
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

    // Answers are only returned to the client who entered the passcode, or to A2000 staff.
    const unlocked = isStaff(request) || hasPortalAccess(request, customer.id);
    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        companyName: customer.company_name,
        industry: customer.industry,
        status: customer.status,
        unlocked,
        answers: unlocked ? customer.answers || {} : {},
        submittedAt: customer.submitted_at,
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
    const { action, accessCode, answers } = body;

    const rows = await sql`
      SELECT id, access_code, status, company_name, industry, contact_name, email, phone, staff_emails
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
      // Limit guessing: 10 wrong passcodes per link and per visitor every 15 minutes.
      const linkKey = `portal:${id}`;
      const ipKey = `portal-ip:${clientIp(request)}`;
      if (tooManyAttempts(linkKey) || tooManyAttempts(ipKey, 30)) {
        return NextResponse.json(
          { success: false, error: "Too many incorrect attempts. Please wait 15 minutes and try again." },
          { status: 429 }
        );
      }
      const isMatch = customer.access_code.toUpperCase().trim() === String(accessCode || "").toUpperCase().trim();
      if (!isMatch) {
        recordFailure(linkKey);
        recordFailure(ipKey);
        return NextResponse.json({ success: false, error: "That passcode is incorrect. Check your invitation email and try again." }, { status: 401 });
      }
      clearFailures(linkKey);

      await sql`
        UPDATE customers
        SET last_active_at = NOW(),
            status = CASE WHEN status = 'created' THEN 'in_progress' ELSE status END
        WHERE id = ${id};
      `;

      const res = NextResponse.json({ success: true, authorized: true });
      grantPortal(res, request, id);
      return res;
    }

    // 2. Autosave Answers Action
    if (action === "autosave") {
      if (!hasPortalAccess(request, id)) return unauthorized("Your session has expired. Please enter your passcode again.");
      if (customer.status === "submitted") {
        return NextResponse.json({ success: false, error: "This assessment has already been submitted." }, { status: 409 });
      }
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
      if (!isStaff(request)) return unauthorized();
      await ensureTablesCreated(); // guarantees the staff_emails column exists
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
      await sendMail({ to: customer.email, cc: internalCc(customer.staff_emails, customer.email), ...mail });

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

