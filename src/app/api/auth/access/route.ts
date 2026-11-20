import { NextResponse } from "next/server";
import {
  checkAccessCode,
  clearFailures,
  clientIp,
  grantFormAccess,
  hasFormAccess,
  recordFailure,
  tooManyAttempts,
} from "@/lib/auth";

/** GET: can this browser use the open questionnaire pages? */
export async function GET(request: Request) {
  return NextResponse.json({ authenticated: hasFormAccess(request) });
}

/** POST { code }: unlock the open questionnaire pages. */
export async function POST(request: Request) {
  const key = `access:${clientIp(request)}`;
  if (tooManyAttempts(key)) {
    return NextResponse.json({ success: false, error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  }
  const { code } = await request.json().catch(() => ({}));
  if (typeof code !== "string" || !checkAccessCode(code)) {
    recordFailure(key);
    return NextResponse.json(
      { success: false, error: "That passkey isn't recognised. Check your invitation and try again." },
      { status: 401 }
    );
  }
  clearFailures(key);
  const res = NextResponse.json({ success: true });
  grantFormAccess(res, request);
  return res;
}
