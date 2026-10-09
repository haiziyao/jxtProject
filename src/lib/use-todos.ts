"use client";

import { useEffect, useRef, useState } from "react";
import { loadTodosFromStorage, saveTodosToStorage, TodoItem } from "@/lib/todo-store";

export function useTodos() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  useEffect(() => {
    let active = true;
    loadTodosFromStorage().then(value => { if (active) setTodos(value); })
      .catch(() => { if (active) setError("待办读取失败，请刷新重试。"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  async function updateTodos(next: TodoItem[]) {
    if (pending.current || loading) return false;
    pending.current = true;
    setSaving(true);
    setError("");
    try {
      setTodos(await saveTodosToStorage(next, todos));
      return true;
    } catch { setError("待办保存失败，输入内容已保留，请重试。"); return false; }
    finally { pending.current = false; setSaving(false); }
  }
  return { todos, loading, saving, error, updateTodos };
}
