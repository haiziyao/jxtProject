import { prisma } from "@/lib/prisma";
import type { Todo } from "@prisma/client";
import type { TodoItem } from "@/lib/todo-store";

export function serializeTodo(row: Todo): TodoItem {
  return { id: row.id, title: row.title, level: row.level, dueDate: row.dueDate.toISOString().slice(0, 10), detail: row.detail, done: row.done, deletedAt: row.deletedAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString() };
}
export async function readTodos(): Promise<TodoItem[]> {
  return (await prisma.todo.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }] })).map(serializeTodo);
}
