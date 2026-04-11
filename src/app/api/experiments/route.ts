import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const tagIdsParam = request.nextUrl.searchParams.get("tagIds");
  const tagIds = tagIdsParam ? tagIdsParam.split(",").map(Number).filter(Boolean) : [];

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
      summary: experiment.summary,
      tags: experiment.tags.map((item) => item.tag),
    })),
  );
}

export async function POST(request: NextRequest) {
  const { title, recorder, expDate, summary, tagIds } = await request.json();

  if (!title || !recorder || !expDate || !summary) {
    return NextResponse.json({ error: "title、recorder、expDate、summary 为必填项" }, { status: 400 });
  }

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
