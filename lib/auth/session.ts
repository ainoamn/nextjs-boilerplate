import { SignJWT, jwtVerify } from "jose";

/** Product session cookie — replace with your DB-backed user model. */
export const SESSION_COOKIE = "bhd_product_session";
export const SESSION_ISSUER = "bhd-boilerplate";
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 40;

export type ProductSession = {
  sub: string;
  email: string;
  name: string;
};

export function authSecret(): string {
  return process.env.AUTH_SECRET?.trim() || "";
}

function secretKey() {
  const secret = authSecret();
  if (!secret) throw new Error("AUTH_SECRET is not configured — set in .env before SSO callback/rebind");
  return new TextEncoder().encode(secret);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  };
}

export async function signSession(user: ProductSession): Promise<string> {
  return new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.sub)
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(secretKey());
}

export async function readSessionToken(token: string): Promise<ProductSession | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: SESSION_ISSUER,
      audience: SESSION_ISSUER,
    });
    const sub = typeof payload.sub === "string" ? payload.sub : "";
    const email = typeof payload.email === "string" ? payload.email : "";
    if (!sub || !email) return null;
    return {
      sub,
      email,
      name: typeof payload.name === "string" ? payload.name : email,
    };
  } catch {
    return null;
  }
}

/** TODO: upsert user in your database and return ProductSession. */
export async function upsertUserFromIdentity(profile: ProductSession): Promise<ProductSession> {
  void profile;
  // Replace with Prisma/Drizzle upsert keyed by profile.sub
  return profile;
}
