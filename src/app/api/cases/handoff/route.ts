import { NextResponse } from "next/server";
import { isStaff, unauthorized } from "@/lib/auth";

export async function POST(request: Request) {
  if (!isStaff(request)) return unauthorized();
  return NextResponse.json({ success: true });
}
