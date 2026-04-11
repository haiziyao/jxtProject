# Module 7: 实验详情模块

> **For Claude:** Part of the lab data platform implementation plan. Run after Module 6.

---

### Task 7.1: 实验详情 / 编辑 / 删除 API

**Files:**
- Create: `src/app/api/experiments/[id]/route.ts`

**Step 1: 创建 `src/app/api/experiments/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: { id: string } };

// 获取实验详情（含 images / tags / notes）
export async function GET(_req: NextRequest, { params }: Ctx) {
  const id = parseInt(params.id);
  const exp = await prisma.experiment.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      tags: { include: { tag: true } },
      notes: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!exp) return NextResponse.json({ error: "不存在" }, { status: 404 });

  return NextResponse.json({
    ...exp,
    tags: exp.tags.map((et) => et.tag),
  });
}

// 更新实验基本信息
export async function PUT(req: NextRequest, { params }: Ctx) {
  const id = parseInt(params.id);
  const { title, recorder, expDate, summary, tagIds } = await req.json();

  // 先删旧标签关联，再写新的
  await prisma.experimentTag.deleteMany({ where: { experimentId: id } });

  const exp = await prisma.experiment.update({
    where: { id },
    data: {
      title,
      recorder,
      expDate: new Date(expDate),
      summary,
      tags: {
        create: (tagIds as number[] ?? []).map((tagId) => ({ tagId })),
      },
    },
    include: { tags: { include: { tag: true } } },
  });

  return NextResponse.json({ ...exp, tags: exp.tags.map((et) => et.tag) });
}

// 删除实验（级联删除 images / tags / notes）
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const id = parseInt(params.id);
  await prisma.experiment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
```

**Step 2: Commit**

```bash
git add src/app/api/experiments/[id]/route.ts
git commit -m "feat: add experiment detail/edit/delete API"
```

---

### Task 7.2: 图片管理 API Routes

**Files:**
- Create: `src/app/api/experiments/[id]/images/route.ts`
- Create: `src/app/api/experiments/[id]/images/[imageId]/route.ts`

**Step 1: 创建 `src/app/api/experiments/[id]/images/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const experimentId = parseInt(params.id);
  const { imageUrl, sortOrder } = await req.json();

  if (!imageUrl) {
    return NextResponse.json({ error: "imageUrl 必填" }, { status: 400 });
  }

  const image = await prisma.experimentImage.create({
    data: { experimentId, imageUrl, sortOrder: sortOrder ?? 0 },
  });
  return NextResponse.json(image, { status: 201 });
}
```

**Step 2: 创建 `src/app/api/experiments/[id]/images/[imageId]/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  const id = parseInt(params.imageId);
  await prisma.experimentImage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
```

**Step 3: Commit**

```bash
git add src/app/api/experiments/\[id\]/images/
git commit -m "feat: add experiment images API (add/delete)"
```

---

### Task 7.3: 备注 API Routes

**Files:**
- Create: `src/app/api/experiments/[id]/notes/route.ts`
- Create: `src/app/api/experiments/[id]/notes/[noteId]/route.ts`

**Step 1: 创建 `src/app/api/experiments/[id]/notes/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const experimentId = parseInt(params.id);
  const { content } = await req.json();

  if (!content) {
    return NextResponse.json({ error: "content 必填" }, { status: 400 });
  }

  const note = await prisma.experimentNote.create({
    data: { experimentId, content },
  });
  return NextResponse.json(note, { status: 201 });
}
```

**Step 2: 创建 `src/app/api/experiments/[id]/notes/[noteId]/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  const id = parseInt(params.noteId);
  await prisma.experimentNote.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
```

**Step 3: Commit**

```bash
git add src/app/api/experiments/\[id\]/notes/
git commit -m "feat: add experiment notes API (add/delete)"
```

---

### Task 7.4: 图片画廊组件

**Files:**
- Create: `src/components/experiments/image-gallery.tsx`

**Step 1: 创建 `src/components/experiments/image-gallery.tsx`**

