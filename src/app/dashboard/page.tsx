"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { TopNav } from "@/components/top-nav";
import { Modal } from "@/components/modal";
import { useTodos } from "@/lib/use-todos";
import { TodoLevel } from "@/lib/todo-store";

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

const DEFAULT_STEPS: string[] = [];
type ProjectPeople = {
  members: { id: number; name: string; className: string | null; phone: string | null; studentNo: string | null }[];
  advisors: { id: number; name: string; contact: string | null }[];
};
const DEFAULT_META = { projectName: "", teamMembers: "", advisors: "" };
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
  const [people, setPeople] = useState<ProjectPeople>({ members: [], advisors: [] });
  const [peopleError, setPeopleError] = useState("");
  const [loading, setLoading] = useState(true);
  const [experimentCount, setExperimentCount] = useState(0);
  const [thisWeekAdded, setThisWeekAdded] = useState(0);

  const [introEditing, setIntroEditing] = useState(false);
  const [introDraft, setIntroDraft] = useState("");
  const [savingIntro, setSavingIntro] = useState(false);

  const [progressEditing, setProgressEditing] = useState(false);
  const [progressSteps, setProgressSteps] = useState<string[]>(DEFAULT_STEPS);
  const [progressDraft, setProgressDraft] = useState(DEFAULT_STEPS.join("\n"));
  const [metaEditing, setMetaEditing] = useState(false);
  const [projectMeta, setProjectMeta] = useState(DEFAULT_META);
  const [metaDraft, setMetaDraft] = useState(DEFAULT_META);
  const { todos, loading: todosLoading, saving: todosSaving, error: todosError, updateTodos } = useTodos();
  const [pageError, setPageError] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [projectDataLoaded, setProjectDataLoaded] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const settingsPending = useRef(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [todoModalOpen, setTodoModalOpen] = useState(false);
  const [suggestionTitle, setSuggestionTitle] = useState("");
  const [suggestionLevel, setSuggestionLevel] = useState<TodoLevel>("medium");
  const [suggestionDueDate, setSuggestionDueDate] = useState("");
  const [suggestionDetail, setSuggestionDetail] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function restoreDatabaseSettings() {
      try {
        const [settingsRes, recordsRes] = await Promise.all([
          fetch("/api/dashboard/settings", { cache: "no-store" }),
          fetch("/api/experiments", { cache: "no-store" }),
        ]);
        if (!settingsRes.ok || !recordsRes.ok) throw new Error("读取失败");
        const settings = await settingsRes.json();
        const meta = { projectName: settings.projectName, teamMembers: settings.teamMembers, advisors: settings.advisors };
        setProjectMeta(meta);
        setMetaDraft(meta);
        setSettingsLoaded(true);
        setProgressSteps(settings.progressSteps);
        setProgressDraft(settings.progressSteps.join("\n"));
        const records = await recordsRes.json() as { createdAt: string }[];
        setExperimentCount(records.length);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        now.setDate(now.getDate() - (now.getDay() + 6) % 7);
        setThisWeekAdded(records.filter(record => new Date(record.createdAt) >= now).length);
      } catch { setPageError("项目设置或实验记录读取失败，请刷新重试。"); }
      finally { setSettingsLoading(false); }
    }
    restoreDatabaseSettings();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/project/people", { cache: "no-store", signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error("读取失败"); return response.json(); })
      .then(setPeople)
      .catch(() => { if (!controller.signal.aborted) setPeopleError("成员资料读取失败，请刷新重试。"); });
    return () => controller.abort();
  }, []);

  async function persistSettings(value: Partial<typeof DEFAULT_META> & { progressSteps?: string[] }) {
    if (settingsPending.current || settingsLoading || !settingsLoaded) return false;
    settingsPending.current = true;
    setSettingsSaving(true);
    setPageError("");
    try {
      const response = await fetch("/api/dashboard/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value),
      });
      if (!response.ok) throw new Error("保存失败");
      return true;
    } catch { setPageError("项目设置保存失败，输入内容已保留，请重试。"); return false; }
    finally { settingsPending.current = false; setSettingsSaving(false); }
  }

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [sectionsRes, attachmentsRes] = await Promise.all([
          fetch("/api/project/sections"),
          fetch("/api/project/attachments"),
        ]);
        if (!sectionsRes.ok || !attachmentsRes.ok) throw new Error("读取失败");
        const sectionsData = (await sectionsRes.json()) as ProjectSection[];
        const attachmentsData = (await attachmentsRes.json()) as Attachment[];
        setSections(sectionsData);
        setAttachments(attachmentsData);
        setIntroDraft(sectionsData[0]?.content ?? "");
        setProjectDataLoaded(true);
      } catch { setPageError("项目说明或附件读取失败，请刷新重试。"); }
      finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const introSection = useMemo(() => sections[0], [sections]);
  const activePeople = useMemo(() => projectMeta.teamMembers.split("\n").filter(line => line.trim()).length, [projectMeta.teamMembers]);
  const activeTodos = useMemo(() => todos.filter((item) => !item.deletedAt), [todos]);
  const todoCount = useMemo(() => activeTodos.filter((item) => !item.done).length, [activeTodos]);

  async function saveIntro(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingIntro) return;
    setSavingIntro(true);
    try {
      if (introSection) {
        const response = await fetch(`/api/project/sections/${introSection.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: introSection.title,
            content: introDraft,
            sortOrder: introSection.sortOrder,
          }),
        });
        if (!response.ok) throw new Error("保存失败");
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
        if (!response.ok) throw new Error("保存失败");
        const created = (await response.json()) as ProjectSection;
        setSections([created]);
      }
      setIntroEditing(false);
    } catch { setPageError("项目说明保存失败，输入内容已保留，请重试。"); }
    finally {
      setSavingIntro(false);
    }
  }

  async function saveProgress() {
    const next = progressDraft
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const resolved = next.length > 0 ? next : DEFAULT_STEPS;
    if (!(await persistSettings({ progressSteps: resolved }))) return;
    setProgressSteps(resolved);
    setProgressDraft(resolved.join("\n"));
    setProgressEditing(false);
  }

  async function saveMeta() {
    const resolved = {
      projectName: metaDraft.projectName.trim() || projectMeta.projectName,
      teamMembers: metaDraft.teamMembers.trim(),
      advisors: metaDraft.advisors.trim(),
    };
    if (!(await persistSettings(resolved))) return;
    setProjectMeta(resolved);
    setMetaDraft(resolved);
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
        throw new Error("上传失败");
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

      if (!attachRes.ok) throw new Error("登记失败");
      const created = (await attachRes.json()) as Attachment;
      setAttachments((prev) => [created, ...prev]);
    } catch { setPageError("附件上传失败，请重试。"); }
    finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleDeleteFile(fileId: number) {
    if (!window.confirm("确认删除这个项目附件？")) return;
    try {
      const response = await fetch(`/api/project/attachments/${fileId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("删除失败");
      setAttachments((prev) => prev.filter((item) => item.id !== fileId));
    } catch { setPageError("附件删除失败，请重试。"); }
  }

  async function submitSuggestion(event: FormEvent<HTMLFormElement>) {
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
    if (!(await updateTodos(next))) return;
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
        {pageError ? <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{pageError}</p> : null}
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)_330px]">
          <aside className="min-w-0 rounded-2xl border border-[#d5e0f6] bg-[#edf3ff] p-5 lg:sticky lg:top-24 lg:h-fit">
            <div className="mb-4 flex items-center justify-between border-b border-[#d2def5] pb-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[#6a85bc]">基础信息</p>
              <button
                type="button"
                disabled={!settingsLoaded || settingsLoading || settingsSaving}
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
                  disabled={settingsSaving}
                  className="rounded-full border border-[#8ba6da] bg-[#4f78c8] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#416abd]"
                >
                  保存基础信息
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <p className="text-xs text-[#6a85bc]">项目名称</p>
                  <h1 className="mt-2 whitespace-pre-line break-words text-xl leading-relaxed text-[#3a5fa9] sm:text-2xl">{settingsLoading ? "基础信息加载中…" : settingsLoaded ? projectMeta.projectName : "基础信息读取失败"}</h1>
                </div>
                <div className="border-t border-[#d2def5]" />
                <div>
                  <p className="text-xs text-[#6a85bc]">队伍成员</p>
                  <p className="mt-2 whitespace-pre-line break-words text-sm leading-7 text-[#6279a8]">{settingsLoading ? "加载中…" : projectMeta.teamMembers}</p>
                </div>
                <div className="border-t border-[#d2def5]" />
                <div>
                  <p className="text-xs text-[#6a85bc]">指导老师</p>
                  <p className="mt-2 whitespace-pre-line break-words text-sm leading-7 text-[#6279a8]">{settingsLoading ? "加载中…" : projectMeta.advisors}</p>
                </div>
              </div>
            )}
            {peopleError ? <p role="alert" className="mt-4 text-sm text-red-700">{peopleError}</p> : null}
            {people.members.length || people.advisors.length ? (
              <details className="mt-5 border-t border-[#d2def5] pt-3">
                <summary className="min-h-10 cursor-pointer py-2 text-sm font-medium text-[#365fae]">成员资料（{people.members.length} 位成员、{people.advisors.length} 位老师）</summary>
                <div className="mt-2 space-y-3">
                  {people.members.map(member => <div key={member.id} className="min-w-0 rounded-xl bg-white p-3 text-sm">
                    <p className="break-words font-medium">{member.name}</p>
                    <dl className="mt-2 space-y-1 break-words text-xs leading-5 text-[#6279a8]">
                      <div><dt className="inline">班级：</dt><dd className="inline">{member.className || "未填写"}</dd></div>
                      <div><dt className="inline">学号：</dt><dd className="inline">{member.studentNo || "未填写"}</dd></div>
                      <div><dt className="inline">电话：</dt><dd className="inline">{member.phone || "未填写"}</dd></div>
                    </dl>
                  </div>)}
                  {people.advisors.map(advisor => <div key={advisor.id} className="min-w-0 rounded-xl bg-white p-3 text-sm">
                    <p className="break-words font-medium">指导老师：{advisor.name}</p>
                    <p className="mt-2 break-words text-xs text-[#6279a8]">联系方式：{advisor.contact || "未填写"}</p>
                  </div>)}
                </div>
              </details>
            ) : null}
          </aside>

          <section className="min-w-0 space-y-7">
            <section id="intro" className="min-w-0 rounded-2xl border border-[#dbe5f7] bg-white px-4 py-5 sm:px-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#365fae]">项目介绍</h2>
                <button
                  type="button"
                  disabled={!projectDataLoaded || loading || savingIntro}
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
                <p className="min-h-[160px] whitespace-pre-line break-words text-sm leading-8 text-[#465a84]">
                  {loading
                    ? "项目介绍加载中..."
                    : introSection?.content || "暂无项目介绍内容，点击“编辑介绍”开始填写。"}
                </p>
              )}
            </section>

            {sections.slice(1).map(section => <section key={section.id} className="min-w-0 rounded-2xl border border-[#dbe5f7] bg-white px-4 py-5 sm:px-6">
              <h2 className="mb-4 break-words text-xl font-semibold text-[#365fae]">{section.title}</h2>
              <p className="whitespace-pre-line break-words text-sm leading-8 text-[#465a84]">{section.content || "暂无内容"}</p>
            </section>)}

            <section className="min-w-0 rounded-2xl border border-[#dbe5f7] bg-white px-4 py-5 sm:px-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#365fae]">进度管理</h2>
                <button
                  type="button"
                  disabled={!settingsLoaded || settingsLoading || settingsSaving}
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
                    disabled={settingsSaving}
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

            <section className="min-w-0 rounded-2xl border border-[#dbe5f7] bg-white px-4 py-5 sm:px-6">
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

          <aside className="min-w-0 space-y-6">
            <section className="min-w-0 rounded-2xl border border-[#dbe5f7] bg-white px-5 py-5">
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

            <section className="min-w-0 rounded-2xl border border-[#dbe5f7] bg-white px-5 py-5">
              <h2 className="mb-3 text-xl font-semibold text-[#365fae]">TODO 摘要</h2>
              {todosError ? <p role="alert" className="mb-3 text-sm text-red-700">{todosError}</p> : null}
              <fieldset disabled={todosLoading || todosSaving}>
              <ul className="space-y-2 text-sm text-[#4f648e]">
                {activeTodos.map((todo) => (
                  <li key={todo.id} className="rounded-lg border border-[#e1e9f8] bg-[#fbfdff] px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="relative inline-flex h-5 w-5 items-center justify-center group/urgency">
                        <span className={`h-3.5 w-3.5 rounded-full ${urgencyClass(todo.level)}`} />
                        <span className="pointer-events-none absolute left-6 top-1/2 z-20 hidden w-[220px] -translate-y-1/2 break-words rounded-lg border border-[#d9e2f2] bg-white px-3 py-2 text-xs text-[#49608f] shadow-[0_10px_20px_rgba(79,120,200,0.2)] sm:group-hover/urgency:block">
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
                          className="rounded-full border border-[#d7e2f7] min-h-10 px-3 py-1.5 text-xs text-[#6f84ad] hover:bg-[#f3f7ff]"
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
                          className="rounded-full border border-[#f1d5d5] min-h-10 px-3 py-1.5 text-xs text-[#c06f6f] hover:bg-[#fff4f4]"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 break-words text-xs leading-6 text-[#6f84ad] sm:hidden">截止：{todo.dueDate}<br />{todo.detail}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-[#8aa0c9]">待处理总数：{todoCount}</p>
              </fieldset>
            </section>
          </aside>
        </div>
      </main>

      {todoModalOpen ? (
        <Modal title="创建 TODO 建议" onClose={() => { if (!todosSaving) setTodoModalOpen(false); }}>
            <form onSubmit={submitSuggestion} className="space-y-3">
              {todosError ? <p role="alert" className="text-sm text-red-700">{todosError}</p> : null}
              <fieldset disabled={todosLoading || todosSaving} className="min-w-0 space-y-3">
              <div>
                <label className="mb-1 block text-xs text-[#6a85bc]">建议标题</label>
                <input
                  required
                  value={suggestionTitle}
                  onChange={(event) => setSuggestionTitle(event.target.value)}
                  className="w-full rounded-xl border border-[#bfd0ee] px-3 py-2 text-sm outline-none focus:border-[#5e83cc]"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
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
                  {todosSaving ? "保存中…" : "创建建议"}
                </button>
              </div>
              </fieldset>
            </form>
        </Modal>
      ) : null}
    </div>
  );
}
