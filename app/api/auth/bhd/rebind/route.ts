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

function bindReturnPath(returnTo: string, sub: string) {
  const safe = safeReturnPath(returnTo);
  try {
    const url = new URL(safe, "https://bhd.local");
    url.searchParams.set("au", sub);
    url.searchParams.set("_bhd", String(Date.now()));
    return `${url.pathname}${url.search}`;
  } catch {
    return safe;
  }
}

function wantsJson(request: Request) {
  const accept = request.headers.get("accept") || "";
  return accept.includes("application/json");
}

function redirectHome(origin: string, returnTo: string) {
  const response = NextResponse.redirect(new URL(returnTo, origin), 303);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  response.headers.set("Pragma", "no-cache");
  return response;
}

function jsonOk(
  payload: { ok: true; unchanged?: boolean; user: { id: string; email: string; name: string } },
  session?: string,
) {
  const response = NextResponse.json(payload, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate, private", Pragma: "no-cache" },
  });
  if (session) {
    response.cookies.set(SESSION_COOKIE, session, sessionCookieOptions());
  }
  return response;
}

async function rebind(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const json = wantsJson(request);

  if (!isSsoConfigured() || !authSecret()) {
    if (json) return NextResponse.json({ ok: false, error: "sso" }, { status: 503 });
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
    const body = (await request.json().catch(() => ({}))) as { token?: string; returnTo?: string };
    token = typeof body.token === "string" ? body.token.trim() : "";
    returnTo = safeReturnPath(body.returnTo);
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
    if (json) return NextResponse.json({ ok: false, error: "token" }, { status: 401 });
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
      if (json) {
        return jsonOk({
          ok: true,
          unchanged: true,
          user: { id: profile.sub, email: current.email, name: current.name },
        });
      }
      const user = await upsertUserFromIdentity(profile);
      const session = await signSession(user);
      const response = redirectHome(origin, bindReturnPath(returnTo, profile.sub));
      response.cookies.set(SESSION_COOKIE, session, sessionCookieOptions());
      return response;
    }

    const user = await upsertUserFromIdentity(profile);
    const session = await signSession(user);

    if (json) {
      return jsonOk({ ok: true, user: { id: user.sub, email: user.email, name: user.name } }, session);
    }

    const response = redirectHome(origin, bindReturnPath(returnTo, profile.sub));
    response.cookies.set(SESSION_COOKIE, session, sessionCookieOptions());
    return response;
  } catch {
    if (json) {
      const response = NextResponse.json({ ok: false, error: "rebind" }, { status: 401 });
      response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
      return response;
    }
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
