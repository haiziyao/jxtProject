import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  await prisma.projectAttachment.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
