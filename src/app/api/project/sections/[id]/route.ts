import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validId } from "@/lib/experiment-input";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!validId(id)) return NextResponse.json({ error: "无效编号" }, { status: 400 });
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload.title !== "string" || !payload.title.trim() || payload.title.length > 100 || typeof payload.content !== "string" || payload.content.length > 2000000 || !Number.isInteger(payload.sortOrder) || payload.sortOrder < 0 || payload.sortOrder > 2147483647) return NextResponse.json({ error: "项目说明格式不正确" }, { status: 400 });
  if (!(await prisma.projectSection.findUnique({ where: { id }, select: { id: true } }))) return NextResponse.json({ error: "记录不存在" }, { status: 404 });

  const section = await prisma.projectSection.update({
    where: { id },
    data: {
      title: payload.title,
      content: payload.content,
      sortOrder: payload.sortOrder,
    },
  });

  return NextResponse.json(section);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!validId(id)) return NextResponse.json({ error: "无效编号" }, { status: 400 });
  const result = await prisma.projectSection.deleteMany({ where: { id } });
  if (!result.count) return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
