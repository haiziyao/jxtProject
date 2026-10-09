import { NextRequest, NextResponse } from "next/server";
import { getObjectNameFromUrl } from "@/lib/minio";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const attachments = await prisma.projectAttachment.findMany({ orderBy: { uploadedAt: "desc" } });
  return NextResponse.json(attachments.map(attachment => ({ ...attachment, fileSize: attachment.fileSize?.toString() ?? null })));
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const { name, fileUrl, fileSize } = payload || {};

  if (typeof name !== "string" || !name.trim() || name.length > 200 || typeof fileUrl !== "string" || fileUrl.length > 500 || !getObjectNameFromUrl(fileUrl) || (fileSize !== undefined && fileSize !== null && !/^(0|[1-9][0-9]{0,18})$/.test(String(fileSize)))) {
    return NextResponse.json({ error: "name 和 fileUrl 为必填项" }, { status: 400 });
  }

  const size = fileSize === undefined || fileSize === null ? null : BigInt(fileSize);
  if (size !== null && size > BigInt("9223372036854775807")) return NextResponse.json({ error: "文件大小不正确" }, { status: 400 });

  const attachment = await prisma.projectAttachment.create({
    data: {
      name: name.trim(),
      fileUrl,
      fileSize: size,
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
