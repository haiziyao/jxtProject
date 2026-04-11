# Module 5: 项目介绍模块

> **For Claude:** Part of the lab data platform implementation plan. Run after Module 4.

---

### Task 5.1: 板块 API Routes

**Files:**
- Create: `src/app/api/project/sections/route.ts`
- Create: `src/app/api/project/sections/[id]/route.ts`

**Step 1: 创建 `src/app/api/project/sections/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 获取所有板块（按 sort_order 升序）
export async function GET() {
  const sections = await prisma.projectSection.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(sections);
}

// 新建板块
export async function POST(req: NextRequest) {
  const { title, content, sortOrder } = await req.json();
  if (!title) {
    return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
  }
  const section = await prisma.projectSection.create({
    data: { title, content: content ?? "", sortOrder: sortOrder ?? 0 },
  });
  return NextResponse.json(section, { status: 201 });
}
```

**Step 2: 创建 `src/app/api/project/sections/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 更新板块内容
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  const { title, content, sortOrder } = await req.json();
  const section = await prisma.projectSection.update({
    where: { id },
    data: { title, content, sortOrder },
  });
  return NextResponse.json(section);
}

// 删除板块
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  await prisma.projectSection.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
```

**Step 3: Commit**

```bash
git add src/app/api/project/sections/
git commit -m "feat: add project sections CRUD API"
```

---

### Task 5.2: 附件 API Routes

**Files:**
- Create: `src/app/api/project/attachments/route.ts`
- Create: `src/app/api/project/attachments/[id]/route.ts`

**Step 1: 创建 `src/app/api/project/attachments/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const attachments = await prisma.projectAttachment.findMany({
    orderBy: { uploadedAt: "desc" },
  });
  return NextResponse.json(attachments);
}

export async function POST(req: NextRequest) {
  const { name, fileUrl, fileSize } = await req.json();
  if (!name || !fileUrl) {
    return NextResponse.json({ error: "name 和 fileUrl 必填" }, { status: 400 });
  }
  const attachment = await prisma.projectAttachment.create({
    data: { name, fileUrl, fileSize: fileSize ? BigInt(fileSize) : null },
  });
  // BigInt 不能直接 JSON 序列化，转为字符串
  return NextResponse.json(
    { ...attachment, fileSize: attachment.fileSize?.toString() ?? null },
    { status: 201 }
  );
}
```

**Step 2: 创建 `src/app/api/project/attachments/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  await prisma.projectAttachment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
```

**Step 3: Commit**

```bash
git add src/app/api/project/attachments/
git commit -m "feat: add project attachments CRUD API"
```

---

### Task 5.3: Tiptap 富文本编辑器组件

**Files:**
- Create: `src/components/rich-text-editor.tsx`

**Step 1: 创建 `src/components/rich-text-editor.tsx`**

```tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Heading2, Link2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange?: (html: string) => void;
  editable?: boolean;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  editable = true,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: !editable }),
    ],
    content: value,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  if (!editor) return null;

  async function insertImage() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const { url } = await res.json();
      editor.chain().focus().setImage({ src: url }).run();
    };
    input.click();
  }

  return (
    <div className={cn("border rounded-md overflow-hidden", className)}>
      {editable && (
        <div className="flex gap-1 border-b px-2 py-1 bg-muted/30">
          <Button
            type="button" variant="ghost" size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive("bold") ? "bg-muted" : ""}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button" variant="ghost" size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive("italic") ? "bg-muted" : ""}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button" variant="ghost" size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive("heading", { level: 2 }) ? "bg-muted" : ""}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            type="button" variant="ghost" size="sm"
            onClick={insertImage}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        </div>
      )}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-3 min-h-[120px] focus-within:outline-none"
      />
    </div>
  );
}
```

**Step 2: 安装 Tailwind Typography 插件（prose 类名需要）**

```bash
npm install -D @tailwindcss/typography
```

在 `tailwind.config.ts` 的 `plugins` 数组中添加：

```ts
plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
```

**Step 3: Commit**

```bash
git add src/components/rich-text-editor.tsx tailwind.config.ts
git commit -m "feat: add Tiptap rich text editor component with image upload"
```

---

### Task 5.4: 项目介绍页面

**Files:**
- Create: `src/app/(protected)/project/page.tsx`
- Create: `src/components/project/section-editor.tsx`

