import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  BHD_OAUTH_STATE_COOKIE,
  exchangeAuthorizationCode,
  isSafeNextPath,
  isSsoConfigured,
  oauthStateCookieOptions,
  readVerifiedIdentityProfile,
} from "@/lib/bhd/identity";
import {
  SESSION_COOKIE,
  authSecret,
  sessionCookieOptions,
  signSession,
  upsertUserFromIdentity,
} from "@/lib/auth/session";

export const runtime = "nodejs";

type StatePayload = {
  state: string;
  nonce: string;
  verifier: string;
  returnTo: string;
  redirectUri: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const fail = (code: string) =>
    NextResponse.redirect(new URL(`/?error=${encodeURIComponent(code)}`, origin));

  if (!isSsoConfigured()) {
    return NextResponse.json({ message: "BHD_OAUTH_CLIENT_ID missing" }, { status: 503 });
  }
  if (!authSecret()) {
    return NextResponse.json(
      { message: "AUTH_SECRET missing — required to sign product session JWT" },
      { status: 503 },
    );
  }

  const jar = await cookies();
  let saved: StatePayload;
  try {
    saved = JSON.parse(jar.get(BHD_OAUTH_STATE_COOKIE)?.value || "") as StatePayload;
  } catch {
    return fail("state");
  }

  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  if (url.searchParams.get("error") || saved.state !== state || !code) return fail("state");

  let profile;
  try {
    const tokens = await exchangeAuthorizationCode({
      code,
      redirectUri: saved.redirectUri,
      codeVerifier: saved.verifier,
    });
    profile = readVerifiedIdentityProfile(tokens.idToken, saved.nonce);
  } catch {
    return fail("token");
  }

  const user = await upsertUserFromIdentity(profile);
  const token = await signSession(user);
  const dest = isSafeNextPath(saved.returnTo) ? saved.returnTo : "/";
  const response = NextResponse.redirect(new URL(dest, origin));
  response.cookies.set(BHD_OAUTH_STATE_COOKIE, "", { ...oauthStateCookieOptions(), maxAge: 0 });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
