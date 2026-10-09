import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validId } from "@/lib/experiment-input";
import { getObjectNameFromUrl } from "@/lib/minio";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const experimentId = Number(params.id);
  if (!validId(experimentId)) return NextResponse.json({ error: "无效编号" }, { status: 400 });
  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload.imageUrl !== "string" || payload.imageUrl.length > 500 || !getObjectNameFromUrl(payload.imageUrl) || (payload.sortOrder !== undefined && (!Number.isInteger(payload.sortOrder) || payload.sortOrder < 0 || payload.sortOrder > 2147483647))) {
    return NextResponse.json({ error: "imageUrl 必填" }, { status: 400 });
  }

  if (!(await prisma.experiment.findUnique({ where: { id: experimentId }, select: { id: true } }))) return NextResponse.json({ error: "实验不存在" }, { status: 404 });

  const image = await prisma.experimentImage.create({
    data: {
      experimentId,
      imageUrl: payload.imageUrl,
      sortOrder: payload.sortOrder ?? 0,
    },
  });

  return NextResponse.json(image, { status: 201 });
}
