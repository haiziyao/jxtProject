import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const payload = await request.json();

  const section = await prisma.projectSection.update({
    where: { id: Number(params.id) },
    data: {
      title: payload.title,
      content: payload.content,
      sortOrder: payload.sortOrder,
    },
  });

  return NextResponse.json(section);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  await prisma.projectSection.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
