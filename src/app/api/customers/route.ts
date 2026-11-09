import { NextResponse } from "next/server";
import { sql, ensureTablesCreated } from "@/lib/db/neon";
import nodemailer from "nodemailer";

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
    const {
      companyName,
      website = "",
      industry,
      contactName,
      email,
      phone = "",
      sendEmail = false,
      customCode = "",
    } = body;

    if (!companyName || !industry || !contactName || !email) {
      return NextResponse.json(
        { error: "Company name, industry, contact name, and email are required" },
        { status: 400 }
      );
    }

    const id = generateCustomerId(companyName);
    const accessCode = customCode.trim() || generateAccessCode();
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://a2000-questionnaire.vercel.app";
    const portalUrl = `${origin}/portal/${id}`;

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
      const gmailUser = process.env.GMAIL_USER;
      const gmailPass = process.env.GMAIL_APP_PASSWORD;

      if (gmailUser && gmailPass) {
        try {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: gmailUser, pass: gmailPass },
          });

          const industryTitles: Record<string, string> = {
            hospital: "Hospital & Healthcare",
            finance: "Finance & FinTech",
            "food-and-beverage": "Food & Beverage",
            jewellery: "Jewellery & Retail",
          };

          const industryName = industryTitles[industry] || industry;

          await transporter.sendMail({
            from: `"A2000 | AI Enablement" <${gmailUser}>`,
            to: email,
            cc: "ramyadevi@a2000india.com",
            subject: `A2000 AI Enablement Discovery Assessment — Invitation for ${companyName}`,
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
                    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
                    .header { background: #17324D; padding: 24px; color: #ffffff; border-bottom: 3px solid #C97835; }
                    .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
                    .content { padding: 24px; line-height: 1.6; font-size: 14px; }
                    .keybox { background: #f1f5f9; border-left: 4px solid #C97835; padding: 14px 18px; margin: 20px 0; border-radius: 4px; }
                    .btn { display: inline-block; background: #17324D; color: #ffffff !important; text-decoration: none; padding: 12px 24px; font-weight: 600; border-radius: 6px; margin: 16px 0; }
                    .footer { padding: 16px 24px; background: #f8fafc; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; }
                  </style>
                </head>
                <body>
                  <div class="card">
                    <div class="header">
                      <h1>A2000 | AI ENABLEMENT</h1>
                      <p style="margin: 4px 0 0; font-size: 12px; color: #cbd5e1;">Enterprise Discovery Assessment</p>
                    </div>
                    <div class="content">
                      <p>Dear <strong>${contactName}</strong>,</p>
                      <p>A2000 has initiated a tailored <strong>${industryName}</strong> Discovery Assessment for <strong>${companyName}</strong>.</p>
                      <p>This assessment helps our consulting team evaluate operational bottlenecks, technology systems, and automation opportunities for your organization.</p>
                      
                      <div class="keybox">
                        <div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">Your Dedicated Access Details</div>
                        <div style="margin-top: 8px; font-size: 14px;"><strong>Portal Link:</strong> <a href="${portalUrl}" style="color: #17324D;">${portalUrl}</a></div>
                        <div style="margin-top: 4px; font-size: 14px;"><strong>Security Passcode:</strong> <code style="font-size: 16px; background: #ffffff; padding: 2px 8px; border-radius: 4px; border: 1px solid #cbd5e1; font-weight: bold; color: #C97835;">${accessCode}</code></div>
                      </div>

                      <div style="text-align: center;">
                        <a href="${portalUrl}" class="btn">Open Assessment Portal &rarr;</a>
                      </div>

                      <p style="font-size: 12px; color: #64748b;">
                        <em>Note: The questionnaire features automatic draft saving. You can complete it in multiple sessions and download an executive PDF copy upon submission.</em>
                      </p>
                    </div>
                    <div class="footer">
                      A2000 | AI Enablement • Confidential Client Assessment
                    </div>
                  </div>
                </body>
              </html>
            `,
          });
          emailSent = true;

          // Update invitation_sent status
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
