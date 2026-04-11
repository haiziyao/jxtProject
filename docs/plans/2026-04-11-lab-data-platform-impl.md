# 实验数据平台 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建供 7 人团队使用的内部实验数据管理网站，支持密码保护、手机/电脑访问、项目介绍管理和实验数据收集展示。

**Architecture:** Next.js 14 App Router 全栈应用，前端使用 shadcn/ui + Tailwind CSS，后端使用 API Routes，数据库 MySQL 8 通过 Prisma ORM 访问，图片/文件存储于 MinIO，单一密码 + JWT Cookie 认证。

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Tiptap, Prisma, MySQL 8, MinIO, JWT

---

## Module 1: 项目初始化

### Task 1.1: 创建 Next.js 14 项目

**Files:**
- Create: `package.json` (自动生成)
- Create: `next.config.ts`
- Create: `tsconfig.json` (自动生成)

**Step 1: 初始化项目**

在 `E:\JXTProject` 目录下运行：

```bash
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

选项说明：
- `--typescript` 启用 TypeScript
- `--tailwind` 集成 Tailwind CSS
- `--app` 使用 App Router
- `--src-dir` 源码放在 `src/` 目录
- `--no-git` 不重新初始化 git（已有仓库）

**Step 2: 验证项目结构**

```bash
ls src/app
```

预期输出：`favicon.ico  globals.css  layout.tsx  page.tsx`

**Step 3: 验证开发服务器可启动**

```bash
npm run dev
```

预期：浏览器访问 `http://localhost:3000` 显示 Next.js 默认页面。确认后 Ctrl+C 停止。

---

### Task 1.2: 安装核心依赖

**Step 1: 安装 shadcn/ui**

```bash
npx shadcn@latest init
```

交互选项：
- Style: `Default`
- Base color: `Slate`
- CSS variables: `Yes`

**Step 2: 安装常用 shadcn 组件**

```bash
npx shadcn@latest add button card input label dialog sheet badge textarea toast
```

**Step 3: 安装其余依赖**

```bash
npm install @prisma/client minio jsonwebtoken
npm install -D prisma @types/jsonwebtoken
```

**Step 4: 安装 Tiptap 富文本编辑器**

```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link
```

**Step 5: 验证安装**

```bash
npm ls @prisma/client minio jsonwebtoken @tiptap/react
```

预期：无 `UNMET DEPENDENCY` 错误。

**Step 6: Commit**

```bash
git add package.json package-lock.json next.config.ts tsconfig.json src/ components.json tailwind.config.ts postcss.config.mjs
git commit -m "feat: initialize Next.js 14 project with shadcn/ui and core dependencies"
```

---

### Task 1.3: 配置环境变量

**Files:**
- Create: `.env.local`
- Create: `.env.example`
- Modify: `.gitignore`

**Step 1: 创建 `.env.local`**

```env
# 数据库
DATABASE_URL="mysql://jxt:123456@8.152.100.169:3306/jxt"

# MinIO
MINIO_ENDPOINT="8.152.100.169"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="jxt"

# 认证
SITE_PASSWORD="change_me_in_production"
JWT_SECRET="change_me_to_random_32_char_string"
```

**Step 2: 创建 `.env.example`（提交到 git 的模板）**

```env
DATABASE_URL="mysql://user:password@host:3306/dbname"
MINIO_ENDPOINT="your-minio-host"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="your-access-key"
MINIO_SECRET_KEY="your-secret-key"
MINIO_BUCKET="your-bucket"
SITE_PASSWORD="your_site_password"
JWT_SECRET="your_jwt_secret_32_chars_minimum"
```

**Step 3: 确认 `.gitignore` 包含 `.env.local`**

检查 `.gitignore` 是否已有 `.env*.local`，Next.js 默认已包含，无需修改。

**Step 4: Commit**

```bash
git add .env.example .gitignore
git commit -m "feat: add environment variable template"
```

---

### Task 1.4: 初始化 Prisma

**Files:**
- Create: `prisma/schema.prisma`

**Step 1: 初始化 Prisma**

```bash
npx prisma init --datasource-provider mysql
```

**Step 2: 验证 `prisma/schema.prisma` 内容**

确认文件中 `datasource db` 的 `url` 指向 `env("DATABASE_URL")`。

**Step 3: 测试数据库连接**

```bash
npx prisma db pull
```

预期：连接成功（数据库为空时会提示 "The introspected database was empty"，这是正常的）。

**Step 4: Commit**

