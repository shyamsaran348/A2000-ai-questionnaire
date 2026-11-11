import jsPDF from "jspdf";
import type { QuestionDefinition, SectionDefinition } from "@/lib/data/hospital-seed";
import { A2000_LOGO_PNG_BASE64 } from "./logo-data";

/**
 * Printable, blank questionnaire for completing by hand.
 * A4 portrait, black-and-white friendly, with write-in lines, tick boxes
 * and rating grids.
 */

const PAGE_W = 210;
const PAGE_H = 297;
const M = 18; // side margin
const CONTENT_W = PAGE_W - M * 2;
const TOP = 26; // content top on continuation pages
const BOTTOM = PAGE_H - 18;

const NAVY: [number, number, number] = [27, 63, 92];
const BLUE: [number, number, number] = [12, 108, 168];
const INK: [number, number, number] = [30, 41, 59];
const MUTED: [number, number, number] = [100, 116, 139];
const RULE: [number, number, number] = [176, 186, 198];
const TINT: [number, number, number] = [233, 242, 249];

const LINE_GAP = 8.5; // spacing between handwriting lines

/** Standard PDF fonts only cover Latin-1; replace anything they can't draw. */
function clean(s: string): string {
  return s
    .replace(/₹/g, "Rs.")
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/[^\x00-\xFF]/g, "");
}

function optionLabel(o: string | { value: string; label: string }) {
  return clean(typeof o === "string" ? o : o.label);
}

export interface BlankPdfParams {
  industryTitle: string;
  caseCode: string;
  sections: SectionDefinition[];
  preparedFor?: string;
}

