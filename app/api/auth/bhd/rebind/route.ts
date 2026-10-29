import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { identityIssuer, isSsoConfigured, safeReturnPath } from "@/lib/bhd/identity";
import {
  SESSION_COOKIE,
  authSecret,
  readSessionToken,
  sessionCookieOptions,
  signSession,
  upsertUserFromIdentity,
} from "@/lib/auth/session";

export const runtime = "nodejs";

async function profileFromWindowToken(token: string) {
  const response = await fetch(`${identityIssuer()}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`me_${response.status}`);
  const body = (await response.json()) as {
    user?: { id?: string; email?: string; name?: string } | null;
  };
  const user = body.user;
  const email = typeof user?.email === "string" ? user.email.trim().toLowerCase() : "";
  if (!user?.id || !email) throw new Error("claims");
  return {
    sub: user.id,
    email,
    name: typeof user.name === "string" && user.name.trim() ? user.name.trim() : email,
  };
}

async function rebind(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;

  if (!isSsoConfigured() || !authSecret()) {
    return NextResponse.json(
      {
        message: "Configure AUTH_SECRET and BHD_OAUTH_* before rebind",
        todo: ["AUTH_SECRET", "BHD_OAUTH_CLIENT_ID", "database upsert in lib/auth/session.ts"],
      },
      { status: 503 },
    );
  }

  let token = "";
  let returnTo = "/";
  const contentType = request.headers.get("content-type") || "";
  if (request.method === "POST" && contentType.includes("application/json")) {
    const json = (await request.json().catch(() => ({}))) as { token?: string; returnTo?: string };
    token = typeof json.token === "string" ? json.token.trim() : "";
    returnTo = safeReturnPath(json.returnTo);
  } else if (request.method === "POST") {
    const form = await request.formData().catch(() => null);
    token = String(form?.get("token") || "").trim();
    returnTo = safeReturnPath(String(form?.get("returnTo") || ""));
  } else {
    returnTo = safeReturnPath(url.searchParams.get("returnTo"));
  }

  const header = request.headers.get("authorization");
  if (!token && header?.toLowerCase().startsWith("bearer ")) token = header.slice(7).trim();

  if (!token || token.length < 20) {
    return NextResponse.redirect(
      new URL(`/api/auth/bhd/start?returnTo=${encodeURIComponent(returnTo)}`, origin),
      303,
    );
  }

  try {
    const profile = await profileFromWindowToken(token);
    const jar = await cookies();
    const current = await readSessionToken(jar.get(SESSION_COOKIE)?.value || "");
    if (current?.sub === profile.sub) {
      return NextResponse.redirect(new URL(returnTo, origin), 303);
    }
    const user = await upsertUserFromIdentity(profile);
    const session = await signSession(user);
    const response = NextResponse.redirect(new URL(returnTo, origin), 303);
    response.cookies.set(SESSION_COOKIE, session, sessionCookieOptions());
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.redirect(
      new URL(
        `/api/auth/bhd/logout?continue=${encodeURIComponent(`/api/auth/bhd/start?returnTo=${encodeURIComponent(returnTo)}`)}`,
        origin,
      ),
      303,
    );
  }
}

export const GET = rebind;
export const POST = rebind;
