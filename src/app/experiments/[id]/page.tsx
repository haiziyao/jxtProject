"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, BookOpen, CalendarDays, Check, Download, FileText, List, LoaderCircle, PencilLine, Save, UserRound } from "lucide-react";
import { MarkdownEditor } from "@/components/markdown-editor";
import { MarkdownReader, DocumentHeading } from "@/components/markdown-reader";
import { Modal } from "@/components/modal";
import { documentFilename, resolveDocument } from "@/lib/markdown-document";
import { inlineImageUrl } from "@/lib/storage-url";

type Note = { id: number; content: string; createdAt: string };
type Detail = {
  id: number; title: string; recorder: string; expDate: string; summary: string;
  tags: { id: number; name: string; color: string }[]; notes: Note[];
  images: { id: number; imageUrl: string; sortOrder: number }[]; storageBaseUrl: string;
};
function snapshot(title: string, recorder: string, date: string, summary: string, markdown: string, tags: number[]) {
  return JSON.stringify({ title: title.trim(), recorder: recorder.trim(), expDate: date, summary: summary.trim(), markdown, tags });
}

export default function ExperimentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const search = useSearchParams();
  const experimentId = Number(params.id);
  const [view, setView] = useState<"read" | "edit">(search.get("mode") === "preview" ? "read" : "edit");
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [recorder, setRecorder] = useState("");
  const [expDate, setExpDate] = useState("");
  const [summary, setSummary] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [tags, setTags] = useState<Detail["tags"]>([]);
  const [bodyNoteId, setBodyNoteId] = useState<number | null>(null);
  const [remarks, setRemarks] = useState<Note[]>([]);
  const [images, setImages] = useState<Detail["images"]>([]);
  const [storageBase, setStorageBase] = useState("");
  const [headings, setHeadings] = useState<DocumentHeading[]>([]);
  const [serverSnapshot, setServerSnapshot] = useState("");
  const pending = useRef(false);
  const bodyCurrent = useRef("");
  const saveAction = useRef<() => void>(() => {});
  const draftSnapshot = snapshot(title, recorder, expDate, summary, markdown, tagIds);
  const dirty = loaded && draftSnapshot !== serverSnapshot;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoaded(false); setError("");
    async function load() {
      try {
        if (!Number.isInteger(experimentId) || experimentId < 1) throw new Error("无效实验编号");
        const response = await fetch(`/api/experiments/${experimentId}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("读取失败");
        const detail = await response.json() as Detail;
        if (controller.signal.aborted) return;
        const body = resolveDocument(detail.notes || []);
        const ids = detail.tags.map(tag => tag.id);
        setTitle(detail.title); setRecorder(detail.recorder); setExpDate(detail.expDate); setSummary(detail.summary);
        setMarkdown(body.markdown); bodyCurrent.current = body.markdown;
        setBodyNoteId(body.bodyNoteId); setRemarks(body.remarks);
        setImages(detail.images || []); setStorageBase(detail.storageBaseUrl);
        setTagIds(ids); setTags(detail.tags);
        setServerSnapshot(snapshot(detail.title, detail.recorder, detail.expDate, detail.summary, body.markdown, ids));
        setLoaded(true);
      } catch { if (!controller.signal.aborted) setError("实验记录加载失败，请刷新重试。"); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    load();
    return () => controller.abort();
  }, [experimentId]);

  async function handleSave() {
    if (pending.current || uploading || !loaded || !dirty) return;
    pending.current = true; setSaving(true); setError(""); setSaved(false);
    const submitted = bodyCurrent.current;
    const submittedSnapshot = snapshot(title, recorder, expDate, summary, submitted, tagIds);
    try {
      const response = await fetch(`/api/experiments/${experimentId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), recorder: recorder.trim(), expDate, summary: summary.trim(), tagIds, bodyMarkdown: submitted, bodyNoteId }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "保存失败，请稍后重试");
      }
      const result = await response.json() as { bodyNoteId: number };
      setBodyNoteId(result.bodyNoteId); setServerSnapshot(submittedSnapshot);
      setSaved(bodyCurrent.current === submitted);
    } catch (cause) { setError(`${cause instanceof Error ? cause.message : "保存失败"}。编辑内容已保留。`); }
    finally { pending.current = false; setSaving(false); }
  }
  saveAction.current = handleSave;
  useEffect(() => {
    function save(event: KeyboardEvent) { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); saveAction.current(); } }
    window.addEventListener("keydown", save);
    return () => window.removeEventListener("keydown", save);
  }, []);
  useEffect(() => {
    function warn(event: BeforeUnloadEvent) { if (dirty || uploading || saving) { event.preventDefault(); event.returnValue = ""; } }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, uploading, saving]);

  function goBack() {
    if (saving || uploading) return;
    if (dirty) setLeaveOpen(true);
    else router.push("/experiments");
  }
  function download() {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = documentFilename(title); link.click(); URL.revokeObjectURL(url);
  }
  const outline = <nav aria-label="正文目录" className="document-outline-links">{headings.map(heading => <a key={heading.id} href={`#${heading.id}`} style={{ paddingLeft: `${Math.min(heading.level - 1, 3) * 12 + 12}px` }}>{heading.text}</a>)}</nav>;

  if (loading) return <div className="document-loading"><LoaderCircle className="animate-spin" size={22} /><p>正在打开实验记录…</p></div>;
  if (!loaded) return <div className="document-loading"><p role="alert">{error}</p><button type="button" onClick={goBack}>返回实验列表</button></div>;
  return <div className="lab-document">
    <header className="document-topbar">
      <div className="document-topbar-inner">
        <button type="button" aria-label="返回实验列表" onClick={goBack} disabled={saving || uploading} className="document-back"><ArrowLeft size={18} /><span>实验记录</span></button>
        <div className="document-topbar-actions">
          <div className="document-view-switch" role="group" aria-label="切换文档视图">
            <button type="button" aria-pressed={view === "read"} disabled={uploading} onClick={() => setView("read")}><BookOpen size={16} />阅读</button>
            <button type="button" aria-pressed={view === "edit"} disabled={uploading} onClick={() => setView("edit")}><PencilLine size={16} />编辑</button>
          </div>
          <button type="button" onClick={handleSave} disabled={saving || uploading || !dirty} className="document-save">{saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}<span>{saving ? "保存中" : "保存"}</span></button>
        </div>
      </div>
    </header>
    <main className={`document-layout ${view === "edit" ? "is-editing" : ""}`}>
      <div className="document-content-column">
        {error ? <p role="alert" className="document-error">{error}</p> : null}
        <article className="document-sheet">
          <header className="document-heading">
            <div className="document-eyebrow"><span><FileText size={14} />实验笔记</span><span className={dirty ? "document-unsaved" : "document-saved"}>{uploading ? "图片上传中…" : dirty ? "有未保存的修改" : saved ? <><Check size={13} />已保存</> : "已同步"}</span></div>
            <h1>{title}</h1>
            <div className="document-metadata"><span><CalendarDays size={15} />{expDate}</span><span><UserRound size={15} />{recorder}</span><span>{markdown.trim().length.toLocaleString()} 字符</span></div>
            {summary ? <p className="document-summary">{summary}</p> : null}
            {tags.length ? <div className="document-tags">{tags.map(tag => <span key={tag.id} style={{ color: tag.color }}>{tag.name}</span>)}</div> : null}
            {view === "edit" ? <details className="document-details"><summary><PencilLine size={14} />编辑记录信息</summary><fieldset disabled={saving} className="document-fields">
              <label>标题<input required maxLength={200} value={title} onChange={event => { setTitle(event.target.value); setSaved(false); }} /></label>
              <label>记录人<input required maxLength={50} value={recorder} onChange={event => { setRecorder(event.target.value); setSaved(false); }} /></label>
              <label>实验日期<input required type="date" value={expDate} onChange={event => { setExpDate(event.target.value); setSaved(false); }} /></label>
              <label className="document-field-wide">简介<textarea required rows={3} value={summary} onChange={event => { setSummary(event.target.value); setSaved(false); }} /></label>
            </fieldset></details> : null}
          </header>
          {view === "read" && headings.length > 1 ? <details className="document-mobile-outline"><summary><List size={15} />本文目录 · {headings.length} 个章节</summary>{outline}</details> : null}
          {view === "edit" ? <MarkdownEditor value={markdown} storageBase={storageBase} onBusyChange={setUploading} onChange={value => { bodyCurrent.current = value; setMarkdown(value); setSaved(false); }} /> : <MarkdownReader value={markdown} storageBase={storageBase} onHeadings={setHeadings} />}
          <footer className="document-footer"><span>Markdown 文档</span><button type="button" onClick={download}><Download size={15} />导出 .md</button></footer>
        </article>
        {images.length ? <section className="document-supplement"><h2>实验图片 <span>{images.length}</span></h2><div className="document-gallery">{images.map((image, index) => <a key={image.id} href={inlineImageUrl(image.imageUrl, storageBase)} target="_blank" rel="noreferrer"><Image unoptimized width={1200} height={800} src={inlineImageUrl(image.imageUrl, storageBase)} alt={`实验图片 ${index + 1}`} loading="lazy" /></a>)}</div></section> : null}
        {remarks.length ? <section className="document-supplement"><h2>补充笔记 <span>{remarks.length}</span></h2>{remarks.map(note => <div key={note.id} className="document-note"><p className="document-note-date">{new Date(note.createdAt).toLocaleDateString("zh-CN")}</p><MarkdownReader value={note.content} storageBase={storageBase} /></div>)}</section> : null}
      </div>
      {view === "read" ? <aside className="document-sidebar"><div className="document-sidebar-card"><p className="document-sidebar-title"><List size={15} />本文目录</p>{headings.length ? outline : <p className="document-outline-empty">使用标题组织正文后，目录会显示在这里。</p>}<div className="document-sidebar-bottom"><button type="button" onClick={() => setView("edit")}><PencilLine size={15} />编辑这篇记录</button><button type="button" onClick={download}><Download size={15} />导出 Markdown</button></div></div></aside> : null}
    </main>
    {leaveOpen ? <Modal title="有尚未保存的修改" onClose={() => setLeaveOpen(false)}>
      <p className="text-sm leading-7 text-slate-600">离开会放弃本次未保存的编辑，已保存的实验记录仍会保留。</p>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" onClick={() => setLeaveOpen(false)} className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm text-slate-600">继续编辑</button>
        <button type="button" onClick={() => { setLeaveOpen(false); router.push("/experiments"); }} className="min-h-10 rounded-lg bg-slate-700 px-4 text-sm text-white">放弃修改并离开</button>
      </div>
    </Modal> : null}
  </div>;
}
