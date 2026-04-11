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

export const DEFAULT_TODOS: TodoItem[] = [
  {
    id: 1,
    title: "整理本周实验结果",
    level: "critical",
    dueDate: "2026-04-14",
    detail: "需要在组会前完成图表与结论。",
    done: false,
    deletedAt: null,
    createdAt: "2026-04-11T09:00:00.000Z",
  },
  {
    id: 2,
    title: "补充实验条件说明",
    level: "high",
    dueDate: "2026-04-16",
    detail: "把仪器参数写入项目介绍附录。",
    done: false,
    deletedAt: null,
    createdAt: "2026-04-11T09:10:00.000Z",
  },
  {
    id: 3,
    title: "归档历史附件",
    level: "medium",
    dueDate: "2026-04-20",
    detail: "检查命名规范并补齐下载说明。",
    done: false,
    deletedAt: null,
    createdAt: "2026-04-11T09:20:00.000Z",
  },
];

export function loadTodosFromStorage(): TodoItem[] {
  if (typeof window === "undefined") return DEFAULT_TODOS;
  const raw = window.localStorage.getItem(TODO_STORAGE_KEY);
  if (!raw) return DEFAULT_TODOS;
  try {
    const parsed = JSON.parse(raw) as TodoItem[];
    if (!Array.isArray(parsed)) return DEFAULT_TODOS;
    return parsed;
  } catch {
    return DEFAULT_TODOS;
  }
}

export function saveTodosToStorage(todos: TodoItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
}
