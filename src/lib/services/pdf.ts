import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { HOSPITAL_QUESTIONNAIRE_SECTIONS } from "@/lib/data/hospital-seed";

interface PdfExportParams {
  caseCode: string;
  clientName: string;
  industry: string;
  answers: Record<string, { value: any; answeredByName?: string; department?: string }>;
  sections: Array<{ sectionNumber: number; title: string; department: string; status: string }>;
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
  doc.text("A2000 AI ENABLEMENT SERVICE", 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Healthcare AI Opportunity Discovery Questionnaire — Confidential Assessment", 14, 18);
  doc.text(`Case ID: ${params.caseCode} | Date: ${new Date().toLocaleDateString("en-IN")}`, 14, 24);

  // Client Details Card
  doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Organization: ${params.clientName}`, 14, 38);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Industry: ${params.industry} | Scope: Multi-Department Assessment`, 14, 43);

  let startY = 48;

  // Build Table of Responses
  const tableRows: any[] = [];

  HOSPITAL_QUESTIONNAIRE_SECTIONS.forEach((sec) => {
    // Add section divider header row
    tableRows.push([
      {
        content: `${sec.title.toUpperCase()} (Assigned: ${sec.defaultDepartment})`,
        colSpan: 3,
        styles: {
          fillColor: [240, 244, 248],
          textColor: primaryNavy,
          fontStyle: "bold",
        },
      },
    ]);

    sec.questions.forEach((q) => {
      const stored = params.answers[q.key];
      let answerText = "— (Not filled) —";
      if (stored && stored.value !== undefined && stored.value !== null) {
        if (Array.isArray(stored.value)) {
          answerText = stored.value.join(", ");
        } else if (typeof stored.value === "object") {
          answerText = JSON.stringify(stored.value);
        } else {
          // Replace rupee symbol if needed to prevent font rendering artifacts
          answerText = String(stored.value).replace(/₹/g, "Rs. ");
        }
      }

      tableRows.push([
        q.label,
        answerText,
        stored?.answeredByName || "—",
      ]);
    });
  });

  autoTable(doc, {
    startY: startY,
    head: [["Question / Field", "Submitted Details", "Answered By"]],
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
      0: { cellWidth: 70 },
      1: { cellWidth: 80 },
      2: { cellWidth: 35 },
    },
    margin: { top: 32, bottom: 20, left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer on every page
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(
        "CONFIDENTIAL & PROPRIETARY — A2000 AI Opportunity Assessment",
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

  doc.save(`${params.caseCode}_A2000_Questionnaire.pdf`);
}

