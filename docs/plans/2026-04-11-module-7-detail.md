# Module 7: 瀹為獙璇︽儏妯″潡

> **For Claude:** Part of the lab data platform implementation plan. Run after Module 6.

---

### Task 7.1: 瀹為獙璇︽儏 / 缂栬緫 / 鍒犻櫎 API

**Files:**
- Create: `src/app/api/experiments/[id]/route.ts`

**Step 1: 鍒涘缓 `src/app/api/experiments/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: { id: string } };

// 鑾峰彇瀹為獙璇︽儏锛堝惈 images / tags / notes锛?export async function GET(_req: NextRequest, { params }: Ctx) {
  const id = parseInt(params.id);
  const exp = await prisma.experiment.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      tags: { include: { tag: true } },
      notes: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!exp) return NextResponse.json({ error: "涓嶅瓨鍦? }, { status: 404 });

  return NextResponse.json({
    ...exp,
    tags: exp.tags.map((et) => et.tag),
  });
}

// 鏇存柊瀹為獙鍩烘湰淇℃伅
export async function PUT(req: NextRequest, { params }: Ctx) {
  const id = parseInt(params.id);
  const { title, recorder, expDate, summary, tagIds } = await req.json();

  // 鍏堝垹鏃ф爣绛惧叧鑱旓紝鍐嶅啓鏂扮殑
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

// 鍒犻櫎瀹為獙锛堢骇鑱斿垹闄?images / tags / notes锛?export async function DELETE(_req: NextRequest, { params }: Ctx) {
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

### Task 7.2: 鍥剧墖绠＄悊 API Routes

**Files:**
- Create: `src/app/api/experiments/[id]/images/route.ts`
- Create: `src/app/api/experiments/[id]/images/[imageId]/route.ts`

**Step 1: 鍒涘缓 `src/app/api/experiments/[id]/images/route.ts`**

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
    return NextResponse.json({ error: "imageUrl 蹇呭～" }, { status: 400 });
  }

  const image = await prisma.experimentImage.create({
    data: { experimentId, imageUrl, sortOrder: sortOrder ?? 0 },
  });
  return NextResponse.json(image, { status: 201 });
}
```

**Step 2: 鍒涘缓 `src/app/api/experiments/[id]/images/[imageId]/route.ts`**

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

### Task 7.3: 澶囨敞 API Routes

**Files:**
- Create: `src/app/api/experiments/[id]/notes/route.ts`
- Create: `src/app/api/experiments/[id]/notes/[noteId]/route.ts`

