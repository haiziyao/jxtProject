import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validId } from "@/lib/experiment-input";

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!validId(id)) return NextResponse.json({ error: "无效编号" }, { status: 400 });
  const result = await prisma.projectAttachment.deleteMany({ where: { id } });
  if (!result.count) return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
