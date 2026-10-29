import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authSecret, readSessionToken, SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!authSecret()) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  const jar = await cookies();
  const session = await readSessionToken(jar.get(SESSION_COOKIE)?.value || "");
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({
    user: { id: session.sub, email: session.email, name: session.name },
  });
}
