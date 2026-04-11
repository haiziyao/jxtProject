# Module 6: 实验记录模块

> **For Claude:** Part of the lab data platform implementation plan. Run after Module 5.

---

### Task 6.1: 标签 API Routes

**Files:**
- Create: `src/app/api/tags/route.ts`
- Create: `src/app/api/tags/[id]/route.ts`

**Step 1: 创建 `src/app/api/tags/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tags = await prisma.tag.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(tags);
}

export async function POST(req: NextRequest) {
  const { name, color } = await req.json();
  if (!name || !color) {
    return NextResponse.json({ error: "name 和 color 必填" }, { status: 400 });
  }
  const tag = await prisma.tag.create({ data: { name, color } });
  return NextResponse.json(tag, { status: 201 });
}
```

**Step 2: 创建 `src/app/api/tags/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  await prisma.tag.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
```

**Step 3: Commit**

```bash
git add src/app/api/tags/
git commit -m "feat: add tags CRUD API"
```

---

### Task 6.2: 实验列表 & 新建 API Routes

**Files:**
- Create: `src/app/api/experiments/route.ts`

**Step 1: 创建 `src/app/api/experiments/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/experiments?tagIds=1,2,3
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tagIdsParam = searchParams.get("tagIds");
  const tagIds = tagIdsParam
    ? tagIdsParam.split(",").map(Number).filter(Boolean)
    : [];

  const experiments = await prisma.experiment.findMany({
    where:
      tagIds.length > 0
        ? { tags: { some: { tagId: { in: tagIds } } } }
        : undefined,
    include: {
      tags: { include: { tag: true } },
    },
    orderBy: { expDate: "desc" },
  });

  // 拍平 tags 结构，方便前端使用
  const result = experiments.map((exp) => ({
    ...exp,
    tags: exp.tags.map((et) => et.tag),
  }));

  return NextResponse.json(result);
}

// POST /api/experiments
export async function POST(req: NextRequest) {
  const { title, recorder, expDate, summary, tagIds } = await req.json();

  if (!title || !recorder || !expDate || !summary) {
    return NextResponse.json({ error: "title/recorder/expDate/summary 必填" }, { status: 400 });
  }

  const experiment = await prisma.experiment.create({
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

  return NextResponse.json(
    { ...experiment, tags: experiment.tags.map((et) => et.tag) },
    { status: 201 }
  );
}
```

**Step 2: Commit**

```bash
git add src/app/api/experiments/route.ts
git commit -m "feat: add experiments list and create API with tag filtering"
```

---

### Task 6.3: 新建实验 Dialog 组件

**Files:**
- Create: `src/components/experiments/create-experiment-dialog.tsx`

**Step 1: 创建 `src/components/experiments/create-experiment-dialog.tsx`**

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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tag = { id: number; name: string; color: string };

interface Props {
  open: boolean;
  onClose: () => void;
  tags: Tag[];
}

