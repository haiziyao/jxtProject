import { NextRequest, NextResponse } from "next/server";
import { COOKIE_MAX_AGE, COOKIE_NAME, signToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload.password !== "string") return NextResponse.json({ error: "密码格式不正确" }, { status: 400 });
  const { password } = payload;
  const sitePassword = process.env.SITE_PASSWORD;

  if (!sitePassword || !process.env.JWT_SECRET) {
    return NextResponse.json({ error: "Authentication is not configured" }, { status: 500 });
  }

  if (password !== sitePassword) {
    return NextResponse.json({ error: "密码错误" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, signToken(), {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return response;
}