**Step 1: 鍒涘缓 `src/app/api/experiments/[id]/notes/route.ts`**

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
    return NextResponse.json({ error: "content 蹇呭～" }, { status: 400 });
  }

  const note = await prisma.experimentNote.create({
    data: { experimentId, content },
  });
  return NextResponse.json(note, { status: 201 });
}
```

**Step 2: 鍒涘缓 `src/app/api/experiments/[id]/notes/[noteId]/route.ts`**

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

### Task 7.4: 鍥剧墖鐢诲粖缁勪欢

**Files:**
- Create: `src/components/experiments/image-gallery.tsx`

**Step 1: 鍒涘缓 `src/components/experiments/image-gallery.tsx`**

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

    // 涓婁紶鍒?MinIO
    const formData = new FormData();
    formData.append("file", file);
    const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
    const { url } = await uploadRes.json();

    // 鍏宠仈鍒板疄楠?    await fetch(`/api/experiments/${experimentId}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: url, sortOrder: images.length }),
    });

    setUploading(false);
    router.refresh();
    // 娓呯┖ input锛屽厑璁搁噸澶嶉€夊悓涓€鏂囦欢
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(imageId: number) {
    if (!confirm("纭鍒犻櫎姝ゅ浘鐗囷紵")) return;
    await fetch(`/api/experiments/${experimentId}/images/${imageId}`, {
      method: "DELETE",
    });
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">瀹為獙鍥剧墖</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4 mr-1" />
          {uploading ? "涓婁紶涓?.." : "涓婁紶鍥剧墖"}
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
        <p className="text-sm text-muted-foreground">鏆傛棤鍥剧墖</p>
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
              alt="瀹為獙鍥剧墖"
              fill
              className="object-cover"
              unoptimized // MinIO 澶栭儴鍥剧墖鏃犻渶 Next.js 浼樺寲
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

      {/* 鍥剧墖鍏ㄥ睆棰勮 */}
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
              <img src={preview} alt="棰勮" className="w-full h-auto rounded-md" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

**Step 2: 閰嶇疆 Next.js 鍏佽澶栭儴鍥剧墖鍩熷悕**

鍦?`next.config.ts` 涓坊鍔狅細

```ts
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "your-minio-host",
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

### Task 7.5: 澶囨敞鍖虹粍浠?
**Files:**
- Create: `src/components/experiments/experiment-notes.tsx`

**Step 1: 鍒涘缓 `src/components/experiments/experiment-notes.tsx`**

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
    if (!confirm("纭鍒犻櫎姝ゅ娉紵")) return;
    await fetch(`/api/experiments/${experimentId}/notes/${noteId}`, {
      method: "DELETE",
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">澶囨敞</h3>
        {!adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 mr-1" /> 娣诲姞澶囨敞
          </Button>
        )}
      </div>

      {/* 鏂板澶囨敞缂栬緫鍖?*/}
      {adding && (
        <div className="space-y-2 border rounded-md p-3 bg-muted/20">
          <RichTextEditor value="" onChange={setNewContent} />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => { setAdding(false); setNewContent(""); }}>
              鍙栨秷
            </Button>
            <Button size="sm" onClick={handleAddNote} disabled={saving}>
              {saving ? "淇濆瓨涓?.." : "淇濆瓨澶囨敞"}
            </Button>
          </div>
        </div>
      )}

      {/* 宸叉湁澶囨敞鍒楄〃 */}
      {notes.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">鏆傛棤澶囨敞</p>
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

### Task 7.6: 瀹為獙璇︽儏椤甸潰

**Files:**
- Create: `src/app/(protected)/experiments/[id]/page.tsx`
- Create: `src/components/experiments/edit-experiment-dialog.tsx`

**Step 1: 鍒涘缓缂栬緫寮圭獥 `src/components/experiments/edit-experiment-dialog.tsx`**

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
        <DialogHeader><DialogTitle>缂栬緫瀹為獙璁板綍</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>瀹為獙鏍囬</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>璁板綍浜?/Label>
              <Input value={recorder} onChange={(e) => setRecorder(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>瀹為獙鏃ユ湡</Label>
              <Input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>瀹為獙绠€浠?/Label>
            <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>鏍囩</Label>
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
          <Button variant="outline" onClick={onClose}>鍙栨秷</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "淇濆瓨涓?.." : "淇濆瓨"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: 鍒涘缓璇︽儏椤?`src/app/(protected)/experiments/[id]/page.tsx`**

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

**Step 3: 鍒涘缓 `src/components/experiments/experiment-detail-client.tsx`**

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
    if (!confirm(`纭鍒犻櫎瀹為獙銆?{experiment.title}銆嶏紵姝ゆ搷浣滀笉鍙挙閿€銆俙)) return;
    await fetch(`/api/experiments/${experiment.id}`, { method: "DELETE" });
    router.push("/experiments");
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* 椤堕儴瀵艰埅 */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/experiments"><ArrowLeft className="h-4 w-4 mr-1" />杩斿洖鍒楄〃</Link>
        </Button>
      </div>

      {/* 鍩烘湰淇℃伅鍗＄墖 */}
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
            <span>璁板綍浜猴細{experiment.recorder}</span>
            <span>鏃ユ湡锛歿experiment.expDate}</span>
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

      {/* 鍥剧墖鐢诲粖 */}
      <Card>
        <CardContent className="pt-6">
          <ImageGallery experimentId={experiment.id} images={experiment.images} />
        </CardContent>
      </Card>

      {/* 澶囨敞鍖?*/}
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

**Step 4: 楠岃瘉**

```bash
npm run build
```

璁块棶 `/experiments/1`锛堥渶鍏堝垱寤轰竴鏉″疄楠岃褰曪級锛?- 鍩烘湰淇℃伅姝ｅ父灞曠ず锛岀紪杈戝脊绐楀彲淇濆瓨
- 鍥剧墖涓婁紶鍚庢樉绀哄湪鐢诲粖
- 澶囨敞娣诲姞鍚庡嚭鐜板湪鍒楄〃
- 鍒犻櫎瀹為獙鍚庤烦鍥炲垪琛ㄩ〉

**Step 5: Commit**

```bash
git add src/app/\(protected\)/experiments/\[id\]/ src/components/experiments/
git commit -m "feat: add experiment detail page with image gallery and notes"
```

---

**Module 7 瀹屾垚妫€鏌ユ竻鍗曪細**
- [ ] GET `/api/experiments/[id]` 杩斿洖鍚?images/tags/notes 鐨勮鎯?- [ ] PUT `/api/experiments/[id]` 鍙洿鏂板熀鏈俊鎭拰鏍囩
- [ ] DELETE `/api/experiments/[id]` 绾ц仈鍒犻櫎鎵€鏈夊叧鑱旀暟鎹?- [ ] 鍥剧墖涓婁紶鍚庢樉绀哄湪鐢诲粖锛屽彲鍏ㄥ睆棰勮
- [ ] 鍥剧墖鍒犻櫎鍚庝粠鐢诲粖娑堝け
- [ ] 澶囨敞鏂板/鍒犻櫎姝ｅ父宸ヤ綔
- [ ] 缂栬緫寮圭獥淇濆瓨鍚庨〉闈㈠埛鏂?- [ ] `npm run build` 鏃犻敊璇?
