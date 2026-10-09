"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Editor, Viewer } from "@bytemd/react";
import gfm from "@bytemd/plugin-gfm";
import breaks from "@bytemd/plugin-breaks";
import frontmatter from "@bytemd/plugin-frontmatter";
import highlight from "@bytemd/plugin-highlight";
import mediumZoom from "@bytemd/plugin-medium-zoom";
import { inlineImageUrl } from "@/lib/storage-url";

type Tag = {
  id: number;
  name: string;
  color: string;
};

type Note = {
  id: number;
  content: string;
  createdAt: string;
};

type ExperimentDetail = {
  id: number;
  title: string;
  recorder: string;
  expDate: string;
  summary: string;
  tags: Tag[];
  notes: Note[];
  images: { id: number; imageUrl: string; sortOrder: number }[];
  storageBaseUrl: string;
};

type EditorUploadImage = {
  url: string;
  alt?: string;
  title?: string;
};

const BODY_MARKDOWN_PREFIX = "__EXPERIMENT_BODY_MARKDOWN__\n";
const mdPlugins = [gfm(), breaks(), frontmatter(), highlight(), mediumZoom()];

async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    throw new Error("upload failed");
  }
  const data = (await response.json()) as { url: string };
  return data.url;
}

function buildInlineProxyUrl(fileUrl: string) {
  if (!fileUrl) return fileUrl;
  if (fileUrl.startsWith("/api/files/proxy?")) return fileUrl;
  return `/api/files/proxy?url=${encodeURIComponent(fileUrl)}`;
}

function normalizeMarkdownImageUrls(markdown: string, baseUrl: string) {
  if (!markdown) return markdown;
  return markdown.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (full, altText: string, rawUrl: string) => {
    if (rawUrl.startsWith("data:")) return full;
    const normalized = inlineImageUrl(rawUrl, baseUrl);
    return `![${altText}](${normalized})`;
  });
}

function resolveBodyAndRemarks(notes: Note[]) {
  let bodyNoteId: number | null = null;
  let bodyMarkdown = "";
  const remarks: Note[] = [];

  notes.forEach((note) => {
    if (bodyNoteId === null && note.content.startsWith(BODY_MARKDOWN_PREFIX)) {
      bodyNoteId = note.id;
      bodyMarkdown = note.content.slice(BODY_MARKDOWN_PREFIX.length);
      return;
    }
    remarks.push(note);
  });

  return { bodyNoteId, bodyMarkdown, remarks };
}

