import nodemailer, { type Transporter } from "nodemailer";
import { A2000_LOGO_PNG_BASE64 } from "./logo-data";

/**
 * Single place that sends email.
 *
 * Deliverability: the From address must be the mailbox we authenticate as,
 * otherwise SPF/DKIM fail and mail lands in spam. Configure ONE of:
 *
 *   Company mailbox (recommended — mail comes from @a2000india.com via Zoho):
 *     SMTP_HOST=smtp.zoho.in  SMTP_PORT=465  SMTP_USER=assessments@a2000india.com  SMTP_PASS=<Zoho app password>
 *
 *   Gmail (current fallback):
 *     GMAIL_USER=<address>@gmail.com  GMAIL_APP_PASSWORD=<app password>
 *
 * Optional: MAIL_FROM_NAME (default "A2000 AI Enablement"), MAIL_REPLY_TO.
 */

export const LOGO_CID = "a2000-logo@a2000india.com";
export const DEFAULT_TEAM_EMAIL = "ramyadevi@a2000india.com";

interface MailConfig {
  transporter: Transporter;
  fromAddress: string;
  provider: "smtp" | "gmail";
}

function getMailConfig(): MailConfig | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (host && user && pass) {
    const port = Number(process.env.SMTP_PORT || 465);
    return {
      transporter: nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } }),
      fromAddress: user,
      provider: "smtp",
    };
  }

  const gUser = process.env.GMAIL_USER;
  const gPass = process.env.GMAIL_APP_PASSWORD;
  if (gUser && gPass) {
    return {
      transporter: nodemailer.createTransport({ service: "gmail", auth: { user: gUser, pass: gPass } }),
      fromAddress: gUser,
      provider: "gmail",
    };
  }
  return null;
}

export function isMailConfigured(): boolean {
  return getMailConfig() !== null;
}

export interface OutgoingMail {
  to: string | string[];
  cc?: string | string[];
  subject: string;
  html: string;
  text: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
}

export async function sendMail(mail: OutgoingMail) {
  const cfg = getMailConfig();
  if (!cfg) throw new Error("Email is not configured (set SMTP_* or GMAIL_* environment variables)");

  const fromName = process.env.MAIL_FROM_NAME || "A2000 AI Enablement";
  const replyTo = process.env.MAIL_REPLY_TO || process.env.NOTIFICATION_EMAIL || DEFAULT_TEAM_EMAIL;

  const info = await cfg.transporter.sendMail({
    from: { name: fromName, address: cfg.fromAddress },
    replyTo,
    to: mail.to,
    cc: mail.cc,
    subject: mail.subject,
    // Sending both versions (multipart/alternative) matters for spam scoring.
    text: mail.text,
    html: mail.html,
    attachments: [
      {
        filename: "a2000-logo.png",
        content: Buffer.from(A2000_LOGO_PNG_BASE64, "base64"),
        contentType: "image/png",
        cid: LOGO_CID,
        contentDisposition: "inline",
      },
      ...(mail.attachments ?? []),
    ],
  });

  return { messageId: info.messageId as string, provider: cfg.provider };
}

/** Public base URL for links in emails — never a localhost address. */
export function appOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  const origin = request.headers.get("origin") || "";
  const isLocal = /localhost|127\.0\.0\.1/.test(origin);
  if (origin && !isLocal) return origin;
  return configured || origin || "https://a2000-questionnaire.vercel.app";
}
