"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { TopNav } from "@/components/top-nav";
import {
  DEFAULT_TODOS,
  loadTodosFromStorage,
  saveTodosToStorage,
  TodoItem,
  TodoLevel,
} from "@/lib/todo-store";

type ProjectSection = {
  id: number;
  title: string;
  content: string;
  sortOrder: number;
};

type Attachment = {
  id: number;
  name: string;
  fileUrl: string;
  fileSize: string | null;
};

const PROGRESS_STORAGE_KEY = "dashboard_progress_steps_v3";
const META_STORAGE_KEY = "dashboard_project_meta_v1";
const DEFAULT_STEPS = ["完成任务1", "任务2", "任务3", "总结归档"];
const DEFAULT_META = {
  projectName: "避雷器高性能高电位梯度氧化锌\n压敏电阻片的研发和应用",
  teamMembers: "张三\n李四\n王五\n赵六\n钱七",
  advisors: "指导老师A\n指导老师B",
};
function buildProxyPreviewUrl(fileUrl: string) {
  return `/api/files/proxy?url=${encodeURIComponent(fileUrl)}`;
}

function buildProxyDownloadUrl(fileUrl: string, name: string) {
  return `/api/files/proxy?url=${encodeURIComponent(fileUrl)}&download=1&name=${encodeURIComponent(name)}`;
}

function formatFileSize(size: string | null) {
  if (!size) return "-";
  const value = Number(size);
  if (!Number.isFinite(value) || value <= 0) return "-";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function canPreview(url: string) {
  const lower = url.toLowerCase();
  return (
    lower.endsWith(".pdf") ||
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".gif")
  );
}

