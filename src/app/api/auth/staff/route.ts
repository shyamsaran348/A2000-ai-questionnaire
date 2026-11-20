import { NextResponse } from "next/server";
import {
  checkStaffPasskey,
  clearFailures,
  clientIp,
  grantStaff,
  isStaff,
  recordFailure,
  revokeStaff,
  tooManyAttempts,
} from "@/lib/auth";

/** GET: is this browser signed in as staff? */
export async function GET(request: Request) {
  return NextResponse.json({ authenticated: isStaff(request) });
}

/** POST { passkey }: sign in. */
export async function POST(request: Request) {
  const key = `staff:${clientIp(request)}`;
  if (tooManyAttempts(key)) {
    return NextResponse.json({ success: false, error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  }
  const { passkey } = await request.json().catch(() => ({}));
  if (typeof passkey !== "string" || !checkStaffPasskey(passkey)) {
    recordFailure(key);
    return NextResponse.json({ success: false, error: "Incorrect passkey." }, { status: 401 });
  }
  clearFailures(key);
  const res = NextResponse.json({ success: true });
  grantStaff(res, request);
  return res;
}

/** DELETE: sign out. */
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  revokeStaff(res);
  return res;
}
