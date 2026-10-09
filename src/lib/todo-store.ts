export type TodoLevel = "critical" | "high" | "medium" | "low";

export type TodoItem = {
  id: number;
  title: string;
  level: TodoLevel;
  dueDate: string;
  detail: string;
  done: boolean;
  deletedAt: string | null;
  createdAt: string;
};

export const TODO_STORAGE_KEY = "lab_todos_v1";

export const DEFAULT_TODOS: TodoItem[] = [];

export async function loadTodosFromStorage(): Promise<TodoItem[]> {
  const response = await fetch("/api/todos", { cache: "no-store" });
  if (!response.ok) throw new Error("待办读取失败");
  return response.json();
}

export async function saveTodosToStorage(todos: TodoItem[], previous: TodoItem[]): Promise<TodoItem[]> {
  const existing = new Map(previous.map(item => [item.id, item]));
  const saved: TodoItem[] = [];
  for (const item of todos) {
    const old = existing.get(item.id);
    if (old && JSON.stringify(old) === JSON.stringify(item)) { saved.push(item); continue; }
    const response = await fetch(old ? `/api/todos/${item.id}` : "/api/todos", {
      method: old ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(old ? {
        ...(item.done !== old.done ? { done: item.done } : {}),
        ...(item.deletedAt !== old.deletedAt ? { deletedAt: item.deletedAt } : {}),
      } : item),
    });
    if (!response.ok) throw new Error("待办保存失败");
    saved.push(await response.json() as TodoItem);
  }
  return saved;
}