export function CreateExperimentDialog({ open, onClose, tags }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [recorder, setRecorder] = useState("");
  const [expDate, setExpDate] = useState("");
  const [summary, setSummary] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleTag(id: number) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/experiments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, recorder, expDate, summary, tagIds: selectedTagIds,
      }),
    });
    setSaving(false);
    onClose();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>新建实验记录</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>实验标题 *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>记录人 *</Label>
              <Input value={recorder} onChange={(e) => setRecorder(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>实验日期 *</Label>
              <Input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>实验简介 *</Label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>标签（可多选）</Label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className={cn(
                    "cursor-pointer select-none transition-all",
                    selectedTagIds.includes(tag.id)
                      ? "ring-2 ring-offset-1"
                      : "opacity-60"
                  )}
                  style={{ borderColor: tag.color, color: tag.color }}
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </Badge>
              ))}
              {tags.length === 0 && (
                <span className="text-sm text-muted-foreground">暂无标签，可在实验详情中添加</span>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>取消</Button>
            <Button type="submit" disabled={saving}>
              {saving ? "创建中..." : "创建"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/experiments/create-experiment-dialog.tsx
git commit -m "feat: add create experiment dialog with tag multi-select"
```

---

### Task 6.4: 实验列表页面

**Files:**
- Create: `src/app/(protected)/experiments/page.tsx`
- Create: `src/components/experiments/experiments-list-client.tsx`

**Step 1: 创建 Server Component `src/app/(protected)/experiments/page.tsx`**

```tsx
import { prisma } from "@/lib/prisma";
import { ExperimentsListClient } from "@/components/experiments/experiments-list-client";

export default async function ExperimentsPage() {
  const [experiments, tags] = await Promise.all([
    prisma.experiment.findMany({
      include: { tags: { include: { tag: true } } },
      orderBy: { expDate: "desc" },
    }),
    prisma.tag.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const serialized = experiments.map((exp) => ({
    ...exp,
    expDate: exp.expDate.toISOString().split("T")[0],
    createdAt: exp.createdAt.toISOString(),
    updatedAt: exp.updatedAt.toISOString(),
    tags: exp.tags.map((et) => et.tag),
  }));

  return <ExperimentsListClient experiments={serialized} tags={tags} />;
}
```

**Step 2: 创建 `src/components/experiments/experiments-list-client.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateExperimentDialog } from "./create-experiment-dialog";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Tag = { id: number; name: string; color: string };
type Experiment = {
  id: number; title: string; recorder: string;
  expDate: string; summary: string; tags: Tag[];
};

interface Props {
  experiments: Experiment[];
  tags: Tag[];
}

export function ExperimentsListClient({ experiments, tags }: Props) {
  const [filterTagIds, setFilterTagIds] = useState<number[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  function toggleFilter(id: number) {
    setFilterTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  const filtered =
    filterTagIds.length === 0
      ? experiments
      : experiments.filter((exp) =>
          filterTagIds.some((tid) => exp.tags.some((t) => t.id === tid))
        );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">实验记录</h1>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> 新建实验
        </Button>
      </div>

      {/* 标签筛选栏 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">筛选：</span>
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className={cn(
                "cursor-pointer select-none transition-all",
                filterTagIds.includes(tag.id) ? "ring-2 ring-offset-1" : "opacity-60"
              )}
              style={{ borderColor: tag.color, color: tag.color }}
              onClick={() => toggleFilter(tag.id)}
            >
              {tag.name}
            </Badge>
          ))}
          {filterTagIds.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setFilterTagIds([])}>
              清除筛选
            </Button>
          )}
        </div>
      )}

      {/* 实验卡片网格 */}
      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">暂无实验记录</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((exp) => (
            <Link key={exp.id} href={`/experiments/${exp.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base line-clamp-1">{exp.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {exp.recorder} · {exp.expDate}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{exp.summary}</p>
                  <div className="flex flex-wrap gap-1">
                    {exp.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="text-xs"
                        style={{ borderColor: tag.color, color: tag.color }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateExperimentDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        tags={tags}
      />
    </div>
  );
}
```

**Step 3: 验证**

```bash
npm run build
```

访问 `/experiments`：
- 卡片列表正常渲染
- 标签筛选栏有效过滤
- 新建实验弹窗提交后列表刷新

**Step 4: Commit**

```bash
git add src/app/\(protected\)/experiments/page.tsx src/components/experiments/
git commit -m "feat: add experiments list page with tag filter and create dialog"
```

---

**Module 6 完成检查清单：**
- [ ] GET `/api/tags` 返回标签列表
- [ ] POST `/api/experiments` 可创建含标签的实验记录
- [ ] GET `/api/experiments?tagIds=1,2` 正确过滤
- [ ] 实验列表卡片显示标题、记录人、日期、摘要、标签
- [ ] 标签筛选栏可多选过滤
- [ ] 新建实验弹窗表单验证正常
- [ ] `npm run build` 无错误
