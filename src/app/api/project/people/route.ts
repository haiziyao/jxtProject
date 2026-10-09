import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export async function GET() {
  const [members, advisors] = await Promise.all([
    prisma.teamMember.findMany({ orderBy: { id: "asc" }, select: { id: true, name: true, className: true, phone: true, studentNo: true } }),
    prisma.advisor.findMany({ orderBy: { id: "asc" }, select: { id: true, name: true, contact: true } }),
  ]);
  return NextResponse.json({ members, advisors });
}