export default function ExperimentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPreviewMode = searchParams?.get("mode") === "preview";
  const experimentId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [smallScreen, setSmallScreen] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [remarks, setRemarks] = useState<Note[]>([]);
  const savePending = useRef(false);
  const bodyCurrent = useRef("");
  const storageBase = useRef("");
  const [images, setImages] = useState<ExperimentDetail["images"]>([]);

  const [title, setTitle] = useState("");
  const [recorder, setRecorder] = useState("");
  const [expDate, setExpDate] = useState("");
  const [summary, setSummary] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const [bodyNoteId, setBodyNoteId] = useState<number | null>(null);
  const [bodyMarkdown, setBodyMarkdown] = useState("");

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setSmallScreen(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const detailRes = await fetch(`/api/experiments/${experimentId}`, { signal: controller.signal, cache: "no-store" });

        if (!detailRes.ok) {
          throw new Error("load detail failed");
        }

        const detail = (await detailRes.json()) as ExperimentDetail;

        storageBase.current = detail.storageBaseUrl;
        setImages(detail.images || []);
        const parsed = resolveBodyAndRemarks(detail.notes || []);
        setRemarks(parsed.remarks);
        setBodyNoteId(parsed.bodyNoteId);
        bodyCurrent.current = normalizeMarkdownImageUrls(parsed.bodyMarkdown, storageBase.current);
        setBodyMarkdown(bodyCurrent.current);

        setTitle(detail.title);
        setRecorder(detail.recorder);
        setExpDate(detail.expDate);
        setSummary(detail.summary);
        setSelectedTagIds((detail.tags || []).map((tag) => tag.id));
        setLoaded(true);
      } catch {
        if (!controller.signal.aborted) setError("加载实验记录失败，请刷新后重试。");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    if (Number.isSafeInteger(experimentId) && experimentId > 0) {
      load();
    } else {
      setError("实验记录 ID 无效");
      setLoading(false);
    }
    return () => controller.abort();
  }, [experimentId]);

  async function handleSave() {
    if (savePending.current) return;
    savePending.current = true;
    setSaving(true);
    setError("");
    setSaved(false);
    const submittedBody = bodyMarkdown;
    try {
      const updateRes = await fetch(`/api/experiments/${experimentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          recorder: recorder.trim(),
          expDate,
          summary: summary.trim(),
          tagIds: selectedTagIds,
          bodyMarkdown,
          bodyNoteId,
        }),
      });
      if (!updateRes.ok) {
        throw new Error("update failed");
      }

      const result = await updateRes.json() as { bodyNoteId: number };
      setBodyNoteId(result.bodyNoteId);
      setSaved(bodyCurrent.current === submittedBody);
    } catch {
      setError("保存失败，编辑内容已保留，请稍后重试。");
    } finally {
      setSaving(false);
      savePending.current = false;
    }
  }

  async function uploadEditorImages(files: File[]): Promise<EditorUploadImage[]> {
    const uploaded = await Promise.all(
      files.map(async (file) => {
        const url = await uploadFile(file);
        return { url: buildInlineProxyUrl(url), alt: file.name, title: file.name };
      }),
    );
    return uploaded;
  }

  function gotoList() {
    router.push("/experiments");
  }

  function gotoEditMode() {
    router.push(`/experiments/${experimentId}`);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f8fc] text-[#5473b5]">加载中...</div>
    );
  }

  if (error && !loaded) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f6f8fc] text-[#5473b5]">
        <p>{error}</p>
        <button
          type="button"
          onClick={gotoList}
          className="rounded-full border border-[#9db5e5] bg-white px-4 py-2 text-sm text-[#365fae]"
        >
          返回实验列表
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-[#2e3e61]">
      <header className="sticky top-0 z-40 border-b border-[#d8e2f7] bg-white/95 backdrop-blur">
        <div className="flex min-h-14 items-center justify-between gap-2 px-3 py-2 sm:px-6">
          <button
            type="button"
            onClick={gotoList}
            className="rounded-full border border-[#bfd0ee] bg-white px-4 py-1.5 text-sm text-[#4268b1] transition hover:bg-[#f1f6ff]"
          >
            ← 返回
          </button>
          <div className="flex items-center gap-2">
            {isPreviewMode ? (
              <button
                type="button"
                onClick={gotoEditMode}
                className="rounded-full border border-[#8ba6da] bg-[#4f78c8] px-4 py-1.5 text-sm text-white transition hover:bg-[#416abd]"
              >
                进入编辑
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-full border border-[#8ba6da] bg-[#4f78c8] px-4 py-1.5 text-sm text-white transition hover:bg-[#416abd] disabled:opacity-60"
              >
                {saving ? "保存中..." : "保存"}
              </button>
            )}
            <button
              type="button"
              onClick={gotoList}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#bfd0ee] bg-white text-lg leading-none text-[#5b79ba] transition hover:bg-[#f1f6ff]"
              aria-label="关闭"
            >
              ×
            </button>
          </div>
        </div>
      </header>

      <main className="w-full">
        {error ? <p role="alert" className="bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        {saved ? <p role="status" className="bg-green-50 px-4 py-2 text-sm text-green-700">已保存</p> : null}
        <section className="border-b border-[#dde7f8] bg-white px-4 py-4 sm:px-6">
          <h1 className="break-words text-lg font-semibold text-[#365fae]">{title}</h1>
          <p className="mt-2 text-sm text-[#6f84ad]">{expDate} · {recorder}</p>
          {isPreviewMode ? <p className="mt-2 break-words text-sm leading-6">{summary}</p> : (
            <details className="mt-3">
              <summary className="min-h-10 cursor-pointer py-2 text-sm text-[#4268b1]">编辑标题、日期和简介</summary>
              <fieldset disabled={saving} className="mt-2 grid min-w-0 gap-3 sm:grid-cols-2">
                <label className="text-sm">标题<input required maxLength={200} value={title} onChange={event => setTitle(event.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
                <label className="text-sm">记录人<input required maxLength={50} value={recorder} onChange={event => setRecorder(event.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
                <label className="text-sm">实验日期<input required type="date" value={expDate} onChange={event => setExpDate(event.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
                <label className="text-sm sm:col-span-2">简介<textarea required rows={3} value={summary} onChange={event => setSummary(event.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
              </fieldset>
            </details>
          )}
        </section>
        {!isPreviewMode ? (
          <>
            <section className="px-0 py-0 sm:px-0">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#dde7f8] px-4 py-2 text-sm font-semibold text-[#365fae] sm:px-6">
                <span>正文编辑（Markdown）</span>
                <div className="flex gap-2 md:hidden">
                  <button type="button" aria-pressed={!mobilePreview} onClick={() => setMobilePreview(false)} className="min-h-10 rounded-full border px-3">编写</button>
                  <button type="button" aria-pressed={mobilePreview} onClick={() => setMobilePreview(true)} className="min-h-10 rounded-full border px-3">预览</button>
                </div>
              </div>
              <div className="min-w-0 bg-white [&_.bytemd]:h-[65dvh] [&_.bytemd]:min-h-[360px] [&_.bytemd]:border-0 [&_.bytemd-preview]:bg-white [&_.bytemd-status]:border-t [&_.bytemd-toolbar]:border-b">
                {smallScreen && mobilePreview ? <div className="min-h-[360px] p-4"><Viewer value={bodyMarkdown || "_暂无正文内容_"} plugins={mdPlugins} /></div> : (
                <Editor
                  value={bodyMarkdown}
                  mode={smallScreen ? "tab" : "split"}
                  plugins={mdPlugins}
                  uploadImages={uploadEditorImages}
                  onChange={value => { bodyCurrent.current = value; setBodyMarkdown(value); setSaved(false); }}
                  placeholder="在这里编写正文内容，支持图片、表格、代码块、任务列表..."
                />
                )}
              </div>
            </section>
          </>
        ) : (
          <section className="px-4 py-6 sm:px-6">
            <div className="border border-[#dbe5f7] bg-white p-5">
              <h2 className="mb-3 text-lg font-semibold text-[#365fae]">正文预览</h2>
              <div className="min-w-0 [&_.bytemd-preview]:max-w-none [&_.markdown-body]:font-serif">
                <Viewer value={bodyMarkdown || "_暂无正文内容_"} plugins={mdPlugins} />
              </div>
            </div>
          </section>
        )}
        {images.length > 0 ? <section className="px-4 py-5 sm:px-6"><h2 className="mb-3 text-lg font-semibold">实验图片</h2><div className="grid min-w-0 gap-4 sm:grid-cols-2">{images.map((image, index) => <a key={image.id} href={inlineImageUrl(image.imageUrl, storageBase.current)} target="_blank" rel="noreferrer" className="min-w-0 rounded-xl border bg-white p-3"><Image unoptimized width={1200} height={800} src={inlineImageUrl(image.imageUrl, storageBase.current)} alt={`实验图片 ${index + 1}`} loading="lazy" className="h-auto max-w-full rounded-lg" /></a>)}</div></section> : null}
        {remarks.length > 0 ? <section className="px-4 py-5 sm:px-6"><h2 className="mb-3 text-lg font-semibold">其他实验笔记</h2>{remarks.map(note => <div key={note.id} className="mb-3 min-w-0 rounded-xl border bg-white p-4"><Viewer value={normalizeMarkdownImageUrls(note.content, storageBase.current)} plugins={mdPlugins} /></div>)}</section> : null}
      </main>
    </div>
  );
}
