import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const attachments = await prisma.projectAttachment.findMany({ orderBy: { uploadedAt: "desc" } });
  return NextResponse.json(
    attachments.map((attachment) => ({
      ...attachment,
      fileSize: attachment.fileSize?.toString() ?? null,
    })),
  );
}

export async function POST(request: NextRequest) {
  const { name, fileUrl, fileSize } = await request.json();

  if (!name || !fileUrl) {
    return NextResponse.json({ error: "name 和 fileUrl 为必填项" }, { status: 400 });
  }

  const attachment = await prisma.projectAttachment.create({
    data: {
      name,
      fileUrl,
      fileSize: fileSize ? BigInt(fileSize) : null,
    },
  });

  return NextResponse.json(
    {
      ...attachment,
      fileSize: attachment.fileSize?.toString() ?? null,
    },
    { status: 201 },
  );
}
