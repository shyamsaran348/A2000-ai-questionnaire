import { Resend } from "resend";
import { isMailConfigured, sendMail } from "./mailer";
import { submissionEmail } from "./email-templates";

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
  const recipient = process.env.NOTIFICATION_EMAIL || DEFAULT_TARGET_EMAIL;
  const clientName = params.clientName || "Valued Enterprise Client";
  const contactPerson = params.contactPerson || "Not specified";
  const email = params.email || "Not specified";
  const phone = params.phone || "Not specified";
  const submittedTime = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  const filename = params.filename || `${clientName.replace(/[^a-zA-Z0-9_-]/g, "_")}_${params.caseCode}.pdf`;
  const { subject, html: htmlBody, text } = submissionEmail({
    clientName,
    industry: params.industry,
    caseCode: params.caseCode,
    contactPerson,
    email,
    phone,
    submittedAt: submittedTime,
    hasPdf: !!params.pdfBase64,
  });

  // 1. Primary: SMTP (company mailbox or Gmail) via the shared mailer
  if (isMailConfigured()) {
    try {
      const info = await sendMail({
        to: recipient,
        subject,
        html: htmlBody,
        text,
        attachments: params.pdfBase64
          ? [{ filename, content: Buffer.from(params.pdfBase64, "base64"), contentType: "application/pdf" }]
          : [],
      });
      console.log(`[Email Service - ${info.provider}] Sent submission to ${recipient}. MessageId:`, info.messageId);
      return { success: true, provider: info.provider, recipient, messageId: info.messageId };
    } catch (err: any) {
      console.error("[Email Service] SMTP send failed:", err.message);
    }
  }

  // 2. Fallback: Resend API (if configured)
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "A2000 AI Enablement <onboarding@resend.dev>";

  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const attachments = [];
      if (params.pdfBase64) {
        attachments.push({
          filename,
          content: params.pdfBase64,
        });
      }

      const data = await resend.emails.send({
        from: fromEmail,
        to: [recipient],
        subject,
        html: htmlBody,
        text,
        attachments,
      });

      console.log(`[Email Service - Resend] Sent to ${recipient}:`, data);
      return {
        success: true,
        provider: "resend",
        recipient,
        data,
      };
    } catch (resendErr: any) {
      console.error("[Email Service - Resend] Failed to send via Resend:", resendErr.message);
    }
  }

  return {
    success: false,
    recipient,
    error: "No email provider credentials succeeded",
  };
}
