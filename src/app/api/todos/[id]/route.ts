import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { serializeTodo } from "@/lib/todos-db";
import { readObject } from "@/lib/request-body";
import { validId } from "@/lib/experiment-input";

export const dynamic = "force-dynamic";
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!validId(id)) return NextResponse.json({ error: "无效编号" }, { status: 400 });
  const body = await readObject(request);
  if (!body || (body.done === undefined && body.deletedAt === undefined) || (body.done !== undefined && typeof body.done !== "boolean") || (body.deletedAt !== undefined && body.deletedAt !== null && (typeof body.deletedAt !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(body.deletedAt) || Number.isNaN(Date.parse(body.deletedAt)) || new Date(body.deletedAt).toISOString() !== body.deletedAt))) {
    return NextResponse.json({ error: "待办状态格式不正确" }, { status: 400 });
  }
  const data: Prisma.TodoUpdateInput = {};
  if (typeof body.done === "boolean") data.done = body.done;
  if (body.deletedAt !== undefined) data.deletedAt = body.deletedAt === null ? null : new Date(body.deletedAt as string);
  try {
    // Updating only supplied fields preserves concurrent completion and archive changes.
    return NextResponse.json(serializeTodo(await prisma.todo.update({ where: { id }, data })));
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") return NextResponse.json({ error: "待办不存在" }, { status: 404 });
    throw error;
  }
}
