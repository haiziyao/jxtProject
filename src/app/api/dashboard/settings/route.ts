import { NextRequest, NextResponse } from "next/server";
import type { DashboardSetting, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { readObject } from "@/lib/request-body";

export const dynamic = "force-dynamic";
function serialize(row: DashboardSetting) {
  return { projectName: row.projectName, teamMembers: row.teamMembers, advisors: row.advisors, progressSteps: Array.isArray(row.progressSteps) ? row.progressSteps.filter(item => typeof item === "string") : [] };
}
async function readSettings() { return prisma.dashboardSetting.findFirst({ orderBy: { id: "asc" } }); }
export async function GET() {
  const row = await readSettings();
  return row ? NextResponse.json(serialize(row)) : NextResponse.json({ error: "项目设置不存在" }, { status: 404 });
}
export async function PUT(request: NextRequest) {
  const body = await readObject(request);
  if (!body) return NextResponse.json({ error: "无效请求" }, { status: 400 });
  const data: Prisma.DashboardSettingUpdateInput = {};
  for (const field of ["projectName", "teamMembers", "advisors"] as const) {
    if (body[field] === undefined) continue;
    const value = body[field];
    if (typeof value !== "string" || value.length > 100000 || (field === "projectName" && !value.trim())) return NextResponse.json({ error: "设置格式不正确" }, { status: 400 });
    data[field] = value.trim();
  }
  if (body.progressSteps !== undefined) {
    const value = body.progressSteps;
    if (!Array.isArray(value) || value.length > 100 || value.some(item => typeof item !== "string" || item.length > 10000)) return NextResponse.json({ error: "进度格式不正确" }, { status: 400 });
    data.progressSteps = value;
  }
  if (!Object.keys(data).length) return NextResponse.json({ error: "没有可更新字段" }, { status: 400 });
  const row = await readSettings();
  if (!row) return NextResponse.json({ error: "项目设置不存在" }, { status: 404 });
  return NextResponse.json(serialize(await prisma.dashboardSetting.update({ where: { id: row.id }, data })));
}
