import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const experimentId = Number(params.id);
  const payload = await request.json();

  if (!payload.imageUrl) {
    return NextResponse.json({ error: "imageUrl 必填" }, { status: 400 });
  }

  const image = await prisma.experimentImage.create({
    data: {
      experimentId,
      imageUrl: payload.imageUrl,
      sortOrder: payload.sortOrder ?? 0,
    },
  });

  return NextResponse.json(image, { status: 201 });
}
