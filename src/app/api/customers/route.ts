import { NextResponse } from "next/server";
import { sql, ensureTablesCreated } from "@/lib/db/neon";
import { normalizePhone, normalizeWebsite, validateCustomer } from "@/lib/validation";
import { getIndustry } from "@/lib/data/industries";
import { appOrigin, DEFAULT_TEAM_EMAIL, isMailConfigured, sendMail } from "@/lib/services/mailer";
import { invitationEmail } from "@/lib/services/email-templates";

function generateAccessCode(): string {
  // e.g. A2K-7842
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `A2K-${digits}`;
}

function generateCustomerId(companyName: string): string {
  const clean = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 16);
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${clean}-${randomSuffix}`;
}

// GET: List all customers
export async function GET(request: Request) {
  try {
    await ensureTablesCreated();
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
        invitation_sent,
        invitation_sent_at,
        last_active_at,
        submitted_at,
        created_at,
        jsonb_typeof(answers) AS answers_type,
        CASE 
          WHEN answers IS NULL THEN 0
          ELSE (SELECT count(*) FROM jsonb_object_keys(answers))
        END AS answered_questions_count
      FROM customers
      ORDER BY created_at DESC;
    `;
    return NextResponse.json({ success: true, customers: rows });
  } catch (error: any) {
    console.error("Failed to fetch customers:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a new customer and optionally send invitation email
export async function POST(request: Request) {
  try {
    await ensureTablesCreated();
    const body = await request.json();
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const input = {
      companyName: str(body.companyName),
      website: str(body.website),
      industry: str(body.industry),
      contactName: str(body.contactName),
      email: str(body.email).toLowerCase(),
      phone: str(body.phone),
      customCode: str(body.customCode).toUpperCase(),
    };
    const sendEmail = body.sendEmail === true;

    const fieldErrors = validateCustomer(input);
    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        { error: "Please correct the highlighted fields.", fieldErrors },
        { status: 400 }
      );
    }

    const { companyName, industry, contactName, email } = input;
    const website = normalizeWebsite(input.website);
    const phone = normalizePhone(input.phone);

    let accessCode = input.customCode;
    if (accessCode) {
      const taken = await sql`SELECT 1 FROM customers WHERE UPPER(access_code) = ${accessCode} LIMIT 1;`;
      if (taken.length > 0) {
        return NextResponse.json(
          { error: "That passcode is already in use.", fieldErrors: { customCode: "This passcode is already assigned to another customer." } },
          { status: 409 }
        );
      }
    } else {
      accessCode = generateAccessCode();
    }

    const id = generateCustomerId(companyName);
    const portalUrl = `${appOrigin(request)}/portal/${id}`;

    // Insert to DB
    await sql`
      INSERT INTO customers (
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
        created_at
      ) VALUES (
        ${id},
        ${companyName},
        ${website},
        ${industry},
        ${contactName},
        ${email},
        ${phone},
        ${accessCode},
        'created',
        '{}'::jsonb,
        NOW()
      );
    `;

    let emailSent = false;
    let emailError = null;

    // Send invitation email if requested
    if (sendEmail) {
      if (!isMailConfigured()) {
        emailError = "Email is not configured on the server";
      } else {
        try {
          const mail = invitationEmail({
            contactName,
            companyName,
            industryName: getIndustry(industry).name,
            portalUrl,
            accessCode,
          });
          await sendMail({ to: email, cc: process.env.NOTIFICATION_EMAIL || DEFAULT_TEAM_EMAIL, ...mail });
          emailSent = true;

          await sql`
            UPDATE customers
            SET invitation_sent = true, invitation_sent_at = NOW()
            WHERE id = ${id};
          `;
        } catch (mailErr: any) {
          console.error("Failed to send customer invite email:", mailErr);
          emailError = mailErr.message;
        }
      }
    }

    return NextResponse.json({
      success: true,
      customer: {
        id,
        companyName,
        industry,
        contactName,
        email,
        accessCode,
        portalUrl,
        emailSent,
        emailError,
      },
    });
  } catch (error: any) {
    console.error("Customer creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

