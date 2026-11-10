import { escapeHtml } from "@/lib/html";
import { LOGO_CID } from "./mailer";

/*
 * Email templates. Written for email clients, not browsers:
 * table layout, inline styles, system fonts, no background images,
 * logo attached inline (cid:) so it shows without "load images".
 */

const NAVY = "#1B3F5C";
const BLUE = "#0C6CA8";
const TEXT = "#334155";
const MUTED = "#64748b";
const FONT = "Arial, 'Helvetica Neue', Helvetica, sans-serif";

interface Rendered {
  subject: string;
  html: string;
  text: string;
}

function layout({ preheader, body, footerNote }: { preheader: string; body: string; footerNote: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>A2000 AI Enablement</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f5f7;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f5f7;">
  <tr>
    <td align="center" style="padding:32px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:6px;">
        <tr>
          <td style="padding:28px 40px 22px 40px;border-bottom:3px solid ${BLUE};">
            <img src="cid:${LOGO_CID}" width="150" height="47" alt="A2000" style="display:block;border:0;outline:none;text-decoration:none;width:150px;height:auto;">
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px 8px 40px;font-family:${FONT};font-size:15px;line-height:24px;color:${TEXT};">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 40px 32px 40px;font-family:${FONT};font-size:15px;line-height:24px;color:${TEXT};">
            Regards,<br>
            <strong style="color:${NAVY};">A2000 AI Enablement Team</strong>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 6px 6px;font-family:${FONT};font-size:12px;line-height:18px;color:${MUTED};">
            A2000 &middot; We are about solutions &middot; <a href="https://a2000india.com" style="color:${MUTED};text-decoration:underline;">a2000india.com</a><br>
            ${footerNote}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function detailsTable(rows: [string, string][]): string {
  const tr = rows
    .map(
      ([k, v], i) => `<tr>
        <td style="padding:10px 16px;${i ? "border-top:1px solid #e2e8f0;" : ""}font-family:${FONT};font-size:14px;color:${MUTED};width:38%;vertical-align:top;">${escapeHtml(k)}</td>
        <td style="padding:10px 16px;${i ? "border-top:1px solid #e2e8f0;" : ""}font-family:${FONT};font-size:14px;color:#0f172a;font-weight:bold;vertical-align:top;">${v}</td>
      </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;">${tr}</table>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px 0;">
    <tr>
      <td align="center" bgcolor="${BLUE}" style="border-radius:4px;">
        <a href="${escapeHtml(href)}" target="_blank" style="display:inline-block;padding:12px 26px;font-family:${FONT};font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:4px;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}

const p = (html: string) => `<p style="margin:0 0 16px 0;">${html}</p>`;

// ---------------------------------------------------------------------------
// Client invitation (new and resent)
// ---------------------------------------------------------------------------

export function invitationEmail(opts: {
  contactName: string;
  companyName: string;
  industryName: string;
  portalUrl: string;
  accessCode: string;
  isReminder?: boolean;
}): Rendered {
  const { contactName, companyName, industryName, portalUrl, accessCode, isReminder } = opts;
  const subject = isReminder
    ? `Your AI Enablement assessment link for ${companyName}`
    : `Invitation: AI Enablement discovery assessment for ${companyName}`;

  const intro = isReminder
    ? `As requested, here are the access details for the ${escapeHtml(industryName)} discovery assessment for <strong>${escapeHtml(companyName)}</strong>.`
    : `As part of A2000&rsquo;s AI Enablement engagement, we have prepared a ${escapeHtml(industryName)} discovery assessment for <strong>${escapeHtml(companyName)}</strong>.`;

  const body = `
    <h1 style="margin:0 0 20px 0;font-family:${FONT};font-size:20px;line-height:28px;color:${NAVY};font-weight:bold;">AI Enablement Discovery Assessment</h1>
    ${p(`Dear ${escapeHtml(contactName)},`)}
    ${p(intro)}
    ${isReminder ? "" : p("The assessment helps our consultants understand your operations, systems and priorities so we can identify where AI can add the most value. Your answers are saved automatically, so you can complete it over more than one sitting.")}
    ${detailsTable([
      ["Assessment link", `<a href="${escapeHtml(portalUrl)}" style="color:${BLUE};text-decoration:underline;font-weight:normal;word-break:break-all;">${escapeHtml(portalUrl)}</a>`],
      ["Access passcode", `<span style="font-family:'Courier New',Courier,monospace;font-size:16px;letter-spacing:1px;color:${NAVY};">${escapeHtml(accessCode)}</span>`],
    ])}
    ${button(portalUrl, "Open the assessment")}
    ${p("Please keep the passcode confidential. If you have any questions, simply reply to this email and our team will be happy to help.")}
  `;

  const text = [
    `Dear ${contactName},`,
    "",
    isReminder
      ? `As requested, here are the access details for the ${industryName} discovery assessment for ${companyName}.`
      : `As part of A2000's AI Enablement engagement, we have prepared a ${industryName} discovery assessment for ${companyName}.`,
    "",
    ...(isReminder
      ? []
      : [
          "The assessment helps our consultants understand your operations, systems and priorities so we can identify where AI can add the most value. Your answers are saved automatically, so you can complete it over more than one sitting.",
          "",
        ]),
    `Assessment link: ${portalUrl}`,
    `Access passcode: ${accessCode}`,
    "",
    "Please keep the passcode confidential. If you have any questions, simply reply to this email.",
    "",
    "Regards,",
    "A2000 AI Enablement Team",
    "https://a2000india.com",
  ].join("\n");

  return {
    subject,
    html: layout({
      preheader: `Your private assessment link and passcode for ${companyName}.`,
      body,
      footerNote: `This email was sent to ${escapeHtml(contactName)} because A2000 set up an assessment for ${escapeHtml(companyName)}.`,
    }),
    text,
  };
}

// ---------------------------------------------------------------------------
// Internal notification when a client submits
// ---------------------------------------------------------------------------

export function submissionEmail(opts: {
  clientName: string;
  industry: string;
  caseCode: string;
  contactPerson: string;
  email: string;
  phone: string;
  submittedAt: string;
  hasPdf: boolean;
}): Rendered {
  const o = opts;
  const subject = `Assessment submitted: ${o.clientName} (${o.industry})`;
  const rows: [string, string][] = [
    ["Organisation", escapeHtml(o.clientName)],
    ["Assessment", escapeHtml(o.industry)],
    ["Reference", escapeHtml(o.caseCode)],
    ["Contact person", escapeHtml(o.contactPerson)],
    ["Email", escapeHtml(o.email)],
    ["Phone", escapeHtml(o.phone)],
    ["Submitted", `${escapeHtml(o.submittedAt)} IST`],
  ];

  const body = `
    <h1 style="margin:0 0 20px 0;font-family:${FONT};font-size:20px;line-height:28px;color:${NAVY};font-weight:bold;">New assessment submission</h1>
    ${p(`<strong>${escapeHtml(o.clientName)}</strong> has submitted their AI Enablement discovery assessment. The responses have been saved to the assessment database.`)}
    ${detailsTable(rows)}
    ${p(o.hasPdf ? "The full set of responses is attached as a PDF." : "No PDF was attached to this submission; the responses are available in the dashboard.")}
  `;

  const text = [
    `${o.clientName} has submitted their AI Enablement discovery assessment. The responses have been saved to the assessment database.`,
    "",
    `Organisation: ${o.clientName}`,
    `Assessment: ${o.industry}`,
    `Reference: ${o.caseCode}`,
    `Contact person: ${o.contactPerson}`,
    `Email: ${o.email}`,
    `Phone: ${o.phone}`,
    `Submitted: ${o.submittedAt} IST`,
    "",
    o.hasPdf ? "The full set of responses is attached as a PDF." : "No PDF was attached to this submission.",
    "",
    "A2000 AI Enablement",
  ].join("\n");

  return {
    subject,
    html: layout({
      preheader: `${o.clientName} has submitted their discovery assessment.`,
      body,
      footerNote: "Internal notification from the A2000 AI Enablement assessment system.",
    }),
    text,
  };
}
