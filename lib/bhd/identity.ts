import { createHash, randomBytes } from "crypto";
import { DEFAULT_IDENTITY_ISSUER } from "@/lib/bhd/identity-public";

export const BHD_OAUTH_STATE_COOKIE = "bhd_oauth_state";

export type BhdOAuthState = {
  state: string;
  nonce: string;
  verifier: string;
  returnTo: string;
  redirectUri: string;
};

export function identityIssuer(): string {
  return (process.env.BHD_IDENTITY_ISSUER?.trim() || DEFAULT_IDENTITY_ISSUER).replace(/\/$/, "");
}

export function oauthClientId(): string {
  return process.env.BHD_OAUTH_CLIENT_ID?.trim() || "";
}

export function oauthClientSecret(): string {
  return process.env.BHD_OAUTH_CLIENT_SECRET?.trim() || "";
}

export function isSsoConfigured(): boolean {
  return Boolean(oauthClientId());
}

export function oauthRedirectUri(origin: string): string {
  const fromRequest = `${origin.replace(/\/$/, "")}/api/auth/bhd/callback`;
  const configured = process.env.BHD_OAUTH_REDIRECT_URI?.trim();
  if (!configured) return fromRequest;
  try {
    if (new URL(configured).origin === new URL(origin).origin) return configured;
  } catch {
    /* ignore */
  }
  return fromRequest;
}

export function randomUrlToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256Base64Url(value: string): string {
  return createHash("sha256").update(value).digest("base64url");
}

export function isSafeNextPath(value: string | null | undefined): value is string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://")) return false;
  return true;
}

export function safeReturnPath(value: string | null | undefined): string {
  return isSafeNextPath(value) ? value : "/";
}

export function oauthStateCookieOptions(maxAge = 5 * 60) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function exchangeAuthorizationCode(input: {
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<{ idToken: string }> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: input.code,
    redirect_uri: input.redirectUri,
    client_id: oauthClientId(),
    code_verifier: input.codeVerifier,
  });
  const secret = oauthClientSecret();
  if (secret) body.set("client_secret", secret);
  const tokenRes = await fetch(`${identityIssuer()}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tokenRes.ok) throw new Error(`token_${tokenRes.status}`);
  const tokens = (await tokenRes.json()) as { id_token?: string };
  if (!tokens.id_token) throw new Error("empty_token");
  return { idToken: tokens.id_token };
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export type IdentityProfile = { sub: string; email: string; name: string };

export function readVerifiedIdentityProfile(idToken: string, nonce: string): IdentityProfile {
  const payload = decodeJwtPayload(idToken);
  if (!payload || payload.nonce !== nonce) throw new Error("nonce");
  const sub = typeof payload.sub === "string" ? payload.sub : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  if (!sub || !email) throw new Error("claims");
  return {
    sub,
    email,
    name: typeof payload.name === "string" && payload.name.trim() ? payload.name.trim() : email,
  };
}

export function endSessionUrl(origin: string): string {
  const url = new URL("/oauth/end-session", identityIssuer());
  url.searchParams.set("post_logout_redirect_uri", `${origin.replace(/\/$/, "")}/`);
  const clientId = oauthClientId();
  if (clientId) url.searchParams.set("client_id", clientId);
  return url.toString();
}
