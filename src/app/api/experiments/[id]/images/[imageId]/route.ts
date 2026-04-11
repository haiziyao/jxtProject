import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; imageId: string } },
) {
  const imageId = Number(params.imageId);
  await prisma.experimentImage.delete({ where: { id: imageId } });
  return NextResponse.json({ ok: true });
}
