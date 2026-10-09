import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } },
) {
  const noteId = Number(params.noteId);
  const experimentId = Number(params.id);
  if (!Number.isSafeInteger(noteId) || noteId < 1 || !Number.isSafeInteger(experimentId) || experimentId < 1) return NextResponse.json({ error: "无效编号" }, { status: 400 });
  if (!(await prisma.experimentNote.findFirst({ where: { id: noteId, experimentId } }))) return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload.content !== "string" || !payload.content.trim() || payload.content.length > 2000000) {
    return NextResponse.json({ error: "content 必填" }, { status: 400 });
  }

  const note = await prisma.experimentNote.update({
    where: { id: noteId, experimentId },
    data: { content: payload.content },
  });

  return NextResponse.json(note);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; noteId: string } },
) {
  const noteId = Number(params.noteId);
  const experimentId = Number(params.id);
  if (!Number.isSafeInteger(noteId) || noteId < 1 || !Number.isSafeInteger(experimentId) || experimentId < 1) return NextResponse.json({ error: "无效编号" }, { status: 400 });
  if (!(await prisma.experimentNote.findFirst({ where: { id: noteId, experimentId } }))) return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
  await prisma.experimentNote.delete({ where: { id: noteId, experimentId } });
  return NextResponse.json({ ok: true });
}
