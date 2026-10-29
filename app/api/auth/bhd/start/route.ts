import { NextResponse } from "next/server";
import {
  BHD_OAUTH_STATE_COOKIE,
  identityIssuer,
  isSsoConfigured,
  oauthClientId,
  oauthRedirectUri,
  oauthStateCookieOptions,
  randomUrlToken,
  safeReturnPath,
  sha256Base64Url,
} from "@/lib/bhd/identity";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const returnTo = safeReturnPath(url.searchParams.get("returnTo"));

  if (!isSsoConfigured()) {
    return NextResponse.json(
      {
        message: "Set BHD_OAUTH_CLIENT_ID (and secret if required) from id.bhd-om.com/admin#connect",
        env: ["BHD_IDENTITY_ISSUER", "BHD_OAUTH_CLIENT_ID", "BHD_OAUTH_CLIENT_SECRET"],
      },
      { status: 503 },
    );
  }

  const state = randomUrlToken();
  const nonce = randomUrlToken();
  const verifier = randomUrlToken(48);
  const redirectUri = oauthRedirectUri(origin);
  const authorize = new URL("/oauth/authorize", identityIssuer());
  authorize.searchParams.set("client_id", oauthClientId());
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("scope", "openid profile email");
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("nonce", nonce);
  authorize.searchParams.set("code_challenge", sha256Base64Url(verifier));
  authorize.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authorize);
  response.cookies.set(
    BHD_OAUTH_STATE_COOKIE,
    JSON.stringify({ state, nonce, verifier, returnTo, redirectUri }),
    oauthStateCookieOptions(),
  );
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
