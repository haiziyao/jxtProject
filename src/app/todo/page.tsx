"use client";

import { FormEvent, useMemo, useState } from "react";
import { TopNav } from "@/components/top-nav";
import { TodoLevel } from "@/lib/todo-store";
import { useTodos } from "@/lib/use-todos";

export default function TodoPage() {
  const { todos, loading, saving, error, updateTodos } = useTodos();
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState<TodoLevel>("medium");
  const [dueDate, setDueDate] = useState("");
  const [detail, setDetail] = useState("");

  const activeTodos = useMemo(() => todos.filter((todo) => !todo.deletedAt), [todos]);
  const historyTodos = useMemo(() => todos.filter((todo) => !!todo.deletedAt), [todos]);
  const pendingCount = useMemo(() => activeTodos.filter((todo) => !todo.done).length, [activeTodos]);

  function levelClass(value: TodoLevel) {
    if (value === "critical") return "bg-red-500";
    if (value === "high") return "bg-orange-500";
    if (value === "medium") return "bg-yellow-400";
    return "bg-green-500";
  }

  async function createTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !dueDate || !detail.trim()) return;
    const saved = await updateTodos([
      {
        id: Date.now(),
        title: title.trim(),
        level,
        dueDate,
        detail: detail.trim(),
        done: false,
        deletedAt: null,
        createdAt: new Date().toISOString(),
      },
      ...todos,
    ]);
    if (!saved) return;
    setTitle("");
    setLevel("medium");
    setDueDate("");
    setDetail("");
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-[#2e3e61]">
      <TopNav />
      <main className="mx-auto w-full max-w-[1400px] px-4 pb-12 pt-6 sm:px-6">
        {error ? <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        <fieldset disabled={loading || saving} className="min-w-0">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="min-w-0 rounded-2xl border border-[#dbe5f7] bg-white px-4 py-5 sm:px-6">
            <h1 className="mb-3 text-2xl font-semibold text-[#365fae]">Make TODO（意见反馈）</h1>
            <p className="mb-4 text-sm text-[#6f84ad]">意见反馈内容就是 TODO 详情。删除采用逻辑删除，可在历史区查看。</p>
            <form onSubmit={createTodo} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-[#6a85bc]">TODO 标题</label>
                <input
                  required
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-xl border border-[#bfd0ee] px-3 py-2 text-sm outline-none focus:border-[#5e83cc]"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-[#6a85bc]">紧急程度</label>
                  <select
                    value={level}
                    onChange={(event) => setLevel(event.target.value as TodoLevel)}
                    className="w-full rounded-xl border border-[#bfd0ee] bg-white px-3 py-2 text-sm outline-none focus:border-[#5e83cc]"
                  >
                    <option value="critical">红色（紧急）</option>
                    <option value="high">橙色（较高）</option>
                    <option value="medium">黄色（普通）</option>
                    <option value="low">绿色（低）</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#6a85bc]">截止日期</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    className="w-full rounded-xl border border-[#bfd0ee] px-3 py-2 text-sm outline-none focus:border-[#5e83cc]"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#6a85bc]">意见反馈详情（TODO 详情）</label>
                <textarea
                  required
                  rows={8}
                  value={detail}
                  onChange={(event) => setDetail(event.target.value)}
                  className="w-full rounded-xl border border-[#bfd0ee] px-3 py-2 text-sm leading-6 outline-none focus:border-[#5e83cc]"
                  placeholder="请写清楚问题背景、具体建议、期望结果。"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-full border border-[#8ba6da] bg-[#4f78c8] px-5 py-2 text-xs font-medium text-white transition hover:bg-[#416abd]"
                >
                  {saving ? "保存中…" : "创建 TODO"}
                </button>
              </div>
            </form>
          </section>

          <section className="min-w-0 space-y-6">
            <section className="min-w-0 rounded-2xl border border-[#dbe5f7] bg-white px-5 py-5">
              <h2 className="mb-3 text-xl font-semibold text-[#365fae]">当前 TODO</h2>
              <div className="mb-3 text-xs text-[#8aa0c9]">待处理：{pendingCount} 项</div>
              <ul className="space-y-2">
                {activeTodos.map((item) => (
                  <li key={item.id} className="rounded-lg border border-[#e1e9f8] bg-[#fbfdff] px-3 py-2">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`h-3.5 w-3.5 rounded-full ${levelClass(item.level)}`} />
                          <p className={item.done ? "truncate text-sm text-[#93a4c7] line-through" : "truncate text-sm text-[#35579b]"}>{item.title}</p>
                        </div>
                        <p className="mt-1 break-words text-xs text-[#7b8fb7]">截止：{item.dueDate}</p>
                        <p className={item.done ? "mt-1 break-words text-xs text-[#9eb0d1] line-through" : "mt-1 break-words text-xs text-[#4f648e]"}>{item.detail}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateTodos(todos.map((todo) => (todo.id === item.id ? { ...todo, done: !todo.done } : todo)))
                          }
                          className="rounded-full border border-[#d7e2f7] min-h-10 px-3 py-1.5 text-xs text-[#6f84ad] hover:bg-[#f3f7ff]"
                        >
                          {item.done ? "撤销" : "完成"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateTodos(
                              todos.map((todo) =>
                                todo.id === item.id ? { ...todo, deletedAt: new Date().toISOString() } : todo,
                              ),
                            )
                          }
                          className="rounded-full border border-[#f1d5d5] min-h-10 px-3 py-1.5 text-xs text-[#c06f6f] hover:bg-[#fff4f4]"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
                {activeTodos.length === 0 ? <li className="text-xs text-[#8aa0c9]">{loading ? "待办加载中…" : "暂无当前 TODO。"}</li> : null}
              </ul>
            </section>

            <section className="min-w-0 rounded-2xl border border-[#dbe5f7] bg-white px-5 py-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#365fae]">历史 TODO（逻辑删除）</h2>

              </div>
              <ul className="space-y-2">
                {historyTodos.map((item) => (
                  <li key={item.id} className="rounded-lg border border-[#e7edf9] bg-[#f7f9fe] px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-3.5 w-3.5 rounded-full ${levelClass(item.level)}`} />
                      <p className="truncate text-sm text-[#6e84b2] line-through">{item.title}</p>
                    </div>
                    <p className="mt-1 break-words text-xs text-[#90a2c4]">删除时间：{item.deletedAt ? new Date(item.deletedAt).toLocaleString("zh-CN") : "-"}</p>
                    <p className="mt-1 break-words text-xs text-[#8da0c1]">{item.detail}</p>
                    <button type="button" onClick={() => updateTodos(todos.map(todo => todo.id === item.id ? { ...todo, deletedAt: null } : todo))} className="mt-2 min-h-10 rounded-full border border-[#d7e2f7] px-3 text-xs text-[#365fae]">恢复待办</button>
                  </li>
                ))}
                {historyTodos.length === 0 ? <li className="text-xs text-[#8aa0c9]">暂无历史 TODO。</li> : null}
              </ul>
            </section>
          </section>
        </div>
        </fieldset>
      </main>
    </div>
  );
}
