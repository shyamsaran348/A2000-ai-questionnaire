import { NextResponse } from "next/server";
import { memoryStore } from "@/lib/services/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { caseCode, industry, answers } = body;

    if (!caseCode || !answers) {
      return NextResponse.json({ error: "Missing caseCode or answers" }, { status: 400 });
    }

    if (!memoryStore.answers[caseCode]) {
      memoryStore.answers[caseCode] = {};
    }

    Object.entries(answers).forEach(([key, val]: [string, any]) => {
      memoryStore.answers[caseCode][key] = {
        value: val?.value !== undefined ? val.value : val,
        department: val?.department || industry || "General",
        updatedAt: new Date().toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      caseCode,
      autoSavedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

