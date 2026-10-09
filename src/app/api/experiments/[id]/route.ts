import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BODY_MARKDOWN_PREFIX, validateExperiment, validId } from "@/lib/experiment-input";
import { storageBaseUrl } from "@/lib/storage-url";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!validId(id)) return NextResponse.json({ error: "无效实验编号" }, { status: 400 });

  const experiment = await prisma.experiment.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } },
      images: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
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
    storageBaseUrl: storageBaseUrl(),
    notes: experiment.notes.map((note) => ({
      ...note,
      createdAt: note.createdAt.toISOString(),
    })),
  });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!validId(id)) return NextResponse.json({ error: "无效实验编号" }, { status: 400 });
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return NextResponse.json({ error: "无效请求" }, { status: 400 });
  const error = validateExperiment(payload, true);
  if (error) return NextResponse.json({ error }, { status: 400 });
  const { title, recorder, expDate, summary, tagIds, bodyMarkdown, bodyNoteId } = payload;
  if (!(await prisma.experiment.findUnique({ where: { id }, select: { id: true } }))) return NextResponse.json({ error: "实验不存在" }, { status: 404 });
  if (Array.isArray(tagIds) && await prisma.tag.count({ where: { id: { in: tagIds } } }) !== tagIds.length) return NextResponse.json({ error: "标签不存在" }, { status: 400 });
  if (bodyNoteId && !(await prisma.experimentNote.findFirst({ where: { id: bodyNoteId, experimentId: id, content: { startsWith: BODY_MARKDOWN_PREFIX } }, select: { id: true } }))) return NextResponse.json({ error: "正文笔记不属于此实验" }, { status: 404 });
  const result = await prisma.$transaction(async tx => {
    const experiment = await tx.experiment.update({
      where: { id },
      data: {
        title,
        recorder,
        expDate: expDate ? new Date(expDate) : undefined,
        summary,
        tags: tagIds === undefined ? undefined : {
          deleteMany: {},
          create: Array.isArray(tagIds) ? tagIds.map((tagId: number) => ({ tagId })) : [],
        },
      },
      include: { tags: { include: { tag: true } } },
    });
    let savedBodyNoteId: number | undefined;
    if (bodyMarkdown !== undefined) {
      const current = bodyNoteId ? { id: bodyNoteId } : await tx.experimentNote.findFirst({ where: { experimentId: id, content: { startsWith: BODY_MARKDOWN_PREFIX } }, orderBy: { createdAt: "desc" } });
      const content = BODY_MARKDOWN_PREFIX + bodyMarkdown;
      const note = current ? await tx.experimentNote.update({ where: { id: current.id, experimentId: id }, data: { content } }) : await tx.experimentNote.create({ data: { experimentId: id, content } });
      savedBodyNoteId = note.id;
    }
    return {
      id: experiment.id,
      title: experiment.title,
      recorder: experiment.recorder,
      expDate: experiment.expDate.toISOString().split("T")[0],
      summary: experiment.summary,
      tags: experiment.tags.map((item) => item.tag),
      ...(savedBodyNoteId === undefined ? {} : { bodyNoteId: savedBodyNoteId }),
    };
  });
  return NextResponse.json(result);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!validId(Number(params.id))) return NextResponse.json({ error: "无效实验编号" }, { status: 400 });
  const result = await prisma.experiment.deleteMany({ where: { id: Number(params.id) } });
  if (!result.count) return NextResponse.json({ error: "实验不存在" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
