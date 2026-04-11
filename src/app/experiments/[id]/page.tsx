"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Editor, Viewer } from "@bytemd/react";
import gfm from "@bytemd/plugin-gfm";
import breaks from "@bytemd/plugin-breaks";
import frontmatter from "@bytemd/plugin-frontmatter";
import highlight from "@bytemd/plugin-highlight";
import mediumZoom from "@bytemd/plugin-medium-zoom";

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

function serializeBodyMarkdown(markdown: string) {
  return `${BODY_MARKDOWN_PREFIX}${markdown}`;
}

function buildInlineProxyUrl(fileUrl: string) {
  if (!fileUrl) return fileUrl;
  if (fileUrl.startsWith("/api/files/proxy?")) return fileUrl;
  return `/api/files/proxy?url=${encodeURIComponent(fileUrl)}`;
}

function normalizeMarkdownImageUrls(markdown: string) {
  if (!markdown) return markdown;
  return markdown.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (full, altText: string, rawUrl: string) => {
    if (rawUrl.startsWith("data:")) return full;
    const normalized = buildInlineProxyUrl(rawUrl);
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

  const [title, setTitle] = useState("");
  const [recorder, setRecorder] = useState("");
  const [expDate, setExpDate] = useState("");
  const [summary, setSummary] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const [bodyNoteId, setBodyNoteId] = useState<number | null>(null);
  const [bodyMarkdown, setBodyMarkdown] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const detailRes = await fetch(`/api/experiments/${experimentId}`);

        if (!detailRes.ok) {
          throw new Error("load detail failed");
        }

        const detail = (await detailRes.json()) as ExperimentDetail;

        const parsed = resolveBodyAndRemarks(detail.notes || []);
        setBodyNoteId(parsed.bodyNoteId);
        setBodyMarkdown(normalizeMarkdownImageUrls(parsed.bodyMarkdown));

        setTitle(detail.title);
        setRecorder(detail.recorder);
        setExpDate(detail.expDate);
        setSummary(detail.summary);
        setSelectedTagIds((detail.tags || []).map((tag) => tag.id));
      } catch {
        setError("加载实验记录失败，请刷新后重试。");
      } finally {
        setLoading(false);
      }
    }

    if (Number.isFinite(experimentId)) {
      load();
    } else {
      setError("实验记录 ID 无效");
      setLoading(false);
    }
  }, [experimentId]);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setError("");
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
        }),
      });
      if (!updateRes.ok) {
        throw new Error("update failed");
      }

      const bodyContent = serializeBodyMarkdown(bodyMarkdown);
      if (bodyNoteId) {
        const bodyUpdateRes = await fetch(`/api/experiments/${experimentId}/notes/${bodyNoteId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: bodyContent }),
        });
        if (!bodyUpdateRes.ok) {
          throw new Error("update body failed");
        }
      } else {
        const createBodyRes = await fetch(`/api/experiments/${experimentId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: bodyContent }),
        });
        if (!createBodyRes.ok) {
          throw new Error("create body failed");
        }
        const created = (await createBodyRes.json()) as Note;
        setBodyNoteId(created.id);
      }
    } catch {
      setError("保存失败，请稍后重试。");
    } finally {
      setSaving(false);
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

  if (error) {
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
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
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
        {!isPreviewMode ? (
          <>
            <section className="px-0 py-0 sm:px-0">
              <div className="border-b border-[#dde7f8] px-4 py-2 text-sm font-semibold text-[#365fae] sm:px-6">
                正文编辑（Markdown）
              </div>
              <div className="h-[calc(100vh-56px)] min-h-[560px] bg-white [&_.bytemd]:h-full [&_.bytemd]:border-0 [&_.bytemd-preview]:bg-white [&_.bytemd-preview]:px-6 [&_.bytemd-status]:border-t [&_.bytemd-toolbar]:border-b">
                <Editor
                  value={bodyMarkdown}
                  mode="split"
                  plugins={mdPlugins}
                  uploadImages={uploadEditorImages}
                  onChange={setBodyMarkdown}
                  placeholder="在这里编写正文内容，支持图片、表格、代码块、任务列表..."
                />
              </div>
            </section>
          </>
        ) : (
          <section className="px-4 py-6 sm:px-6">
            <div className="border border-[#dbe5f7] bg-white p-5">
              <h2 className="mb-3 text-lg font-semibold text-[#365fae]">正文预览</h2>
              <div className="[&_.bytemd-preview]:max-w-none [&_.markdown-body]:font-serif">
                <Viewer value={bodyMarkdown || "_暂无正文内容_"} plugins={mdPlugins} />
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
