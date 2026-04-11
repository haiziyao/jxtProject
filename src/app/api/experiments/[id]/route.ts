import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);

  const experiment = await prisma.experiment.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } },
      images: true,
      notes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!experiment) {
    return NextResponse.json({ error: "实验不存在" }, { status: 404 });
  }

  return NextResponse.json({
    id: experiment.id,
    title: experiment.title,
    recorder: experiment.recorder,
    expDate: experiment.expDate.toISOString().split("T")[0],
    summary: experiment.summary,
    tags: experiment.tags.map((item) => item.tag),
    images: experiment.images,
    notes: experiment.notes.map((note) => ({
      ...note,
      createdAt: note.createdAt.toISOString(),
    })),
  });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const { title, recorder, expDate, summary, tagIds } = await request.json();

  const experiment = await prisma.experiment.update({
    where: { id },
    data: {
      title,
      recorder,
      expDate: expDate ? new Date(expDate) : undefined,
      summary,
      tags: {
        deleteMany: {},
        create: Array.isArray(tagIds) ? tagIds.map((tagId: number) => ({ tagId })) : [],
      },
    },
    include: { tags: { include: { tag: true } } },
  });

  return NextResponse.json({
    id: experiment.id,
    title: experiment.title,
    recorder: experiment.recorder,
    expDate: experiment.expDate.toISOString().split("T")[0],
    summary: experiment.summary,
    tags: experiment.tags.map((item) => item.tag),
  });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  await prisma.experiment.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
