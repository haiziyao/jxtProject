import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const experimentId = Number(params.id);
  const payload = await request.json();

  if (!payload.content) {
    return NextResponse.json({ error: "content 必填" }, { status: 400 });
  }

  const note = await prisma.experimentNote.create({
    data: {
      experimentId,
      content: payload.content,
    },
  });

  return NextResponse.json(note, { status: 201 });
}
