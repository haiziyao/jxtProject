"use client";

import { useEffect, useRef, useState } from "react";
import type Vditor from "vditor";
import { EDITOR_ASSETS, preparePreviewHtml } from "@/components/markdown-reader";

export function MarkdownEditor({ value, storageBase, onChange, onBusyChange }: { value: string; storageBase: string; onChange: (value: string) => void; onBusyChange: (busy: boolean) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const instance = useRef<Vditor | null>(null);
  const current = useRef({ value, onChange, onBusyChange, storageBase });
  current.current = { value, onChange, onBusyChange, storageBase };
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    let initialized = false;
    let editor: Vditor | null = null;
    const media = window.matchMedia("(max-width: 767px)");
    const resize = () => { if (initialized && !cancelled) editor?.setPreviewMode(media.matches ? "editor" : "both"); };
    media.addEventListener("change", resize);
    setReady(false);
    setError("");
    const timeout = window.setTimeout(() => { if (!cancelled && !initialized) setError("编辑器加载超时，请重试；也可以切换到阅读并导出原文。"); }, 15000);
    import("vditor").then(({ default: Vditor }) => {
      if (cancelled || !host.current) return;
      editor = new Vditor(host.current, {
        cdn: EDITOR_ASSETS, lang: "zh_CN", mode: "ir", minHeight: 460,
        value: current.current.value, cache: { enable: false },
        placeholder: "记录实验目的、过程与结果… 输入 # 创建标题，或使用上方工具栏。",
        toolbar: ["headings", "bold", "italic", "strike", "|", "list", "ordered-list", "check", "quote", "|", "link", "upload", "table", "code", "|", "undo", "redo", "edit-mode", "outline", "fullscreen"],
        toolbarConfig: { pin: false }, outline: { enable: false, position: "right" },
        preview: { mode: media.matches ? "editor" : "both", maxWidth: 800, delay: 200, theme: { current: "light", path: `${EDITOR_ASSETS}/dist/css/content-theme` }, markdown: { sanitize: true, autoSpace: false, fixTermTypo: false, footnotes: true }, math: { engine: "KaTeX" }, hljs: { style: "github" }, transform: html => preparePreviewHtml(html, current.current.storageBase) },
        after: () => { initialized = true; clearTimeout(timeout); if (cancelled) editor?.destroy(); else { resize(); setReady(true); } },
        input: markdown => { if (initialized && !cancelled) current.current.onChange(markdown); },
        upload: {
          accept: "image/png,image/jpeg,image/webp,image/gif", max: 20 * 1024 * 1024,
          handler: async files => {
            current.current.onBusyChange(true);
            try {
              for (const file of files) {
                if (!file.type.startsWith("image/")) throw new Error("请选择图片文件");
                const body = new FormData(); body.append("file", file);
                const response = await fetch("/api/upload", { method: "POST", body });
                if (!response.ok) throw new Error("图片上传失败，请重试");
                const data = await response.json() as { url: string };
                if (!cancelled) {
                  const name = file.name.replace(/[\[\]\\\n\r]/g, " ");
                  editor?.insertValue(`![${name}](/api/files/proxy?url=${encodeURIComponent(data.url)})\n`);
                }
              }
              return null;
            } catch (cause) { editor?.tip(cause instanceof Error ? cause.message : "图片上传失败"); return null; }
            finally { if (!cancelled) current.current.onBusyChange(false); }
          },
        },
      });
      instance.current = editor;
    }).catch(() => { if (!cancelled) setError("编辑器加载失败，请重试。"); });
    return () => {
      cancelled = true; clearTimeout(timeout);
      media.removeEventListener("change", resize);
      // Upstream initializes asynchronously; destroy only after its DOM is ready.
      if (initialized) editor?.destroy();
      instance.current = null;
    };
  }, [attempt]);
  return <div className="document-editor">
    {!ready && !error ? <p role="status" className="document-render-status">正在准备编辑器…</p> : null}
    {error ? <div role="alert" className="document-render-error">{error} <button type="button" onClick={() => setAttempt(value => value + 1)}>重新加载</button></div> : null}
    <div ref={host} aria-label="Markdown 正文编辑器" />
    <div className="document-editor-help"><span>支持拖拽或粘贴图片 · 表格 · 公式 · Markdown</span><span>Ctrl / ⌘ + S 保存</span></div>
  </div>;
}
