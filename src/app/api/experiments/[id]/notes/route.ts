import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const experimentId = Number(params.id);
  if (!Number.isInteger(experimentId) || experimentId < 1 || experimentId > 2147483647) return NextResponse.json({ error: "无效编号" }, { status: 400 });
  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload.content !== "string" || !payload.content.trim() || payload.content.length > 2000000) {
    return NextResponse.json({ error: "content 必填" }, { status: 400 });
  }

  if (!(await prisma.experiment.findUnique({ where: { id: experimentId }, select: { id: true } }))) return NextResponse.json({ error: "实验不存在" }, { status: 404 });

  const note = await prisma.experimentNote.create({
    data: {
      experimentId,
      content: payload.content,
    },
  });

  return NextResponse.json(note, { status: 201 });
}
