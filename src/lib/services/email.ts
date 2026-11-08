import { Resend } from "resend";

const DEFAULT_TARGET_EMAIL = "ramyadevi@a2000india.com";

interface SendSubmissionEmailParams {
  caseCode: string;
  industry: string;
  clientName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  answers: Record<string, any>;
  pdfBase64?: string;
  filename?: string;
}

export async function sendSubmissionNotification(params: SendSubmissionEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.NOTIFICATION_EMAIL || DEFAULT_TARGET_EMAIL;
  const fromEmail = process.env.EMAIL_FROM || "A2000 AI Enablement <onboarding@resend.dev>";

  const clientName = params.clientName || "Valued Enterprise Client";
  const contactPerson = params.contactPerson || "Not specified";
  const email = params.email || "Not specified";
  const phone = params.phone || "Not specified";
  const submittedTime = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  const subject = `[A2000 Discovery] New ${params.industry} Submission: ${clientName} (${params.caseCode})`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: #17324D; color: #ffffff; padding: 24px; border-bottom: 3px solid #C97835; }
          .header h1 { margin: 0 0 6px 0; font-size: 18px; font-weight: 700; letter-spacing: 0.5px; }
          .header p { margin: 0; font-size: 13px; color: #cbd5e1; }
          .badge { display: inline-block; background: rgba(255, 255, 255, 0.15); color: #f1f5f9; font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; float: right; }
          .content { padding: 24px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin-bottom: 20px; }
          .card-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 12px; }
          .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #edf2f7; font-size: 13px; }
          .row:last-child { border-bottom: none; }
          .label { color: #64748b; font-weight: 500; }
          .val { color: #0f172a; font-weight: 600; text-align: right; }
          .notice { background: #eff6ff; border-left: 4px solid #2563eb; padding: 12px; font-size: 13px; color: #1e40af; border-radius: 4px; margin-bottom: 20px; }
          .footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="badge">CONFIDENTIAL</span>
            <h1>A2000 | AI Enablement</h1>
            <p>New Discovery Questionnaire Submission</p>
          </div>
          <div class="content">
            <div class="notice">
              <strong>Notice:</strong> A new questionnaire response has been submitted and stored in the database. The complete executive report is attached as a PDF.
            </div>
            
            <div class="card">
              <div class="card-title">Submission Details</div>
              <div class="row"><span class="label">Client / Organization:</span><span class="val">${clientName}</span></div>
              <div class="row"><span class="label">Industry:</span><span class="val">${params.industry}</span></div>
              <div class="row"><span class="label">Case Code:</span><span class="val">${params.caseCode}</span></div>
              <div class="row"><span class="label">Contact Person:</span><span class="val">${contactPerson}</span></div>
              <div class="row"><span class="label">Email:</span><span class="val">${email}</span></div>
              <div class="row"><span class="label">Phone:</span><span class="val">${phone}</span></div>
              <div class="row"><span class="label">Submitted At:</span><span class="val">${submittedTime} IST</span></div>
            </div>

            <p style="font-size: 13px; color: #475569; line-height: 1.5;">
              Please find the attached PDF containing all section responses, operational details, and priority ratings.
            </p>
          </div>
          <div class="footer">
            A2000 | AI Enablement • Automatic Assessment Dispatch System<br />
            Recipient: ${recipient}
          </div>
        </div>
      </body>
    </html>
  `;

  // Prepare attachment if base64 provided
  const attachments = [];
  if (params.pdfBase64) {
    const filename = params.filename || `${clientName.replace(/[^a-zA-Z0-9_-]/g, "_")}_${params.caseCode}.pdf`;
    attachments.push({
      filename,
      content: params.pdfBase64,
    });
  }

  if (!apiKey) {
    console.warn(
      `[Email Service] RESEND_API_KEY is not set. Simulated sending submission email to: ${recipient}. Subject: "${subject}"`
    );
    return {
      success: false,
      simulated: true,
      recipient,
      message: "RESEND_API_KEY not configured. Submission saved to database and ready for dispatch.",
    };
  }

  try {
    const resend = new Resend(apiKey);
    const data = await resend.emails.send({
      from: fromEmail,
      to: [recipient],
      subject,
      html: htmlBody,
      attachments,
    });

    console.log(`[Email Service] Successfully sent questionnaire PDF to ${recipient}. Resend ID:`, data);
    return {
      success: true,
      recipient,
      data,
    };
  } catch (err: any) {
    console.error("[Email Service] Failed to send email via Resend:", err.message);
    return {
      success: false,
      error: err.message,
      recipient,
    };
  }
}
