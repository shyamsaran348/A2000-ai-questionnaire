import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SectionDefinition } from "@/lib/data/hospital-seed";

interface PdfExportParams {
  caseCode: string;
  clientName: string;
  industry: string;
  answers: Record<string, any>;
  sections: SectionDefinition[];
}

export function generateA2000Pdf(params: PdfExportParams): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const primaryNavy = [23, 50, 77]; // #17324D
  const accentOrange = [201, 120, 53]; // #C97835
  const charcoal = [30, 41, 59];

  // Header Banner
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(0, 0, 210, 28, "F");

  // Accent Line
  doc.setFillColor(accentOrange[0], accentOrange[1], accentOrange[2]);
  doc.rect(0, 28, 210, 2, "F");

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("A2000 | AI ENABLEMENT", 14, 12);

  // Top-Right Confidential Badge
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("CONFIDENTIAL", 175, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${params.industry} — Discovery Questionnaire`, 14, 18);
  doc.text(`Case ID: ${params.caseCode} | Date: ${new Date().toLocaleDateString("en-IN")}`, 14, 24);

  // Client Details Card
  doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Company / Organization: ${params.clientName}`, 14, 38);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Industry: ${params.industry}`, 14, 43);

  let startY = 48;

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
    margin: { top: 32, bottom: 20, left: 14, right: 14 },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(
        "CONFIDENTIAL — A2000 | AI Enablement",
        14,
        doc.internal.pageSize.height - 10
      );
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        doc.internal.pageSize.width - 32,
        doc.internal.pageSize.height - 10
      );
    },
  });

  const safeFilename = params.clientName.replace(/[^a-zA-Z0-9_-]/g, "_");
  doc.save(`${safeFilename}_${params.caseCode}.pdf`);
}
