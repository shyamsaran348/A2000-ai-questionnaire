import ExcelJS from "exceljs";
import { HOSPITAL_QUESTIONNAIRE_SECTIONS } from "@/lib/data/hospital-seed";

interface ExcelExportParams {
  caseCode: string;
  clientName: string;
  industry: string;
  status: string;
  workflowMode: string;
  createdAt: string;
  sections: Array<{
    sectionNumber: number;
    title: string;
    department: string;
    assignedContactName?: string | null;
    assignedContactEmail?: string | null;
    status: string;
    submittedAt?: string | null;
  }>;
  answers: Record<string, {
    value: any;
    answeredByName?: string;
    department?: string;
    updatedAt: string;
  }>;
  auditLogs: Array<{
    eventType: string;
    actorName?: string | null;
    actorEmail?: string | null;
    notes?: string | null;
    createdAt: string;
  }>;
}

export async function generateCaseWorkbook(data: ExcelExportParams): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "A2000 AI Enablement Platform";
  workbook.created = new Date();

  // Primary Theme Colors (A2000 Navy & Warm Accent)
  const NAVY_HEADER = "1B3F5C";
  const ACCENT_BLUE = "0C6CA8";
  const LIGHT_GRAY = "F4F6F8";

  // 1. SHEET: SUMMARY
  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.columns = [
    { header: "Attribute", key: "attr", width: 30 },
    { header: "Details", key: "val", width: 50 },
  ];

  summarySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  summarySheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: NAVY_HEADER },
  };

  const completedCount = data.sections.filter((s) => s.status === "submitted").length;
  const progressPct = Math.round((completedCount / data.sections.length) * 100);

  summarySheet.addRows([
    { attr: "Client / Organization", val: data.clientName },
    { attr: "Industry", val: data.industry },
    { attr: "Case Identification Code", val: data.caseCode },
    { attr: "Overall Case Status", val: data.status.toUpperCase() },
    { attr: "Workflow Mode", val: data.workflowMode.toUpperCase() },
    { attr: "Sections Progress", val: `${completedCount} of ${data.sections.length} submitted (${progressPct}%)` },
    { attr: "Initiated Date", val: new Date(data.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST" },
    { attr: "Export Generated At", val: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST" },
    { attr: "Consultancy Partner", val: "A2000 AI Enablement Service" },
  ]);

  summarySheet.addRow({});
  const deptHeader = summarySheet.addRow(["Department", "Assigned Contact", "Status", "Submitted At"]);
  deptHeader.font = { bold: true };

  data.sections.forEach((sec) => {
    summarySheet.addRow([
      sec.department,
      `${sec.assignedContactName || "Unassigned"} (${sec.assignedContactEmail || "No email"})`,
      sec.status.toUpperCase(),
      sec.submittedAt ? new Date(sec.submittedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "Pending",
    ]);
  });

  // 2. SHEET: MASTER RESPONSES
  const responsesSheet = workbook.addWorksheet("Responses");
  responsesSheet.columns = [
    { header: "Case ID", key: "caseId", width: 18 },
    { header: "Sec #", key: "secNum", width: 8 },
    { header: "Section Title", key: "secTitle", width: 32 },
    { header: "Question Key", key: "qKey", width: 22 },
    { header: "Question Text", key: "qText", width: 45 },
    { header: "Submitted Answer", key: "ans", width: 50 },
    { header: "Department", key: "dept", width: 25 },
    { header: "Answered By", key: "user", width: 25 },
    { header: "Last Updated (IST)", key: "updated", width: 22 },
  ];

  responsesSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  responsesSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: NAVY_HEADER },
  };

  HOSPITAL_QUESTIONNAIRE_SECTIONS.forEach((sec) => {
    sec.questions.forEach((q) => {
      const stored = data.answers[q.key];
      let formattedVal = "";
      if (stored && stored.value !== undefined && stored.value !== null) {
        if (Array.isArray(stored.value)) {
          formattedVal = stored.value.join(", ");
        } else if (typeof stored.value === "object") {
          formattedVal = JSON.stringify(stored.value);
        } else {
          formattedVal = String(stored.value);
        }
      }

      responsesSheet.addRow({
        caseId: data.caseCode,
        secNum: sec.number,
        secTitle: sec.title,
        qKey: q.key,
        qText: q.label,
        ans: formattedVal || "— (Not yet answered) —",
        dept: stored?.department || sec.defaultDepartment,
        user: stored?.answeredByName || "—",
        updated: stored?.updatedAt ? new Date(stored.updatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "—",
      });
    });
  });

  // 3. SHEET PER SECTION (Clean, human-readable layout)
  HOSPITAL_QUESTIONNAIRE_SECTIONS.forEach((sec) => {
    const sheetName = `Sec ${sec.number} - ${sec.key.slice(0, 15)}`;
    const secSheet = workbook.addWorksheet(sheetName);

    secSheet.columns = [
      { header: "Question / Field", key: "question", width: 45 },
      { header: "Answer", key: "answer", width: 55 },
    ];

    secSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    secSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: NAVY_HEADER },
    };

    secSheet.addRow({
      question: `DEPARTMENT: ${sec.defaultDepartment}`,
      answer: `TITLE: ${sec.title}`,
    });

    sec.questions.forEach((q) => {
      const stored = data.answers[q.key];
      let val = "—";
      if (stored && stored.value) {
        val = Array.isArray(stored.value) ? stored.value.join(", ") : String(stored.value);
      }
      secSheet.addRow({
        question: q.label,
        answer: val,
      });
    });
  });

  // 4. SHEET: AUDIT LOG
  const auditSheet = workbook.addWorksheet("Audit Trail");
  auditSheet.columns = [
    { header: "Timestamp (IST)", key: "ts", width: 22 },
    { header: "Action / Event", key: "event", width: 25 },
    { header: "Actor Name", key: "actor", width: 25 },
    { header: "Actor Email", key: "email", width: 30 },
    { header: "Notes / Details", key: "notes", width: 50 },
  ];

  auditSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  auditSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: ACCENT_BLUE },
  };

  data.auditLogs.forEach((log) => {
    auditSheet.addRow({
      ts: new Date(log.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      event: log.eventType.replace(/_/g, " ").toUpperCase(),
      actor: log.actorName || "System",
      email: log.actorEmail || "—",
      notes: log.notes || "",
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

