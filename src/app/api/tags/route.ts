import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tags = await prisma.tag.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(tags);
}

export async function POST(request: NextRequest) {
  const { name, color } = await request.json();

  if (!name || !color) {
    return NextResponse.json({ error: "name 和 color 为必填项" }, { status: 400 });
  }

  const tag = await prisma.tag.create({ data: { name, color } });
  return NextResponse.json(tag, { status: 201 });
}
