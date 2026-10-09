"use client";

import { useEffect, useRef, useState } from "react";
import { inlineImageUrl } from "@/lib/storage-url";

export type DocumentHeading = { id: string; text: string; level: number };
export const EDITOR_ASSETS = "/vendor/vditor";

export function preparePreviewHtml(html: string, storageBase: string) {
  const document = new DOMParser().parseFromString(html, "text/html");
  document.querySelectorAll("img").forEach(image => {
    image.setAttribute("src", inlineImageUrl(image.getAttribute("src") || "", storageBase));
    image.setAttribute("loading", "lazy");
  });
  // PlantUML's upstream renderer sends diagram text to an external service.
  document.querySelectorAll(".language-plantuml").forEach(code => code.classList.replace("language-plantuml", "language-text"));
  return document.body.innerHTML;
}

export function MarkdownReader({ value, storageBase, onHeadings }: { value: string; storageBase: string; onHeadings?: (headings: DocumentHeading[]) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const callback = useRef(onHeadings);
  callback.current = onHeadings;
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    const child = document.createElement("div");
    host.current?.replaceChildren(child);
    setLoading(true);
    setError("");
    import("vditor").then(async ({ default: Vditor }) => {
      if (cancelled) return;
      await Vditor.preview(child, value, {
        cdn: EDITOR_ASSETS, mode: "light", lang: "zh_CN", anchor: 0,
        theme: { current: "light", path: `${EDITOR_ASSETS}/dist/css/content-theme` },
        markdown: { sanitize: true, footnotes: true, autoSpace: false, fixTermTypo: false, imageCaption: true },
        math: { engine: "KaTeX" }, hljs: { style: "github", lineNumber: false },
        transform: html => preparePreviewHtml(html, storageBase),
      });
      if (cancelled) return;
      const headings = Array.from(child.querySelectorAll<HTMLElement>("h1,h2,h3,h4"));
      if (callback.current) callback.current(headings.map((heading, index) => {
        heading.id = `document-heading-${index}`;
        return { id: heading.id, text: heading.textContent || "", level: Number(heading.tagName[1]) };
      }));
      setLoading(false);
    }).catch(() => { if (!cancelled) { setError("正文渲染失败，请刷新重试。原文仍可导出。"); setLoading(false); } });
    return () => { cancelled = true; child.remove(); };
  }, [value, storageBase]);
  return <div className="document-reader">
    {loading ? <p role="status" className="document-render-status">正在排版正文…</p> : null}
    {error ? <p role="alert" className="document-render-error">{error}</p> : null}
    <div ref={host} className="document-prose" />
    {!value.trim() && !loading && !error ? <p className="document-empty">还没有正文。点击“编辑”开始记录实验过程。</p> : null}
  </div>;
}
