import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const sections = await prisma.projectSection.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(sections);
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const { title, content, sortOrder } = payload || {};

  if (typeof title !== "string" || !title.trim() || title.length > 100 || (content !== undefined && (typeof content !== "string" || content.length > 2000000)) || (sortOrder !== undefined && (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 2147483647))) {
    return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
  }

  const section = await prisma.projectSection.create({
    data: {
      title: title.trim(),
      content: content ?? "",
      sortOrder: sortOrder ?? 0,
    },
  });

  return NextResponse.json(section, { status: 201 });
}
