import { NextResponse } from "next/server";
import {
  BHD_OAUTH_STATE_COOKIE,
  endSessionUrl,
  isSafeNextPath,
  isSsoConfigured,
  oauthStateCookieOptions,
} from "@/lib/bhd/identity";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";

export const runtime = "nodejs";

async function logout(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const cont = url.searchParams.get("continue") || "";

  let target: string;
  if (cont.startsWith("http://") || cont.startsWith("https://")) {
    target = cont;
  } else if (isSafeNextPath(cont)) {
    target = new URL(cont, origin).toString();
  } else if (isSsoConfigured()) {
    target = endSessionUrl(origin);
  } else {
    target = new URL("/", origin).toString();
  }

  const response = NextResponse.redirect(target, 303);
  const clear = { ...sessionCookieOptions(), maxAge: 0 };
  response.cookies.set(SESSION_COOKIE, "", clear);
  response.cookies.set(BHD_OAUTH_STATE_COOKIE, "", { ...oauthStateCookieOptions(), maxAge: 0 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const GET = logout;
export const POST = logout;