**Step 1: 创建板块编辑弹窗组件 `src/components/project/section-editor.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/rich-text-editor";

interface SectionEditorProps {
  section: { id: number; title: string; content: string };
  open: boolean;
  onClose: () => void;
}

export function SectionEditor({ section, open, onClose }: SectionEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(section.title);
  const [content, setContent] = useState(section.content);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/project/sections/${section.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    setSaving(false);
    onClose();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>编辑板块</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>板块标题</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>内容</Label>
            <RichTextEditor value={content} onChange={setContent} />
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

**Step 2: 创建项目介绍页 `src/app/(protected)/project/page.tsx`**

```tsx
import { prisma } from "@/lib/prisma";
import { ProjectPageClient } from "@/components/project/project-page-client";

export default async function ProjectPage() {
  const [sections, attachments] = await Promise.all([
    prisma.projectSection.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.projectAttachment.findMany({ orderBy: { uploadedAt: "desc" } }),
  ]);

  const serializedAttachments = attachments.map((a) => ({
    ...a,
    fileSize: a.fileSize?.toString() ?? null,
  }));

  return (
    <ProjectPageClient sections={sections} attachments={serializedAttachments} />
  );
}
```

**Step 3: 创建 `src/components/project/project-page-client.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/rich-text-editor";
import { SectionEditor } from "./section-editor";
import { Pencil, Trash2, Download, Plus, Paperclip } from "lucide-react";

type Section = { id: number; title: string; content: string; sortOrder: number };
type Attachment = { id: number; name: string; fileUrl: string; fileSize: string | null };

export function ProjectPageClient({
  sections: initial,
  attachments: initialAttachments,
}: {
  sections: Section[];
  attachments: Attachment[];
}) {
  const router = useRouter();
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  async function handleDeleteSection(id: number) {
    if (!confirm("确认删除此板块？")) return;
    await fetch(`/api/project/sections/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleAddSection() {
    const title = prompt("请输入新板块标题：");
    if (!title) return;
    await fetch("/api/project/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content: "" }),
    });
    router.refresh();
  }

  async function handleDeleteAttachment(id: number) {
    if (!confirm("确认删除此附件？")) return;
    await fetch(`/api/project/attachments/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function formatSize(bytes: string | null): string {
    if (!bytes) return "";
    const n = parseInt(bytes);
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">项目介绍</h1>
        <Button onClick={handleAddSection} size="sm">
          <Plus className="h-4 w-4 mr-1" /> 新建板块
        </Button>
      </div>

      {initial.map((section) => (
        <Card key={section.id}>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">{section.title}</CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => setEditingSection(section)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDeleteSection(section.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <RichTextEditor value={section.content} editable={false} />
          </CardContent>
        </Card>
      ))}

      {/* 附件区 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" /> 项目附件
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {initialAttachments.length === 0 && (
            <p className="text-sm text-muted-foreground">暂无附件</p>
          )}
          {initialAttachments.map((att) => (
            <div key={att.id} className="flex items-center justify-between gap-2 py-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="truncate text-sm">{att.name}</span>
                {att.fileSize && (
                  <Badge variant="outline" className="text-xs shrink-0">
                    {formatSize(att.fileSize)}
                  </Badge>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" asChild>
                  <a href={att.fileUrl} download={att.name}>
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteAttachment(att.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {editingSection && (
        <SectionEditor
          section={editingSection}
          open={!!editingSection}
          onClose={() => setEditingSection(null)}
        />
      )}
    </div>
  );
}
```

**Step 4: 验证**

```bash
npm run build
```

预期：Build 成功。访问 `/project`，确认板块列表和附件区正常显示。

**Step 5: Commit**

```bash
git add src/app/\(protected\)/project/ src/components/project/
git commit -m "feat: add project introduction page with sections and attachments"
```

---

**Module 5 完成检查清单：**
- [ ] GET `/api/project/sections` 返回板块列表
- [ ] PUT `/api/project/sections/[id]` 可更新内容
- [ ] 项目介绍页正常展示富文本内容
- [ ] 板块编辑弹窗可保存内容
- [ ] 附件下载链接有效
- [ ] Tiptap 编辑器可插入图片（调用 `/api/upload`）
- [ ] `npm run build` 无错误