export default function DashboardPage() {
  const [sections, setSections] = useState<ProjectSection[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);

  const [introEditing, setIntroEditing] = useState(false);
  const [introDraft, setIntroDraft] = useState("");
  const [savingIntro, setSavingIntro] = useState(false);

  const [progressEditing, setProgressEditing] = useState(false);
  const [progressSteps, setProgressSteps] = useState<string[]>(DEFAULT_STEPS);
  const [progressDraft, setProgressDraft] = useState(DEFAULT_STEPS.join("\n"));
  const [metaEditing, setMetaEditing] = useState(false);
  const [projectMeta, setProjectMeta] = useState(DEFAULT_META);
  const [metaDraft, setMetaDraft] = useState(DEFAULT_META);
  const [todos, setTodos] = useState<TodoItem[]>(DEFAULT_TODOS);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [todoModalOpen, setTodoModalOpen] = useState(false);
  const [suggestionTitle, setSuggestionTitle] = useState("");
  const [suggestionLevel, setSuggestionLevel] = useState<TodoLevel>("medium");
  const [suggestionDueDate, setSuggestionDueDate] = useState("");
  const [suggestionDetail, setSuggestionDetail] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as string[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setProgressSteps(parsed);
        setProgressDraft(parsed.join("\n"));
      }
    } catch {
      // ignore malformed cache
    }
  }, []);

  useEffect(() => {
    setTodos(loadTodosFromStorage());
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(META_STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as typeof DEFAULT_META;
      if (parsed?.projectName && parsed?.teamMembers && parsed?.advisors) {
        setProjectMeta(parsed);
        setMetaDraft(parsed);
      }
    } catch {
      // ignore malformed cache
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [sectionsRes, attachmentsRes] = await Promise.all([
          fetch("/api/project/sections"),
          fetch("/api/project/attachments"),
        ]);
        const sectionsData = sectionsRes.ok ? ((await sectionsRes.json()) as ProjectSection[]) : [];
        const attachmentsData = attachmentsRes.ok ? ((await attachmentsRes.json()) as Attachment[]) : [];
        setSections(sectionsData);
        setAttachments(attachmentsData);
        setIntroDraft(sectionsData[0]?.content ?? "");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const introSection = useMemo(() => sections[0], [sections]);
  const experimentCount = useMemo(() => attachments.length + sections.length * 2, [attachments.length, sections.length]);
  const thisWeekAdded = useMemo(() => Math.max(attachments.length, 1), [attachments.length]);
  const activePeople = useMemo(() => Math.max(Math.min(progressSteps.length + 1, 7), 1), [progressSteps.length]);
  const activeTodos = useMemo(() => todos.filter((item) => !item.deletedAt), [todos]);
  const todoCount = useMemo(() => activeTodos.filter((item) => !item.done).length, [activeTodos]);

  function updateTodos(next: TodoItem[]) {
    setTodos(next);
    saveTodosToStorage(next);
  }

  async function saveIntro(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingIntro) return;
    setSavingIntro(true);
    try {
      if (introSection) {
        await fetch(`/api/project/sections/${introSection.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: introSection.title,
            content: introDraft,
            sortOrder: introSection.sortOrder,
          }),
        });
        setSections((prev) => prev.map((item) => (item.id === introSection.id ? { ...item, content: introDraft } : item)));
      } else {
        const response = await fetch("/api/project/sections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "项目介绍",
            content: introDraft,
            sortOrder: 0,
          }),
        });
        if (response.ok) {
          const created = (await response.json()) as ProjectSection;
          setSections([created]);
        }
      }
      setIntroEditing(false);
    } finally {
      setSavingIntro(false);
    }
  }

  function saveProgress() {
    const next = progressDraft
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const resolved = next.length > 0 ? next : DEFAULT_STEPS;
    setProgressSteps(resolved);
    setProgressDraft(resolved.join("\n"));
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(resolved));
    setProgressEditing(false);
  }

  function saveMeta() {
    const resolved = {
      projectName: metaDraft.projectName.trim() || DEFAULT_META.projectName,
      teamMembers: metaDraft.teamMembers.trim() || DEFAULT_META.teamMembers,
      advisors: metaDraft.advisors.trim() || DEFAULT_META.advisors,
    };
    setProjectMeta(resolved);
    setMetaDraft(resolved);
    window.localStorage.setItem(META_STORAGE_KEY, JSON.stringify(resolved));
    setMetaEditing(false);
  }

  function urgencyClass(level: TodoLevel) {
    if (level === "critical") return "bg-red-500";
    if (level === "high") return "bg-orange-500";
    if (level === "medium") return "bg-yellow-400";
    return "bg-green-500";
  }

  async function handleUploadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || uploadingFile) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        return;
      }

      const uploadData = (await uploadRes.json()) as { url: string };
      const attachRes = await fetch("/api/project/attachments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          fileUrl: uploadData.url,
          fileSize: String(file.size),
        }),
      });

      if (attachRes.ok) {
        const created = (await attachRes.json()) as Attachment;
        setAttachments((prev) => [created, ...prev]);
      }
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleDeleteFile(fileId: number) {
    const response = await fetch(`/api/project/attachments/${fileId}`, {
      method: "DELETE",
    });
    if (!response.ok) return;
    setAttachments((prev) => prev.filter((item) => item.id !== fileId));
  }

  function submitSuggestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!suggestionTitle.trim() || !suggestionDetail.trim() || !suggestionDueDate) return;
    const next = [
      {
        id: Date.now(),
        title: suggestionTitle.trim(),
        level: suggestionLevel,
        dueDate: suggestionDueDate,
        detail: suggestionDetail.trim(),
        done: false,
        deletedAt: null,
        createdAt: new Date().toISOString(),
      },
      ...todos,
    ];
    updateTodos(next);
    setSuggestionTitle("");
    setSuggestionLevel("medium");
    setSuggestionDueDate("");
    setSuggestionDetail("");
    setTodoModalOpen(false);
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-[#2e3e61]">
      <TopNav onCreateTodoToolClick={() => setTodoModalOpen(true)} />

      <main className="mx-auto w-full max-w-[1500px] px-4 pb-12 pt-6 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)_330px]">
          <aside className="rounded-2xl border border-[#d5e0f6] bg-[#edf3ff] p-5 lg:sticky lg:top-24 lg:h-fit">
            <div className="mb-4 flex items-center justify-between border-b border-[#d2def5] pb-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[#6a85bc]">基础信息</p>
              <button
                type="button"
                onClick={() => setMetaEditing((prev) => !prev)}
                className="rounded-full border border-[#9db5e5] bg-white px-3 py-1 text-xs text-[#365fae] transition hover:bg-[#e4edff]"
              >
                {metaEditing ? "取消" : "编辑"}
              </button>
            </div>

            {metaEditing ? (
              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-xs text-[#6a85bc]">项目名称</p>
                  <textarea
                    rows={3}
                    value={metaDraft.projectName}
                    onChange={(event) => setMetaDraft((prev) => ({ ...prev, projectName: event.target.value }))}
                    className="w-full rounded-xl border border-[#bfd0ee] bg-white px-3 py-2 text-sm leading-6 text-[#2e3e61] outline-none focus:border-[#5e83cc]"
                  />
                </div>
                <div className="border-t border-[#d2def5]" />
                <div>
                  <p className="mb-1 text-xs text-[#6a85bc]">队伍成员（每行一人）</p>
                  <textarea
                    rows={5}
                    value={metaDraft.teamMembers}
                    onChange={(event) => setMetaDraft((prev) => ({ ...prev, teamMembers: event.target.value }))}
                    className="w-full rounded-xl border border-[#bfd0ee] bg-white px-3 py-2 text-sm leading-6 text-[#2e3e61] outline-none focus:border-[#5e83cc]"
                  />
                </div>
                <div className="border-t border-[#d2def5]" />
                <div>
                  <p className="mb-1 text-xs text-[#6a85bc]">指导老师（每行一人）</p>
                  <textarea
                    rows={3}
                    value={metaDraft.advisors}
                    onChange={(event) => setMetaDraft((prev) => ({ ...prev, advisors: event.target.value }))}
                    className="w-full rounded-xl border border-[#bfd0ee] bg-white px-3 py-2 text-sm leading-6 text-[#2e3e61] outline-none focus:border-[#5e83cc]"
                  />
                </div>
                <button
                  type="button"
                  onClick={saveMeta}
                  className="rounded-full border border-[#8ba6da] bg-[#4f78c8] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#416abd]"
                >
                  保存基础信息
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <p className="text-xs text-[#6a85bc]">项目名称</p>
                  <h1 className="mt-2 whitespace-pre-line text-2xl leading-tight text-[#3a5fa9]">{projectMeta.projectName}</h1>
                </div>
                <div className="border-t border-[#d2def5]" />
                <div>
                  <p className="text-xs text-[#6a85bc]">队伍成员</p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#6279a8]">{projectMeta.teamMembers}</p>
                </div>
                <div className="border-t border-[#d2def5]" />
                <div>
                  <p className="text-xs text-[#6a85bc]">指导老师</p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#6279a8]">{projectMeta.advisors}</p>
                </div>
              </div>
            )}
          </aside>

          <section className="space-y-7">
            <section id="intro" className="rounded-2xl border border-[#dbe5f7] bg-white px-6 py-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#365fae]">项目介绍</h2>
                <button
                  type="button"
                  onClick={() => setIntroEditing((prev) => !prev)}
                  className="rounded-full border border-[#9db5e5] bg-[#eff4ff] px-4 py-1.5 text-xs text-[#365fae] transition hover:bg-[#e4edff]"
                >
                  {introEditing ? "取消编辑" : "编辑介绍"}
                </button>
              </div>

              {introEditing ? (
                <form onSubmit={saveIntro} className="space-y-3">
                  <textarea
                    value={introDraft}
                    onChange={(event) => setIntroDraft(event.target.value)}
                    rows={13}
                    className="w-full rounded-xl border border-[#bfd0ee] bg-white px-3 py-3 text-sm leading-7 text-[#2e3e61] outline-none focus:border-[#5e83cc]"
                    placeholder="在这里填写项目介绍..."
                  />
                  <button
                    type="submit"
                    disabled={savingIntro}
                    className="rounded-full border border-[#8ba6da] bg-[#4f78c8] px-5 py-2 text-xs font-medium text-white transition hover:bg-[#416abd] disabled:opacity-60"
                  >
                    {savingIntro ? "保存中..." : "保存介绍"}
                  </button>
                </form>
              ) : (
                <p className="min-h-[260px] whitespace-pre-line text-sm leading-8 text-[#465a84]">
                  {loading
                    ? "项目介绍加载中..."
                    : introSection?.content || "暂无项目介绍内容，点击“编辑介绍”开始填写。"}
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-[#dbe5f7] bg-white px-6 py-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#365fae]">进度管理</h2>
                <button
                  type="button"
                  onClick={() => setProgressEditing((prev) => !prev)}
                  className="rounded-full border border-[#9db5e5] bg-[#eff4ff] px-4 py-1.5 text-xs text-[#365fae] transition hover:bg-[#e4edff]"
                >
                  {progressEditing ? "取消编辑" : "编辑进度"}
                </button>
              </div>

              {progressEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={progressDraft}
                    onChange={(event) => setProgressDraft(event.target.value)}
                    rows={5}
                    className="w-full rounded-xl border border-[#bfd0ee] bg-white px-3 py-2 text-sm text-[#2e3e61] outline-none focus:border-[#5e83cc]"
                    placeholder="每行一个阶段，例如：完成任务1"
                  />
                  <button
                    type="button"
                    onClick={saveProgress}
                    className="rounded-full border border-[#8ba6da] bg-[#4f78c8] px-5 py-2 text-xs font-medium text-white transition hover:bg-[#416abd]"
                  >
                    保存进度
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="flex min-w-max items-center gap-2 text-sm">
                    {progressSteps.map((step, index) => (
                      <div key={`${step}-${index}`} className="flex items-center gap-2">
                        <span
                          className={
                            index === 0
                              ? "rounded-full border border-[#95afe0] bg-[#eaf0fd] px-4 py-1.5 text-[#355da9]"
                              : "rounded-full border border-[#c9d8f4] bg-white px-4 py-1.5 text-[#5a6f98]"
                          }
                        >
                          {step}
                        </span>
                        {index < progressSteps.length - 1 ? <span className="text-[#7994c9]">→</span> : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-[#dbe5f7] bg-white px-6 py-5">
              <h2 className="mb-4 text-xl font-semibold text-[#365fae]">实验记录统计</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[#cfdbf2] bg-[#fbfdff] px-3 py-3">
                  <p className="text-xs text-[#7a8fb8]">总记录数</p>
                  <p className="mt-2 text-2xl font-semibold text-[#365fae]">{experimentCount}</p>
                </div>
                <div className="rounded-xl border border-[#cfdbf2] bg-[#fbfdff] px-3 py-3">
                  <p className="text-xs text-[#7a8fb8]">本周新增</p>
                  <p className="mt-2 text-2xl font-semibold text-[#365fae]">{thisWeekAdded}</p>
                </div>
                <div className="rounded-xl border border-[#cfdbf2] bg-[#fbfdff] px-3 py-3">
                  <p className="text-xs text-[#7a8fb8]">活跃成员</p>
                  <p className="mt-2 text-2xl font-semibold text-[#365fae]">{activePeople}</p>
                </div>
              </div>
            </section>
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-[#dbe5f7] bg-white px-5 py-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#365fae]">文件区</h2>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  className="rounded-full border border-[#9db5e5] bg-[#eff4ff] px-3 py-1.5 text-xs text-[#365fae] transition hover:bg-[#e4edff] disabled:opacity-60"
                >
                  {uploadingFile ? "上传中..." : "上传文件"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleUploadFile}
                />
              </div>
              <div className="border-b border-[#d9e2f2] pb-2 text-xs uppercase tracking-wider text-[#7a8fb8]">
                预览 / 下载
              </div>

              {loading ? <p className="py-6 text-sm text-[#7a8fb8]">加载中...</p> : null}

              {!loading && attachments.length === 0 ? (
                <p className="py-6 text-sm text-[#7a8fb8]">暂无文件。</p>
              ) : null}

              {!loading && attachments.length > 0 ? (
                <div className="max-h-[280px] divide-y divide-[#d9e2f2] overflow-y-auto pr-1">
                  {attachments.map((file) => (
                    <div key={file.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-[#35579b]">{file.name}</p>
                        <p className="mt-0.5 text-xs text-[#7a8fb8]">{formatFileSize(file.fileSize)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 text-xs">
                        {canPreview(file.fileUrl) ? (
                          <a
                            href={buildProxyPreviewUrl(file.fileUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#3e68b8] underline-offset-2 hover:underline"
                          >
                            预览
                          </a>
                        ) : (
                          <span className="text-[#a1b2d5]">不可预览</span>
                        )}
                        <a
                          href={buildProxyDownloadUrl(file.fileUrl, file.name)}
                          className="text-[#3e68b8] underline-offset-2 hover:underline"
                        >
                          下载
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteFile(file.id)}
                          className="rounded-full border border-[#d7e2f7] px-2 py-0.5 text-[#8aa0c9] hover:bg-[#f3f7ff]"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-[#dbe5f7] bg-white px-5 py-5">
              <h2 className="mb-3 text-xl font-semibold text-[#365fae]">TODO 摘要</h2>
              <ul className="space-y-2 text-sm text-[#4f648e]">
                {activeTodos.map((todo) => (
                  <li key={todo.id} className="rounded-lg border border-[#e1e9f8] bg-[#fbfdff] px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="relative inline-flex h-5 w-5 items-center justify-center group/urgency">
                        <span className={`h-3.5 w-3.5 rounded-full ${urgencyClass(todo.level)}`} />
                        <span className="pointer-events-none absolute left-6 top-1/2 z-20 hidden min-w-[220px] -translate-y-1/2 rounded-lg border border-[#d9e2f2] bg-white px-3 py-2 text-xs text-[#49608f] shadow-[0_10px_20px_rgba(79,120,200,0.2)] group-hover/urgency:block">
                          截止日期：{todo.dueDate}
                          <br />
                          备注：{todo.detail}
                        </span>
                      </span>
                        <span className={todo.done ? "truncate text-[#93a4c7] line-through" : "truncate"}>{todo.title}</span>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateTodos(todos.map((item) => (item.id === todo.id ? { ...item, done: !item.done } : item)))
                          }
                          className="rounded-full border border-[#d7e2f7] px-2 py-0.5 text-xs text-[#6f84ad] hover:bg-[#f3f7ff]"
                        >
                          {todo.done ? "撤销" : "完成"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateTodos(
                              todos.map((item) =>
                                item.id === todo.id ? { ...item, deletedAt: new Date().toISOString() } : item,
                              ),
                            )
                          }
                          className="rounded-full border border-[#f1d5d5] px-2 py-0.5 text-xs text-[#c06f6f] hover:bg-[#fff4f4]"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-[#8aa0c9]">待处理总数：{todoCount}</p>
            </section>
          </aside>
        </div>
      </main>

      {todoModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#1f2d4a]/25 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#d2ddf4] bg-white p-5 shadow-[0_20px_45px_rgba(68,98,160,0.25)]">
            <div className="mb-4 flex items-center justify-between border-b border-[#d9e2f2] pb-3">
              <h2 className="text-lg font-semibold text-[#365fae]">创建 TODO 建议</h2>
              <button
                type="button"
                onClick={() => setTodoModalOpen(false)}
                className="rounded-full border border-[#bfd0ee] px-3 py-1 text-xs text-[#6f84ad]"
              >
                关闭
              </button>
            </div>
            <form onSubmit={submitSuggestion} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-[#6a85bc]">建议标题</label>
                <input
                  required
                  value={suggestionTitle}
                  onChange={(event) => setSuggestionTitle(event.target.value)}
                  className="w-full rounded-xl border border-[#bfd0ee] px-3 py-2 text-sm outline-none focus:border-[#5e83cc]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-[#6a85bc]">紧急程度</label>
                  <select
                    value={suggestionLevel}
                    onChange={(event) => setSuggestionLevel(event.target.value as TodoLevel)}
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
                    value={suggestionDueDate}
                    onChange={(event) => setSuggestionDueDate(event.target.value)}
                    className="w-full rounded-xl border border-[#bfd0ee] px-3 py-2 text-sm outline-none focus:border-[#5e83cc]"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#6a85bc]">详细建议</label>
                <textarea
                  required
                  rows={5}
                  value={suggestionDetail}
                  onChange={(event) => setSuggestionDetail(event.target.value)}
                  className="w-full rounded-xl border border-[#bfd0ee] px-3 py-2 text-sm leading-6 outline-none focus:border-[#5e83cc]"
                  placeholder="请写清楚期望改动、原因、验收标准。"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setTodoModalOpen(false)}
                  className="rounded-full border border-[#bfd0ee] bg-white px-4 py-2 text-xs text-[#6f84ad]"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="rounded-full border border-[#8ba6da] bg-[#4f78c8] px-5 py-2 text-xs font-medium text-white"
                >
                  创建建议
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
