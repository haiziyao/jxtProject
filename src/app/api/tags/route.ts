import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const tags = await prisma.tag.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(tags);
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const { name, color } = payload || {};

  if (typeof name !== "string" || !name.trim() || name.length > 50 || typeof color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(color)) {
    return NextResponse.json({ error: "name 和 color 为必填项" }, { status: 400 });
  }

  const tag = await prisma.tag.create({ data: { name: name.trim(), color } });
  return NextResponse.json(tag, { status: 201 });
}