```bash
git add prisma/
git commit -m "feat: initialize Prisma with MySQL datasource"
```

---

### Task 1.5: 清理默认页面内容

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

**Step 1: 清空默认首页**

将 `src/app/page.tsx` 替换为最简占位内容：

```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Loading...</p>
    </main>
  );
}
```

**Step 2: 清理 `globals.css`**

保留 Tailwind 指令和 shadcn/ui CSS 变量，删除 Next.js 默认示例样式（`:root` 以下的 `a`、`body` 等示例规则）。

**Step 3: 验证**

```bash
npm run build
```

预期：Build 成功，无 TypeScript 错误。

**Step 4: Commit**

```bash
git add src/app/page.tsx src/app/globals.css
git commit -m "chore: clean up default Next.js boilerplate"
```

---

**Module 1 完成检查清单：**
- [ ] `npm run dev` 可正常启动
- [ ] `npm run build` 无错误
- [ ] shadcn/ui 组件可正常导入
- [ ] `.env.local` 已配置（不提交到 git）
- [ ] Prisma 可连接数据库

---

## Module 2: 认证系统

### Task 2.1: JWT 工具函数

**Files:**
- Create: `src/lib/auth.ts`

**Step 1: 编写 JWT 签发与验证工具**

创建 `src/lib/auth.ts`：

```ts
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = "auth_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 天（秒）

export function signToken(): string {
  return jwt.sign({ auth: true }, JWT_SECRET, { expiresIn: "14d" });
}

export function verifyToken(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export { COOKIE_NAME, COOKIE_MAX_AGE };
```

**Step 2: Commit**

```bash
git add src/lib/auth.ts
git commit -m "feat: add JWT sign/verify utilities"
```

---

### Task 2.2: 登录 API Route

**Files:**
- Create: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/logout/route.ts`

**Step 1: 创建登录接口 `src/app/api/auth/login/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { signToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (password !== process.env.SITE_PASSWORD) {
    return NextResponse.json({ error: "密码错误" }, { status: 401 });
  }

  const token = signToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return res;
}
```

**Step 2: 创建登出接口 `src/app/api/auth/logout/route.ts`**

```ts
import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return res;
}
```

**Step 3: Commit**

```bash
git add src/app/api/auth/
git commit -m "feat: add login and logout API routes"
```

---

### Task 2.3: 认证中间件

**Files:**
- Create: `src/middleware.ts`

**Step 1: 创建 `src/middleware.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

const PUBLIC_PATHS = ["/", "/api/auth/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 放行公开路径
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token || !verifyToken(token)) {
    // API 请求返回 401，页面请求重定向到登录页
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

**Step 2: 验证中间件逻辑**

手动检查：
- 未登录访问 `/dashboard` → 重定向到 `/`
- 未登录访问 `/api/experiments` → 返回 401
- 已登录（有效 Cookie）→ 正常通过

**Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add auth middleware to protect all routes"
```

---

### Task 2.4: 登录页面

**Files:**
- Create: `src/app/page.tsx`（替换占位内容）

**Step 1: 编写登录页 `src/app/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      setError("密码错误，请重试");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-xl">实验数据平台</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">访问密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
                autoFocus
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "验证中..." : "进入"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
```

**Step 2: 验证**

```bash
npm run build
```

预期：Build 成功，无 TypeScript 错误。

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add password login page"
```

---

### Task 2.5: Dashboard 占位页

**Files:**
- Create: `src/app/dashboard/page.tsx`

**Step 1: 创建 Dashboard 占位页**

```tsx
export default function DashboardPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Dashboard — 待实现</p>
    </main>
  );
}
```

**Step 2: 端到端验证认证流程**

1. 启动 `npm run dev`
2. 访问 `http://localhost:3000` → 显示登录页
3. 输入错误密码 → 显示"密码错误"
4. 输入正确密码（`.env.local` 中的 `SITE_PASSWORD`）→ 跳转到 `/dashboard`
5. 直接访问 `http://localhost:3000/dashboard`（未登录）→ 重定向回 `/`

**Step 3: Commit**

```bash
git add src/app/dashboard/
git commit -m "feat: add dashboard placeholder and complete auth flow"
```

---

**Module 2 完成检查清单：**
- [ ] 正确密码可登录并跳转 Dashboard
- [ ] 错误密码显示错误提示
- [ ] 未登录访问受保护页面自动重定向
- [ ] 未登录访问 API 返回 401
- [ ] Cookie 有效期 14 天
- [ ] `npm run build` 无错误

