import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateExperiment, validId } from "@/lib/experiment-input";

export async function GET(request: NextRequest) {
  const tagIdsParam = request.nextUrl.searchParams.get("tagIds");
  const tagIds = tagIdsParam ? tagIdsParam.split(",").map(Number) : [];
  if (tagIds.some(id => !validId(id))) return NextResponse.json({ error: "标签编号不正确" }, { status: 400 });

  const experiments = await prisma.experiment.findMany({
    where: tagIds.length > 0 ? { tags: { some: { tagId: { in: tagIds } } } } : undefined,
    include: { tags: { include: { tag: true } } },
    orderBy: { expDate: "desc" },
  });

  return NextResponse.json(
    experiments.map((experiment) => ({
      id: experiment.id,
      title: experiment.title,
      recorder: experiment.recorder,
      expDate: experiment.expDate.toISOString().split("T")[0],
      createdAt: experiment.createdAt.toISOString(),
      summary: experiment.summary,
      tags: experiment.tags.map((item) => item.tag),
    })),
  );
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return NextResponse.json({ error: "无效请求" }, { status: 400 });
  const error = validateExperiment(payload);
  if (error) return NextResponse.json({ error }, { status: 400 });
  const { title, recorder, expDate, summary, tagIds } = payload;
  if (Array.isArray(tagIds) && await prisma.tag.count({ where: { id: { in: tagIds } } }) !== tagIds.length) return NextResponse.json({ error: "标签不存在" }, { status: 400 });

  const experiment = await prisma.experiment.create({
    data: {
      title,
      recorder,
      expDate: new Date(expDate),
      summary,
      tags: {
        create: Array.isArray(tagIds) ? tagIds.map((tagId: number) => ({ tagId })) : [],
      },
    },
    include: { tags: { include: { tag: true } } },
  });

  return NextResponse.json(
    {
      id: experiment.id,
      title: experiment.title,
      recorder: experiment.recorder,
      expDate: experiment.expDate.toISOString().split("T")[0],
      summary: experiment.summary,
      tags: experiment.tags.map((item) => item.tag),
    },
    { status: 201 },
  );
}
