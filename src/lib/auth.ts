/**
 * Server-side sign-in for the three kinds of visitor:
 *   - staff        (dashboard)            passkey from STAFF_PASSKEY
 *   - portal client (one customer's link)  that customer's passcode
 *   - open-form visitor (/hospital etc.)   a code from ACCESS_CODES
 *
 * After a correct passkey/passcode the server sets a signed, httpOnly cookie.
 * API routes check the cookie; nothing secret is ever sent to the browser.
 * Server only: never import this from a "use client" file.
 */
import { createHash, createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

const STAFF_COOKIE = "a2000_staff";
const ACCESS_COOKIE = "a2000_access";
const STAFF_TTL = 12 * 60 * 60; // 12 hours
const PORTAL_TTL = 30 * 24 * 60 * 60; // 30 days
const ACCESS_TTL = 7 * 24 * 60 * 60; // 7 days

const LEGACY_ACCESS_CODES = ["A2000", "A2000AI", "A2000-2026", "ENABLE2026", "DISCOVERY"];

function list(value: string | undefined): string[] {
  return (value || "")
    .split(",")
    .map((v) => v.trim().toUpperCase())
    .filter(Boolean);
}

let warned = false;
function warnOnce(message: string) {
  if (!warned) console.warn(message);
  warned = true;
}

/** Valid staff passkeys. Set STAFF_PASSKEY in the environment; "A2000" is only a fallback. */
function staffPasskeys(): string[] {
  const keys = list(process.env.STAFF_PASSKEY);
  if (keys.length) return keys;
  warnOnce("STAFF_PASSKEY is not set - falling back to the old default passkey. Set it in .env.production.");
  return ["A2000"];
}

function accessCodes(): string[] {
  const codes = list(process.env.ACCESS_CODES);
  return codes.length ? codes : LEGACY_ACCESS_CODES;
}

/** Signing key: AUTH_SECRET, or one derived from the (secret) database address. */
function secret(): string {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  return createHash("sha256")
    .update(`a2000-auth:${process.env.DATABASE_URL || "no-db"}`)
    .digest("hex");
}

function sign(payload: string): string {
  const mac = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${mac}`;
}

/** Returns the payload if the token is genuine and unexpired. Payload format: "<kind>:<subject>:<expires>". */
function verify(token: string | undefined, kind: string, subject = ""): boolean {
  if (!token) return false;
  const [body, mac] = token.split(".");
  if (!body || !mac) return false;
  const payload = Buffer.from(body, "base64url").toString();
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const [k, s, exp] = payload.split(":");
  return k === kind && s === subject && Number(exp) > Date.now() / 1000;
}

function safeEqual(input: string, candidates: string[]): boolean {
  const clean = Buffer.from(input.trim().toUpperCase());
  return candidates.some((c) => {
    const b = Buffer.from(c);
    return b.length === clean.length && timingSafeEqual(b, clean);
  });
}

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

function isHttps(request: Request): boolean {
  const proto = request.headers.get("x-forwarded-proto") || new URL(request.url).protocol.replace(":", "");
  return proto.split(",")[0].trim() === "https";
}

function setSigned(res: NextResponse, request: Request, name: string, kind: string, subject: string, ttl: number) {
  const exp = Math.floor(Date.now() / 1000) + ttl;
  res.cookies.set(name, sign(`${kind}:${subject}:${exp}`), {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps(request),
    path: "/",
    maxAge: ttl,
  });
}

function portalCookieName(customerId: string) {
  return `a2000_p_${createHash("sha256").update(customerId).digest("hex").slice(0, 16)}`;
}

// ------------------------------------------------------------------ staff

export const checkStaffPasskey = (passkey: string) => safeEqual(passkey, staffPasskeys());
export const isStaff = (request: Request) => verify(readCookie(request, STAFF_COOKIE), "staff");
export const grantStaff = (res: NextResponse, request: Request) =>
  setSigned(res, request, STAFF_COOKIE, "staff", "", STAFF_TTL);
export const revokeStaff = (res: NextResponse) => res.cookies.delete(STAFF_COOKIE);

// ------------------------------------------------------------------ portal client

export const hasPortalAccess = (request: Request, customerId: string) =>
  verify(readCookie(request, portalCookieName(customerId)), "portal", customerId);
export const grantPortal = (res: NextResponse, request: Request, customerId: string) =>
  setSigned(res, request, portalCookieName(customerId), "portal", customerId, PORTAL_TTL);

// ------------------------------------------------------------------ open forms

export const checkAccessCode = (code: string) => safeEqual(code, accessCodes());
export const hasFormAccess = (request: Request) => verify(readCookie(request, ACCESS_COOKIE), "access");
export const grantFormAccess = (res: NextResponse, request: Request) =>
  setSigned(res, request, ACCESS_COOKIE, "access", "", ACCESS_TTL);

// ------------------------------------------------------------------ helpers

export const unauthorized = (message = "Please sign in again.") =>
  NextResponse.json({ success: false, error: message }, { status: 401 });

/** Simple in-memory limit on wrong passcodes (one server process): `max` failures per window per key. */
const failures = new Map<string, number[]>();
export function tooManyAttempts(key: string, max = 10, windowSec = 15 * 60): boolean {
  const now = Date.now();
  const recent = (failures.get(key) || []).filter((t) => now - t < windowSec * 1000);
  failures.set(key, recent);
  return recent.length >= max;
}
export function recordFailure(key: string) {
  const list = failures.get(key) || [];
  list.push(Date.now());
  failures.set(key, list);
  if (failures.size > 5000) failures.clear(); // keep memory bounded
}
export function clearFailures(key: string) {
  failures.delete(key);
}

/** Best-effort client IP behind Nginx. */
export function clientIp(request: Request): string {
  return (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || request.headers.get("x-real-ip") || "local";
}
