import { NextResponse } from "next/server";
import { memoryStore } from "@/lib/services/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get("caseId") || "case-default";
  const answers = memoryStore.answers[caseId] || {};

  return NextResponse.json({
    answers,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { caseId = "case-default", questionKey, value, department } = body;

    if (!questionKey) {
      return NextResponse.json({ error: "Missing questionKey" }, { status: 400 });
    }

    if (!memoryStore.answers[caseId]) {
      memoryStore.answers[caseId] = {};
    }

    memoryStore.answers[caseId][questionKey] = {
      value,
      department: department || "General",
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      savedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
