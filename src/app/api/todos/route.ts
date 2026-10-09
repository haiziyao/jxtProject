import { NextRequest, NextResponse } from "next/server";
import type { TodoPriority } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { readTodos, serializeTodo } from "@/lib/todos-db";
import { isCalendarDate } from "@/lib/dates";
import { fitsText, readObject } from "@/lib/request-body";

export const dynamic = "force-dynamic";
export async function GET() { return NextResponse.json(await readTodos()); }
export async function POST(request: NextRequest) {
  const body = await readObject(request);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!body || !title || title.length > 200 || typeof body.level !== "string" || !["critical", "high", "medium", "low"].includes(body.level) || !isCalendarDate(body.dueDate) || typeof body.detail !== "string" || !fitsText(body.detail)) {
    return NextResponse.json({ error: "待办格式不正确" }, { status: 400 });
  }
  const row = await prisma.todo.create({ data: { title, level: body.level as TodoPriority, dueDate: new Date(body.dueDate as string), detail: body.detail } });
  return NextResponse.json(serializeTodo(row), { status: 201 });
}
