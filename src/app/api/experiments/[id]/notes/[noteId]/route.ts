import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } },
) {
  const noteId = Number(params.noteId);
  const payload = await request.json();

  if (!payload.content) {
    return NextResponse.json({ error: "content 必填" }, { status: 400 });
  }

  const note = await prisma.experimentNote.update({
    where: { id: noteId },
    data: { content: payload.content },
  });

  return NextResponse.json(note);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; noteId: string } },
) {
  const noteId = Number(params.noteId);
  await prisma.experimentNote.delete({ where: { id: noteId } });
  return NextResponse.json({ ok: true });
}
