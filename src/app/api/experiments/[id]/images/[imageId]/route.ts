import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validId } from "@/lib/experiment-input";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; imageId: string } },
) {
  const imageId = Number(params.imageId);
  const experimentId = Number(params.id);
  if (!validId(imageId) || !validId(experimentId)) return NextResponse.json({ error: "无效编号" }, { status: 400 });
  const result = await prisma.experimentImage.deleteMany({ where: { id: imageId, experimentId } });
  if (!result.count) return NextResponse.json({ error: "图片不属于此实验或不存在" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
