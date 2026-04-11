import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sections = await prisma.projectSection.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(sections);
}

export async function POST(request: NextRequest) {
  const { title, content, sortOrder } = await request.json();

  if (!title) {
    return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
  }

  const section = await prisma.projectSection.create({
    data: {
      title,
      content: content ?? "",
      sortOrder: sortOrder ?? 0,
    },
  });

  return NextResponse.json(section, { status: 201 });
}
