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

export function loadTodosFromStorage(): TodoItem[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(TODO_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as TodoItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveTodosToStorage(todos: TodoItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
}

