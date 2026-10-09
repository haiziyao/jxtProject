"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/top-nav";
import { Modal } from "@/components/modal";
import { localDate } from "@/lib/dates";

type Tag = {
  id: number;
  name: string;
  color: string;
};

type Experiment = {
  id: number;
  title: string;
  recorder: string;
  expDate: string;
  summary: string;
  tags: Tag[];
};

export default function ExperimentsPage() {
  const router = useRouter();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [expDate, setExpDate] = useState("");

  const [title, setTitle] = useState("");
  const [recorder, setRecorder] = useState("");
  const [summary, setSummary] = useState("");
  const [selectedCreateTagIds, setSelectedCreateTagIds] = useState<number[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#4f78c8");
  const [creatingTag, setCreatingTag] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [expRes, tagRes] = await Promise.all([fetch("/api/experiments"), fetch("/api/tags")]);
        if (!expRes.ok || !tagRes.ok) throw new Error("读取失败");
        const expData = (await expRes.json()) as Experiment[];
        const tagData = (await tagRes.json()) as Tag[];
        setExperiments(expData);
        setTags(tagData);
      } catch { setError("实验记录读取失败，请刷新重试。"); }
      finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filteredExperiments = useMemo(() => {
    if (selectedTagIds.length === 0) return experiments;
    return experiments.filter((exp) => selectedTagIds.some((tagId) => exp.tags.some((tag) => tag.id === tagId)));
  }, [experiments, selectedTagIds]);

  function toggleFilterTag(tagId: number) {
    setSelectedTagIds((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
  }

  function toggleCreateTag(tagId: number) {
    setSelectedCreateTagIds((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creating) return;
    setCreating(true);
    setError("");
    try {
      const response = await fetch("/api/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          recorder,
          expDate,
          summary,
          tagIds: selectedCreateTagIds,
        }),
      });

      if (!response.ok) throw new Error("创建失败");
      const created = (await response.json()) as Experiment;
      router.push(`/experiments/${created.id}`);
    } catch { setError("创建失败，输入内容已保留，请重试。"); }
    finally {
      setCreating(false);
    }
  }

  async function handleDeleteExperiment(id: number) {
    const ok = window.confirm("确认删除这条实验记录？");
    if (!ok) return;
    try {
      const response = await fetch(`/api/experiments/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("删除失败");
      setExperiments((prev) => prev.filter((item) => item.id !== id));
    } catch { setError("删除失败，请重试。"); }
  }

  async function handleCreateTag() {
    if (!newTagName.trim() || creatingTag) return;
    setCreatingTag(true);
    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim(), color: newTagColor }),
      });
      if (!response.ok) throw new Error("标签创建失败");
      const created = (await response.json()) as Tag;
      setTags((prev) => [...prev, created]);
      setSelectedCreateTagIds((prev) => [...prev, created.id]);
      setNewTagName("");
    } catch { setError("标签创建失败，请重试。"); }
    finally {
      setCreatingTag(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-[#2e3e61]">
      <TopNav />
      <main className="mx-auto w-full max-w-[1500px] px-4 pb-12 pt-6 sm:px-6">
        {error && !showCreate ? <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        <section className="min-w-0 rounded-2xl border border-[#dbe5f7] bg-white px-4 py-5 sm:px-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#d9e2f2] pb-4">
            <div>
              <h1 className="text-2xl font-semibold text-[#365fae]">实验记录</h1>
              <p className="mt-1 text-sm text-[#6f84ad]">清单式管理实验条目，创建后进入文档编辑页。</p>
            </div>
            <button
              type="button"
              onClick={() => { setExpDate(localDate()); setError(""); setShowCreate(true); }}
              className="rounded-full border border-[#8ba6da] bg-[#4f78c8] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#416abd]"
            >
              新建实验
            </button>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#7a8fb8]">筛选标签：</span>
            {tags.map((tag) => {
              const active = selectedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleFilterTag(tag.id)}
                  className={active ? "rounded-full border px-3 py-1 text-xs text-white" : "rounded-full border px-3 py-1 text-xs"}
                  style={{
                    borderColor: tag.color,
                    background: active ? tag.color : "white",
                    color: active ? "white" : tag.color,
                  }}
                >
                  {tag.name}
                </button>
              );
            })}
            {selectedTagIds.length > 0 ? (
              <button
                type="button"
                onClick={() => setSelectedTagIds([])}
                className="rounded-full border border-[#c9d8f4] bg-[#f2f6ff] px-3 py-1 text-xs text-[#5473b5]"
              >
                清空
              </button>
            ) : null}
          </div>

          <div className="space-y-3 md:hidden">
            {loading ? <p className="py-6 text-center text-sm text-[#8aa0c9]">加载中…</p> : null}
            {!loading && filteredExperiments.length === 0 ? <p className="py-6 text-center text-sm text-[#8aa0c9]">暂无实验记录</p> : null}
            {!loading && filteredExperiments.map(exp => (
              <article key={exp.id} className="min-w-0 rounded-xl border border-[#dbe5f7] bg-[#fbfdff] p-4">
                <p className="mb-2 text-xs text-[#6280b9]">{exp.expDate} · {exp.recorder}</p>
                <h2 className="break-words text-base font-semibold leading-7 text-[#35579b]"><Link href={`/experiments/${exp.id}?mode=preview`}>{exp.title}</Link></h2>
                <p className="mt-2 line-clamp-3 break-words text-sm leading-6 text-[#4f648e]">{exp.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">{exp.tags.map(tag => <span key={tag.id} className="rounded-full border px-2 py-1 text-xs" style={{ borderColor: tag.color, color: tag.color }}>{tag.name}</span>)}</div>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-[#e1e9f8] pt-3">
                  <Link href={`/experiments/${exp.id}?mode=preview`} className="flex min-h-10 items-center rounded-full border border-[#d7e2f7] px-4 text-sm text-[#365fae]">查看</Link>
                  <Link href={`/experiments/${exp.id}`} className="flex min-h-10 items-center rounded-full border border-[#d7e2f7] px-4 text-sm text-[#6f84ad]">编辑</Link>
                  <button type="button" onClick={() => handleDeleteExperiment(exp.id)} className="min-h-10 rounded-full border border-[#f1d5d5] px-4 text-sm text-[#c06f6f]">删除</button>
                </div>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-[#7a8fb8]">
                  <th className="border-b border-[#d9e2f2] px-3 py-2">日期</th>
                  <th className="border-b border-[#d9e2f2] px-3 py-2">标题</th>
                  <th className="border-b border-[#d9e2f2] px-3 py-2">记录人</th>
                  <th className="border-b border-[#d9e2f2] px-3 py-2">简介</th>
                  <th className="border-b border-[#d9e2f2] px-3 py-2">标签</th>
                  <th className="border-b border-[#d9e2f2] px-3 py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-[#8aa0c9]">
                      加载中...
                    </td>
                  </tr>
                ) : null}
                {!loading && filteredExperiments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-[#8aa0c9]">
                      暂无实验记录
                    </td>
                  </tr>
                ) : null}
                {!loading &&
                  filteredExperiments.map((exp) => (
                    <tr key={exp.id} className="group hover:bg-[#f7faff]">
                      <td className="border-b border-[#eef3fb] px-3 py-3 text-[#6280b9]">{exp.expDate}</td>
                      <td className="border-b border-[#eef3fb] px-3 py-3 font-medium text-[#35579b]">
                        <Link href={`/experiments/${exp.id}?mode=preview`} className="underline-offset-2 group-hover:underline">
                          {exp.title}
                        </Link>
                      </td>
                      <td className="border-b border-[#eef3fb] px-3 py-3 text-[#4f648e]">{exp.recorder}</td>
                      <td className="max-w-[340px] truncate border-b border-[#eef3fb] px-3 py-3 text-[#4f648e]">{exp.summary}</td>
                      <td className="border-b border-[#eef3fb] px-3 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {exp.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="rounded-full border min-h-10 px-3 py-1.5 text-xs"
                              style={{ borderColor: tag.color, color: tag.color }}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="border-b border-[#eef3fb] px-3 py-3">
                        <div className="flex gap-1">
                          <Link
                            href={`/experiments/${exp.id}`}
                            className="rounded-full border border-[#d7e2f7] min-h-10 px-3 py-1.5 text-xs text-[#6f84ad] hover:bg-[#f3f7ff]"
                          >
                            编辑
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteExperiment(exp.id)}
                            className="rounded-full border border-[#f1d5d5] min-h-10 px-3 py-1.5 text-xs text-[#c06f6f] hover:bg-[#fff4f4]"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {showCreate ? (
        <Modal title="新建实验" onClose={() => { if (!creating) setShowCreate(false); }}>
            <form onSubmit={handleCreate} className="space-y-3">
              {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
              <fieldset disabled={creating} className="min-w-0 space-y-3">
              <div>
                <label htmlFor="experiment-date" className="mb-1 block text-xs text-[#6a85bc]">实验日期</label>
                <input id="experiment-date" type="date" required value={expDate} onChange={event => setExpDate(event.target.value)} className="w-full rounded-xl border border-[#bfd0ee] px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#6a85bc]">实验标题</label>
                <input
                  required
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-xl border border-[#bfd0ee] px-3 py-2 text-sm outline-none focus:border-[#5e83cc]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#6a85bc]">实验记录人</label>
                <input
                  required
                  value={recorder}
                  onChange={(event) => setRecorder(event.target.value)}
                  className="w-full rounded-xl border border-[#bfd0ee] px-3 py-2 text-sm outline-none focus:border-[#5e83cc]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#6a85bc]">实验简介</label>
                <textarea
                  required
                  rows={4}
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  className="w-full rounded-xl border border-[#bfd0ee] px-3 py-2 text-sm leading-6 outline-none focus:border-[#5e83cc]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#6a85bc]">标签（可选）</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const active = selectedCreateTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleCreateTag(tag.id)}
                        className={active ? "rounded-full border px-3 py-1 text-xs text-white" : "rounded-full border px-3 py-1 text-xs"}
                        style={{
                          borderColor: tag.color,
                          background: active ? tag.color : "white",
                          color: active ? "white" : tag.color,
                        }}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                  {tags.length === 0 ? <p className="text-xs text-[#8aa0c9]">暂无标签，请先创建。</p> : null}
                </div>
                <div className="mt-3 rounded-xl border border-[#dfe8fa] bg-[#f9fbff] p-3">
                  <p className="mb-2 text-xs text-[#6a85bc]">自定义标签</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={newTagName}
                      onChange={(event) => setNewTagName(event.target.value)}
                      placeholder="标签名称"
                      className="min-w-[140px] flex-1 rounded-xl border border-[#bfd0ee] px-3 py-2 text-xs outline-none focus:border-[#5e83cc]"
                    />
                    <input
                      type="color"
                      value={newTagColor}
                      onChange={(event) => setNewTagColor(event.target.value)}
                      className="h-9 w-12 rounded border border-[#bfd0ee] bg-white p-1"
                    />
                    <button
                      type="button"
                      onClick={handleCreateTag}
                      disabled={creatingTag}
                      className="rounded-full border border-[#9db5e5] bg-[#eff4ff] px-3 py-2 text-xs text-[#365fae] disabled:opacity-60"
                    >
                      {creatingTag ? "创建中..." : "新增标签"}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-full border border-[#bfd0ee] bg-white px-4 py-2 text-xs text-[#6f84ad]"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-full border border-[#8ba6da] bg-[#4f78c8] px-5 py-2 text-xs font-medium text-white disabled:opacity-60"
                >
                  {creating ? "创建中..." : "创建并进入编辑"}
                </button>
              </div>
              </fieldset>
            </form>
        </Modal>
      ) : null}
    </div>
  );
}
