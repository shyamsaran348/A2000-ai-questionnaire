import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SectionDefinition } from "@/lib/data/hospital-seed";
import { A2000_LOGO_PNG_BASE64 } from "./logo-data";

interface PdfExportParams {
  caseCode: string;
  clientName: string;
  industry: string;
  answers: Record<string, any>;
  sections: SectionDefinition[];
  /** When the client submitted; defaults to now. */
  submittedAt?: string;
}

export const SERVICE_NAME = "A2000 AI Enablement Service";
export const COMPANY_NAME = "A2000 Group";

export function generateA2000Pdf(params: PdfExportParams): { doc: jsPDF; filename: string; base64: string } {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const primaryNavy = [27, 63, 92]; // #1B3F5C
  const accentBlue = [12, 108, 168]; // #0C6CA8
  const charcoal = [30, 41, 59];
  const muted = [100, 116, 139];
  const rule = [203, 213, 225];
  const PAGE_W = 210;
  const PAGE_H = 297;
  const M = 14;

  const submittedOn = (params.submittedAt ? new Date(params.submittedAt) : new Date()).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

  // ---- First-page header: logo, confidential mark, title block
  doc.addImage(A2000_LOGO_PNG_BASE64, "PNG", M, 12, 42, 12.46);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(muted[0], muted[1], muted[2]);
  doc.text("CONFIDENTIAL", PAGE_W - M, 16, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text(`Ref: ${params.caseCode}`, PAGE_W - M, 20.5, { align: "right" });
  doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
  doc.rect(M, 29, PAGE_W - 2 * M, 0.8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
  doc.text(SERVICE_NAME.toUpperCase(), M, 39);

  doc.setFontSize(16);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  const titleLines: string[] = doc.splitTextToSize(params.industry, PAGE_W - 2 * M);
  let y = 46.5;
  titleLines.forEach((l) => {
    doc.text(l, M, y);
    y += 7;
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(muted[0], muted[1], muted[2]);
  doc.text("Submitted responses", M, y);
  y += 8;

  // Details block
  const details: [string, string][] = [
    ["Organisation", params.clientName],
    ["Reference", params.caseCode],
    ["Submitted on", submittedOn],
  ];
  doc.setFontSize(9);
  details.forEach(([k, v]) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(muted[0], muted[1], muted[2]);
    doc.text(k, M, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
    doc.text(v, M + 32, y);
    y += 5.5;
  });

  const startY = y + 3;

  // Build Table of Responses dynamically from the passed-in sections
  const tableRows: any[] = [];

  params.sections.forEach((sec) => {
    // Section divider row
    tableRows.push([
      {
        content: `${sec.title.toUpperCase()} (Scope: ${sec.defaultDepartment})`,
        colSpan: 2,
        styles: {
          fillColor: [240, 244, 248],
          textColor: primaryNavy,
          fontStyle: "bold",
        },
      },
    ]);

    sec.questions.forEach((q, idx) => {
      const stored = params.answers[q.key];
      let answerText = "— (Not filled) —";

      if (stored) {
        const val = stored.value !== undefined ? stored.value : stored;
        if (val !== undefined && val !== null) {
          if (Array.isArray(val)) {
            let items = [...val];
            if (stored.customOther) {
              items = items.map((item) => (item === "Other" ? `Other: ${stored.customOther}` : item));
            }
            answerText = items.join(", ");
          } else if (typeof val === "object") {
            const pairs = Object.entries(val).map(([k, v]) => `${k}: ${v}/5`);
            answerText = pairs.length > 0 ? pairs.join("\n") : "—";
          } else {
            let str = String(val).replace(/₹/g, "Rs. ");
            if (str === "Other" && stored.customOther) {
              str = `Other: ${stored.customOther}`;
            }
            answerText = str;
          }
        }
      }

      tableRows.push([
        `${sec.number}.${idx + 1} ${q.label}`,
        answerText,
      ]);
    });
  });

  autoTable(doc, {
    startY: startY,
    head: [["Question / Topic", "Submitted Details"]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: [primaryNavy[0], primaryNavy[1], primaryNavy[2]],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [40, 40, 40],
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 92 },
    },
    margin: { top: 26, bottom: 20, left: M, right: M },
  });

  // ---- Running header (pages 2+) and footer (every page), drawn once the page count is known
  const total = doc.getNumberOfPages();
  const year = new Date().getFullYear();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    if (i > 1) {
      doc.addImage(A2000_LOGO_PNG_BASE64, "PNG", M, 8, 25, 7.42);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(muted[0], muted[1], muted[2]);
      doc.text(params.clientName, PAGE_W - M, 11.5, { align: "right" });
      doc.text(params.industry, PAGE_W - M, 15.5, { align: "right" });
      doc.setDrawColor(rule[0], rule[1], rule[2]);
      doc.setLineWidth(0.2);
      doc.line(M, 19, PAGE_W - M, 19);
    }
    doc.setDrawColor(rule[0], rule[1], rule[2]);
    doc.setLineWidth(0.2);
    doc.line(M, PAGE_H - 14, PAGE_W - M, PAGE_H - 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(muted[0], muted[1], muted[2]);
    doc.text(`\u00A9 ${year} ${COMPANY_NAME}. ${SERVICE_NAME}. Confidential.`, M, PAGE_H - 9);
    doc.text(`Page ${i} of ${total}`, PAGE_W - M, PAGE_H - 9, { align: "right" });
  }

  const safeFilename = params.clientName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `${safeFilename}_${params.caseCode}.pdf`;

  let base64 = "";
  try {
    const dataUri = doc.output("datauristring");
    base64 = dataUri.split(",")[1] || "";
  } catch (err) {
    console.warn("Could not encode PDF to base64:", err);
  }

  return { doc, filename, base64 };
}

/** Triggers a browser download for the PDF. Call only after server confirms success. */
export function downloadPdf(doc: jsPDF, filename: string): void {
  doc.save(filename);
}