export function generateBlankQuestionnairePdf(p: BlankPdfParams): { doc: jsPDF; filename: string } {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = 0;

  const setText = (size: number, style: "normal" | "bold" | "italic", color = INK) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
  };
  const lineH = (size: number) => size * 0.3528 * 1.35; // pt → mm with leading
  const wrap = (text: string, width: number) => doc.splitTextToSize(clean(text), width) as string[];

  const newPage = () => {
    doc.addPage();
    y = TOP;
  };
  const ensure = (h: number) => {
    if (y + h > BOTTOM) newPage();
  };

  const writeLines = (count: number, x = M + 8, w = CONTENT_W - 8) => {
    doc.setDrawColor(RULE[0], RULE[1], RULE[2]);
    doc.setLineWidth(0.25);
    for (let i = 0; i < count; i++) {
      y += LINE_GAP;
      doc.line(x, y, x + w, y);
    }
    y += 3;
  };

  const box = (x: number, yy: number, round: boolean) => {
    doc.setDrawColor(INK[0], INK[1], INK[2]);
    doc.setLineWidth(0.3);
    if (round) doc.circle(x + 1.7, yy - 1.2, 1.7, "S");
    else doc.rect(x, yy - 2.9, 3.4, 3.4, "S");
  };

  // ------------------------------------------------------------------ cover
  doc.addImage(A2000_LOGO_PNG_BASE64, "PNG", M, 14, 42, 13.1);
  setText(8, "bold", MUTED);
  doc.text("CONFIDENTIAL", PAGE_W - M, 18, { align: "right" });
  setText(8, "normal", MUTED);
  doc.text(`Ref: ${p.caseCode}`, PAGE_W - M, 22.5, { align: "right" });
  doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
  doc.rect(M, 31, CONTENT_W, 0.8, "F");

  y = 42;
  setText(9, "bold", BLUE);
  doc.text("A2000 AI ENABLEMENT", M, y);
  y += 7;
  setText(17, "bold", NAVY);
  wrap(`${p.industryTitle}`, CONTENT_W).forEach((l) => {
    doc.text(l, M, y);
    y += lineH(17);
  });
  setText(10, "normal", MUTED);
  doc.text("Printable questionnaire", M, y + 1);
  y += 9;

  // Prepared-for / respondent block
  const field = (label: string, value?: string) => {
    setText(9, "normal", MUTED);
    doc.text(label, M, y);
    if (value) {
      setText(10.5, "bold", INK);
      doc.text(clean(value), M + 38, y);
    }
    doc.setDrawColor(RULE[0], RULE[1], RULE[2]);
    doc.setLineWidth(0.25);
    doc.line(M + 36, y + 1.2, PAGE_W - M, y + 1.2);
    y += 9;
  };
  field("Organisation", p.preparedFor);
  field("Completed by");
  field("Date");

  // Instructions
  y += 2;
  const instructions = [
    "Please write clearly in BLOCK LETTERS using a dark pen.",
    "Tick one circle where you see (select one), or any number of boxes for (select all that apply).",
    "For rating grids, mark one circle per row: 1 = low, 5 = high.",
    "Questions marked * are required. Approximate figures are fine. Attach extra sheets if needed.",
  ];
  const instrH = 9 + instructions.length * 5.2;
  doc.setFillColor(TINT[0], TINT[1], TINT[2]);
  doc.rect(M, y, CONTENT_W, instrH, "F");
  doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
  doc.rect(M, y, 1, instrH, "F");
  setText(9.5, "bold", NAVY);
  doc.text("How to complete this form", M + 5, y + 6);
  setText(9, "normal", INK);
  instructions.forEach((t, i) => doc.text(`•  ${t}`, M + 5, y + 11.5 + i * 5.2));
  y += instrH + 8;

  // --------------------------------------------------------------- sections
  p.sections.forEach((sec, sIdx) => {
    const title = clean(sec.title.replace(/^\d+\.\s*/, ""));
    const descLines = sec.description ? wrap(sec.description, CONTENT_W - 8) : [];
    ensure(14 + descLines.length * lineH(9) + 30); // keep heading with first question

    doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.rect(M, y, CONTENT_W, 9, "F");
    setText(10.5, "bold", [255, 255, 255]);
    doc.text(`Section ${sIdx + 1}  -  ${title}`, M + 4, y + 6.1);
    y += 9;
    if (descLines.length) {
      y += 5;
      setText(9, "italic", MUTED);
      descLines.forEach((l) => {
        doc.text(l, M + 4, y);
        y += lineH(9);
      });
    }
    setText(8.5, "normal", MUTED);
    doc.text(`Typically answered by: ${clean(sec.defaultDepartment)}`, M + 4, y + 1.5);
    y += 8;

    sec.questions.forEach((q, qIdx) => drawQuestion(q, `${sIdx + 1}.${qIdx + 1}`));
    y += 4;
  });

  // ------------------------------------------------------------ sign-off
  ensure(48);
  y += 4;
  doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.setLineWidth(0.4);
  doc.line(M, y, PAGE_W - M, y);
  y += 8;
  setText(10.5, "bold", NAVY);
  doc.text("Declaration", M, y);
  y += 6;
  setText(9, "normal", INK);
  wrap(
    "I confirm that the information provided in this questionnaire is accurate to the best of my knowledge and may be used by A2000 to prepare the AI Enablement discovery assessment.",
    CONTENT_W
  ).forEach((l) => {
    doc.text(l, M, y);
    y += lineH(9);
  });
  y += 10;
  const colW = (CONTENT_W - 10) / 3;
  ["Name", "Signature", "Date"].forEach((label, i) => {
    const x = M + i * (colW + 5);
    doc.setDrawColor(RULE[0], RULE[1], RULE[2]);
    doc.setLineWidth(0.25);
    doc.line(x, y, x + colW, y);
    setText(8.5, "normal", MUTED);
    doc.text(label, x, y + 4.5);
  });

  // ---------------------------------------------------- headers & footers
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    if (i > 1) {
      doc.addImage(A2000_LOGO_PNG_BASE64, "PNG", M, 8, 25, 7.8);
      setText(8, "normal", MUTED);
      doc.text(clean(p.industryTitle), PAGE_W - M, 13, { align: "right" });
      doc.setDrawColor(RULE[0], RULE[1], RULE[2]);
      doc.setLineWidth(0.2);
      doc.line(M, 18.5, PAGE_W - M, 18.5);
    }
    setText(7.5, "normal", MUTED);
    doc.text("A2000 AI Enablement  -  Confidential", M, PAGE_H - 9);
    doc.text(`Page ${i} of ${total}`, PAGE_W - M, PAGE_H - 9, { align: "right" });
  }

  const slug = p.industryTitle.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const who = p.preparedFor ? `_${p.preparedFor.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "")}` : "";
  return { doc, filename: `A2000_${slug}${who}_Printable.pdf` };

  // ---------------------------------------------------------------- helpers
  function drawQuestion(q: QuestionDefinition, num: string) {
    const labelW = CONTENT_W - 10;
    setText(10, "bold", INK);
    const label = wrap(`${q.label}${q.required ? " *" : ""}`, labelW);
    const help = q.helpText ? wrap(q.helpText, labelW) : [];
    const head = label.length * lineH(10) + help.length * lineH(8.5) + 2;

    // Estimate the block height so short questions never split across pages.
    let body = 0;
    const opts = (q.options ?? []).map(optionLabel);
    const isChoice = q.type === "radio" || q.type === "select" || q.type === "checkbox";
    const twoCol = isChoice && opts.length > 3 && opts.every((o) => doc.getTextWidth(o) < (CONTENT_W - 8) / 2 - 10);
    if (q.type === "textarea") body = 4 * LINE_GAP + 3;
    else if (q.type === "text" || q.type === "number") body = LINE_GAP + 3;
    else if (isChoice) body = 6 + (twoCol ? Math.ceil(opts.length / 2) : opts.length) * 6.2 + (opts.includes("Other") ? LINE_GAP : 0);
    else if (q.type === "rating_grid") body = 10 + Math.min(3, q.gridRows?.length ?? 0) * 9; // header + a few rows

    ensure(head + body + 6);

    setText(9, "bold", BLUE);
    doc.text(num, M, y);
    setText(10, "bold", INK);
    label.forEach((l, i) => doc.text(l, M + 10, y + i * lineH(10)));
    y += label.length * lineH(10) - lineH(10) + 1;
    if (help.length) {
      y += lineH(8.5);
      setText(8.5, "italic", MUTED);
      help.forEach((l, i) => doc.text(l, M + 10, y + i * lineH(8.5)));
      y += (help.length - 1) * lineH(8.5);
    }

    if (q.type === "text" || q.type === "number") {
      writeLines(1, M + 10, q.format === "phone" ? 90 : q.format ? 120 : CONTENT_W - 10);
    } else if (q.type === "textarea") {
      writeLines(4, M + 10, CONTENT_W - 10);
    } else if (isChoice) {
      const round = q.type !== "checkbox";
      y += 5;
      setText(8, "italic", MUTED);
      doc.text(round ? "(select one)" : "(select all that apply)", M + 10, y);
      y += 1;
      setText(9.5, "normal", INK);
      const colW = (CONTENT_W - 10) / 2;
      const perCol = twoCol ? Math.ceil(opts.length / 2) : opts.length;
      const startY = y;
      let maxY = y;
      opts.forEach((o, i) => {
        const col = twoCol && i >= perCol ? 1 : 0;
        if (col === 1 && i === perCol) y = startY;
        const x = M + 10 + col * colW;
        const lines = wrap(o, (twoCol ? colW : CONTENT_W - 10) - 9);
        if (y + 5.5 + lines.length * lineH(9.5) > BOTTOM) {
          newPage();
        }
        y += 5.5;
        box(x, y, round);
        lines.forEach((l, li) => doc.text(l, x + 6, y + li * lineH(9.5)));
        y += (lines.length - 1) * lineH(9.5) + 0.7;
        if (o === "Other") {
          doc.setDrawColor(RULE[0], RULE[1], RULE[2]);
          doc.setLineWidth(0.25);
          doc.line(x + 18, y, x + (twoCol ? colW - 4 : 110), y);
        }
        maxY = Math.max(maxY, y);
      });
      y = maxY + 4;
    } else if (q.type === "rating_grid" && q.gridRows) {
      drawGrid(q);
    } else {
      writeLines(2, M + 10, CONTENT_W - 10);
    }
    y += 6;
  }

  function drawGrid(q: QuestionDefinition) {
    const cols = (q.gridColumns?.length ? q.gridColumns : ["1 (Low)", "2", "3", "4", "5 (High)"]).map(clean);
    const x0 = M + 10;
    const w = CONTENT_W - 10;
    const cellW = 17;
    const labelW = w - cellW * cols.length;

    const header = () => {
      y += 4;
      doc.setFillColor(241, 245, 249);
      doc.rect(x0, y, w, 8, "F");
      setText(8, "bold", MUTED);
      doc.text("Area", x0 + 2, y + 5.3);
      cols.forEach((c, i) => doc.text(c, x0 + labelW + cellW * i + cellW / 2, y + 5.3, { align: "center" }));
      y += 8;
    };
    header();

    q.gridRows!.forEach((row) => {
      setText(9, "normal", INK);
      const lines = wrap(row, labelW - 4);
      const h = Math.max(8, lines.length * lineH(9) + 3.5);
      if (y + h > BOTTOM) {
        newPage();
        header();
        setText(9, "normal", INK);
      }
      lines.forEach((l, i) => doc.text(l, x0 + 2, y + 5 + i * lineH(9)));
      cols.forEach((_, i) => {
        doc.setDrawColor(INK[0], INK[1], INK[2]);
        doc.setLineWidth(0.3);
        doc.circle(x0 + labelW + cellW * i + cellW / 2, y + h / 2, 1.8, "S");
      });
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(x0, y + h, x0 + w, y + h);
      y += h;
    });
    y += 2;
  }
}