```tsx
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Upload, X } from "lucide-react";

type ExpImage = { id: number; imageUrl: string; sortOrder: number };

interface Props {
  experimentId: number;
  images: ExpImage[];
}

export function ImageGallery({ experimentId, images }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    // 上传到 MinIO
    const formData = new FormData();
    formData.append("file", file);
    const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
    const { url } = await uploadRes.json();

    // 关联到实验
    await fetch(`/api/experiments/${experimentId}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: url, sortOrder: images.length }),
    });

    setUploading(false);
    router.refresh();
    // 清空 input，允许重复选同一文件
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(imageId: number) {
    if (!confirm("确认删除此图片？")) return;
    await fetch(`/api/experiments/${experimentId}/images/${imageId}`, {
      method: "DELETE",
    });
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">实验图片</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4 mr-1" />
          {uploading ? "上传中..." : "上传图片"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {images.length === 0 && (
        <p className="text-sm text-muted-foreground">暂无图片</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {images.map((img) => (
          <div
            key={img.id}
            className="relative group aspect-square rounded-md overflow-hidden border bg-muted cursor-pointer"
            onClick={() => setPreview(img.imageUrl)}
          >
            <Image
              src={img.imageUrl}
              alt="实验图片"
              fill
              className="object-cover"
              unoptimized // MinIO 外部图片无需 Next.js 优化
            />
            <button
              className="absolute top-1 right-1 bg-black/50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); handleDelete(img.id); }}
            >
              <Trash2 className="h-3 w-3 text-white" />
            </button>
          </div>
        ))}
      </div>

      {/* 图片全屏预览 */}
      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-4xl p-2">
          {preview && (
            <div className="relative">
              <Button
                variant="ghost" size="icon"
                className="absolute top-2 right-2 z-10"
                onClick={() => setPreview(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              <img src={preview} alt="预览" className="w-full h-auto rounded-md" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

**Step 2: 配置 Next.js 允许外部图片域名**

在 `next.config.ts` 中添加：

```ts
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "8.152.100.169",
        port: "9000",
        pathname: "/jxt/**",
      },
    ],
  },
};
export default nextConfig;
```

**Step 3: Commit**

```bash
git add src/components/experiments/image-gallery.tsx next.config.ts
git commit -m "feat: add image gallery component with upload and full-screen preview"
```

---

### Task 7.5: 备注区组件

**Files:**
- Create: `src/components/experiments/experiment-notes.tsx`

**Step 1: 创建 `src/components/experiments/experiment-notes.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Trash2, Plus } from "lucide-react";

type Note = { id: number; content: string; createdAt: string };

interface Props {
  experimentId: number;
  notes: Note[];
}

export function ExperimentNotes({ experimentId, notes }: Props) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAddNote() {
    if (!newContent || newContent === "<p></p>") return;
    setSaving(true);
    await fetch(`/api/experiments/${experimentId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newContent }),
    });
    setSaving(false);
    setAdding(false);
    setNewContent("");
    router.refresh();
  }

  async function handleDeleteNote(noteId: number) {
    if (!confirm("确认删除此备注？")) return;
    await fetch(`/api/experiments/${experimentId}/notes/${noteId}`, {
      method: "DELETE",
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">备注</h3>
        {!adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 mr-1" /> 添加备注
          </Button>
        )}
      </div>

      {/* 新增备注编辑区 */}
      {adding && (
        <div className="space-y-2 border rounded-md p-3 bg-muted/20">
          <RichTextEditor value="" onChange={setNewContent} />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => { setAdding(false); setNewContent(""); }}>
              取消
            </Button>
            <Button size="sm" onClick={handleAddNote} disabled={saving}>
              {saving ? "保存中..." : "保存备注"}
            </Button>
          </div>
        </div>
      )}

      {/* 已有备注列表 */}
      {notes.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">暂无备注</p>
      )}
      {notes.map((note) => (
        <div key={note.id} className="border rounded-md p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {new Date(note.createdAt).toLocaleString("zh-CN")}
            </span>
            <Button
              variant="ghost" size="icon"
              onClick={() => handleDeleteNote(note.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          <RichTextEditor value={note.content} editable={false} />
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/experiments/experiment-notes.tsx
git commit -m "feat: add experiment notes component with Tiptap editor"
```

---

### Task 7.6: 实验详情页面

**Files:**
- Create: `src/app/(protected)/experiments/[id]/page.tsx`
- Create: `src/components/experiments/edit-experiment-dialog.tsx`

**Step 1: 创建编辑弹窗 `src/components/experiments/edit-experiment-dialog.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tag = { id: number; name: string; color: string };
type Experiment = {
  id: number; title: string; recorder: string;
  expDate: string; summary: string; tags: Tag[];
};

interface Props {
  experiment: Experiment;
  allTags: Tag[];
  open: boolean;
  onClose: () => void;
}

export function EditExperimentDialog({ experiment, allTags, open, onClose }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(experiment.title);
  const [recorder, setRecorder] = useState(experiment.recorder);
  const [expDate, setExpDate] = useState(experiment.expDate);
  const [summary, setSummary] = useState(experiment.summary);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    experiment.tags.map((t) => t.id)
  );
  const [saving, setSaving] = useState(false);

  function toggleTag(id: number) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/experiments/${experiment.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, recorder, expDate, summary, tagIds: selectedTagIds }),
    });
    setSaving(false);
    onClose();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>编辑实验记录</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>实验标题</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>记录人</Label>
              <Input value={recorder} onChange={(e) => setRecorder(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>实验日期</Label>
              <Input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>实验简介</Label>
            <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>标签</Label>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <Badge
                  key={tag.id} variant="outline"
                  className={cn("cursor-pointer select-none",
                    selectedTagIds.includes(tag.id) ? "ring-2 ring-offset-1" : "opacity-60"
                  )}
                  style={{ borderColor: tag.color, color: tag.color }}
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: 创建详情页 `src/app/(protected)/experiments/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ExperimentDetailClient } from "@/components/experiments/experiment-detail-client";

export default async function ExperimentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params.id);
  if (isNaN(id)) notFound();

  const [exp, allTags] = await Promise.all([
    prisma.experiment.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        tags: { include: { tag: true } },
        notes: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.tag.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  if (!exp) notFound();

  const serialized = {
    ...exp,
    expDate: exp.expDate.toISOString().split("T")[0],
    createdAt: exp.createdAt.toISOString(),
    updatedAt: exp.updatedAt.toISOString(),
    tags: exp.tags.map((et) => et.tag),
    notes: exp.notes.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
  };

  return <ExperimentDetailClient experiment={serialized} allTags={allTags} />;
}
```

**Step 3: 创建 `src/components/experiments/experiment-detail-client.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ImageGallery } from "./image-gallery";
import { ExperimentNotes } from "./experiment-notes";
import { EditExperimentDialog } from "./edit-experiment-dialog";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";

type Tag = { id: number; name: string; color: string };
type Image = { id: number; imageUrl: string; sortOrder: number };
type Note = { id: number; content: string; createdAt: string };
type Experiment = {
  id: number; title: string; recorder: string; expDate: string;
  summary: string; tags: Tag[]; images: Image[]; notes: Note[];
};

interface Props { experiment: Experiment; allTags: Tag[]; }

export function ExperimentDetailClient({ experiment, allTags }: Props) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);

  async function handleDelete() {
    if (!confirm(`确认删除实验「${experiment.title}」？此操作不可撤销。`)) return;
    await fetch(`/api/experiments/${experiment.id}`, { method: "DELETE" });
    router.push("/experiments");
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* 顶部导航 */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/experiments"><ArrowLeft className="h-4 w-4 mr-1" />返回列表</Link>
        </Button>
      </div>

      {/* 基本信息卡片 */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl font-bold leading-tight">{experiment.title}</h1>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => setShowEdit(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>记录人：{experiment.recorder}</span>
            <span>日期：{experiment.expDate}</span>
          </div>
          <p className="text-sm">{experiment.summary}</p>
          <div className="flex flex-wrap gap-1">
            {experiment.tags.map((tag) => (
              <Badge
                key={tag.id} variant="outline"
                style={{ borderColor: tag.color, color: tag.color }}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 图片画廊 */}
      <Card>
        <CardContent className="pt-6">
          <ImageGallery experimentId={experiment.id} images={experiment.images} />
        </CardContent>
      </Card>

      {/* 备注区 */}
      <Card>
        <CardContent className="pt-6">
          <ExperimentNotes experimentId={experiment.id} notes={experiment.notes} />
        </CardContent>
      </Card>

      <EditExperimentDialog
        experiment={experiment}
        allTags={allTags}
        open={showEdit}
        onClose={() => setShowEdit(false)}
      />
    </div>
  );
}
```

**Step 4: 验证**

```bash
npm run build
```

访问 `/experiments/1`（需先创建一条实验记录）：
- 基本信息正常展示，编辑弹窗可保存
- 图片上传后显示在画廊
- 备注添加后出现在列表
- 删除实验后跳回列表页

**Step 5: Commit**

```bash
git add src/app/\(protected\)/experiments/\[id\]/ src/components/experiments/
git commit -m "feat: add experiment detail page with image gallery and notes"
```

---

**Module 7 完成检查清单：**
- [ ] GET `/api/experiments/[id]` 返回含 images/tags/notes 的详情
- [ ] PUT `/api/experiments/[id]` 可更新基本信息和标签
- [ ] DELETE `/api/experiments/[id]` 级联删除所有关联数据
- [ ] 图片上传后显示在画廊，可全屏预览
- [ ] 图片删除后从画廊消失
- [ ] 备注新增/删除正常工作
- [ ] 编辑弹窗保存后页面刷新
- [ ] `npm run build` 无错误
