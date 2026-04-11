# 瀹為獙鏁版嵁骞冲彴 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 鏋勫缓渚?7 浜哄洟闃熶娇鐢ㄧ殑鍐呴儴瀹為獙鏁版嵁绠＄悊缃戠珯锛屾敮鎸佸瘑鐮佷繚鎶ゃ€佹墜鏈?鐢佃剳璁块棶銆侀」鐩粙缁嶇鐞嗗拰瀹為獙鏁版嵁鏀堕泦灞曠ず銆?
**Architecture:** Next.js 14 App Router 鍏ㄦ爤搴旂敤锛屽墠绔娇鐢?shadcn/ui + Tailwind CSS锛屽悗绔娇鐢?API Routes锛屾暟鎹簱 MySQL 8 閫氳繃 Prisma ORM 璁块棶锛屽浘鐗?鏂囦欢瀛樺偍浜?MinIO锛屽崟涓€瀵嗙爜 + JWT Cookie 璁よ瘉銆?
**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Tiptap, Prisma, MySQL 8, MinIO, JWT

---

## Module 1: 椤圭洰鍒濆鍖?
### Task 1.1: 鍒涘缓 Next.js 14 椤圭洰

**Files:**
- Create: `package.json` (鑷姩鐢熸垚)
- Create: `next.config.ts`
- Create: `tsconfig.json` (鑷姩鐢熸垚)

**Step 1: 鍒濆鍖栭」鐩?*

鍦?`E:\JXTProject` 鐩綍涓嬭繍琛岋細

```bash
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

閫夐」璇存槑锛?- `--typescript` 鍚敤 TypeScript
- `--tailwind` 闆嗘垚 Tailwind CSS
- `--app` 浣跨敤 App Router
- `--src-dir` 婧愮爜鏀惧湪 `src/` 鐩綍
- `--no-git` 涓嶉噸鏂板垵濮嬪寲 git锛堝凡鏈変粨搴擄級

**Step 2: 楠岃瘉椤圭洰缁撴瀯**

```bash
ls src/app
```

棰勬湡杈撳嚭锛歚favicon.ico  globals.css  layout.tsx  page.tsx`

**Step 3: 楠岃瘉寮€鍙戞湇鍔″櫒鍙惎鍔?*

```bash
npm run dev
```

棰勬湡锛氭祻瑙堝櫒璁块棶 `http://localhost:3000` 鏄剧ず Next.js 榛樿椤甸潰銆傜‘璁ゅ悗 Ctrl+C 鍋滄銆?
---

### Task 1.2: 瀹夎鏍稿績渚濊禆

**Step 1: 瀹夎 shadcn/ui**

```bash
npx shadcn@latest init
```

浜や簰閫夐」锛?- Style: `Default`
- Base color: `Slate`
- CSS variables: `Yes`

**Step 2: 瀹夎甯哥敤 shadcn 缁勪欢**

```bash
npx shadcn@latest add button card input label dialog sheet badge textarea toast
```

**Step 3: 瀹夎鍏朵綑渚濊禆**

```bash
npm install @prisma/client minio jsonwebtoken
npm install -D prisma @types/jsonwebtoken
```

**Step 4: 瀹夎 Tiptap 瀵屾枃鏈紪杈戝櫒**

```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link
```

**Step 5: 楠岃瘉瀹夎**

```bash
npm ls @prisma/client minio jsonwebtoken @tiptap/react
```

棰勬湡锛氭棤 `UNMET DEPENDENCY` 閿欒銆?
**Step 6: Commit**

```bash
git add package.json package-lock.json next.config.ts tsconfig.json src/ components.json tailwind.config.ts postcss.config.mjs
git commit -m "feat: initialize Next.js 14 project with shadcn/ui and core dependencies"
```

---

### Task 1.3: 閰嶇疆鐜鍙橀噺

**Files:**
- Create: `.env.local`
- Create: `.env.example`
- Modify: `.gitignore`

**Step 1: 鍒涘缓 `.env.local`**

```env
# 鏁版嵁搴?DATABASE_URL="mysql://user:password@db-host:3306/dbname"

# MinIO
MINIO_ENDPOINT="your-minio-host"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="your-minio-secret"
MINIO_SECRET_KEY="your-minio-secret"
MINIO_BUCKET="jxt"

# 璁よ瘉
SITE_PASSWORD="change_me_in_production"
JWT_SECRET="change_me_to_random_32_char_string"
```

**Step 2: 鍒涘缓 `.env.example`锛堟彁浜ゅ埌 git 鐨勬ā鏉匡級**

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

**Step 3: 纭 `.gitignore` 鍖呭惈 `.env.local`**

妫€鏌?`.gitignore` 鏄惁宸叉湁 `.env*.local`锛孨ext.js 榛樿宸插寘鍚紝鏃犻渶淇敼銆?
**Step 4: Commit**

```bash
git add .env.example .gitignore
git commit -m "feat: add environment variable template"
```

---

### Task 1.4: 鍒濆鍖?Prisma

**Files:**
- Create: `prisma/schema.prisma`

**Step 1: 鍒濆鍖?Prisma**

```bash
npx prisma init --datasource-provider mysql
```

**Step 2: 楠岃瘉 `prisma/schema.prisma` 鍐呭**

纭鏂囦欢涓?`datasource db` 鐨?`url` 鎸囧悜 `env("DATABASE_URL")`銆?
**Step 3: 娴嬭瘯鏁版嵁搴撹繛鎺?*

```bash
npx prisma db pull
```

棰勬湡锛氳繛鎺ユ垚鍔燂紙鏁版嵁搴撲负绌烘椂浼氭彁绀?"The introspected database was empty"锛岃繖鏄甯哥殑锛夈€?
**Step 4: Commit**

```bash
git add prisma/
git commit -m "feat: initialize Prisma with MySQL datasource"
```

---

### Task 1.5: 娓呯悊榛樿椤甸潰鍐呭

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

**Step 1: 娓呯┖榛樿棣栭〉**

灏?`src/app/page.tsx` 鏇挎崲涓烘渶绠€鍗犱綅鍐呭锛?
```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Loading...</p>
    </main>
  );
}
```

**Step 2: 娓呯悊 `globals.css`**

淇濈暀 Tailwind 鎸囦护鍜?shadcn/ui CSS 鍙橀噺锛屽垹闄?Next.js 榛樿绀轰緥鏍峰紡锛坄:root` 浠ヤ笅鐨?`a`銆乣body` 绛夌ず渚嬭鍒欙級銆?
**Step 3: 楠岃瘉**

```bash
npm run build
```

棰勬湡锛欱uild 鎴愬姛锛屾棤 TypeScript 閿欒銆?
**Step 4: Commit**

```bash
git add src/app/page.tsx src/app/globals.css
git commit -m "chore: clean up default Next.js boilerplate"
```

---

**Module 1 瀹屾垚妫€鏌ユ竻鍗曪細**
- [ ] `npm run dev` 鍙甯稿惎鍔?- [ ] `npm run build` 鏃犻敊璇?- [ ] shadcn/ui 缁勪欢鍙甯稿鍏?- [ ] `.env.local` 宸查厤缃紙涓嶆彁浜ゅ埌 git锛?- [ ] Prisma 鍙繛鎺ユ暟鎹簱

---

## Module 2: 璁よ瘉绯荤粺

### Task 2.1: JWT 宸ュ叿鍑芥暟

**Files:**
- Create: `src/lib/auth.ts`

**Step 1: 缂栧啓 JWT 绛惧彂涓庨獙璇佸伐鍏?*

鍒涘缓 `src/lib/auth.ts`锛?
```ts
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = "auth_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 澶╋紙绉掞級

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

### Task 2.2: 鐧诲綍 API Route

**Files:**
- Create: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/logout/route.ts`

**Step 1: 鍒涘缓鐧诲綍鎺ュ彛 `src/app/api/auth/login/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { signToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (password !== process.env.SITE_PASSWORD) {
    return NextResponse.json({ error: "瀵嗙爜閿欒" }, { status: 401 });
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

**Step 2: 鍒涘缓鐧诲嚭鎺ュ彛 `src/app/api/auth/logout/route.ts`**

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

### Task 2.3: 璁よ瘉涓棿浠?
**Files:**
- Create: `src/middleware.ts`

**Step 1: 鍒涘缓 `src/middleware.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

const PUBLIC_PATHS = ["/", "/api/auth/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 鏀捐鍏紑璺緞
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token || !verifyToken(token)) {
    // API 璇锋眰杩斿洖 401锛岄〉闈㈣姹傞噸瀹氬悜鍒扮櫥褰曢〉
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "鏈櫥褰? }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

**Step 2: 楠岃瘉涓棿浠堕€昏緫**

鎵嬪姩妫€鏌ワ細
- 鏈櫥褰曡闂?`/dashboard` 鈫?閲嶅畾鍚戝埌 `/`
- 鏈櫥褰曡闂?`/api/experiments` 鈫?杩斿洖 401
- 宸茬櫥褰曪紙鏈夋晥 Cookie锛夆啋 姝ｅ父閫氳繃

**Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add auth middleware to protect all routes"
```

---

### Task 2.4: 鐧诲綍椤甸潰

**Files:**
- Create: `src/app/page.tsx`锛堟浛鎹㈠崰浣嶅唴瀹癸級

**Step 1: 缂栧啓鐧诲綍椤?`src/app/page.tsx`**

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
      setError("瀵嗙爜閿欒锛岃閲嶈瘯");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-xl">瀹為獙鏁版嵁骞冲彴</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">璁块棶瀵嗙爜</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="璇疯緭鍏ュ瘑鐮?
                required
                autoFocus
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "楠岃瘉涓?.." : "杩涘叆"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
```

**Step 2: 楠岃瘉**

```bash
npm run build
```

棰勬湡锛欱uild 鎴愬姛锛屾棤 TypeScript 閿欒銆?
**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add password login page"
```

---

### Task 2.5: Dashboard 鍗犱綅椤?
**Files:**
- Create: `src/app/dashboard/page.tsx`

**Step 1: 鍒涘缓 Dashboard 鍗犱綅椤?*

```tsx
export default function DashboardPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Dashboard 鈥?寰呭疄鐜?/p>
    </main>
  );
}
```

**Step 2: 绔埌绔獙璇佽璇佹祦绋?*

1. 鍚姩 `npm run dev`
2. 璁块棶 `http://localhost:3000` 鈫?鏄剧ず鐧诲綍椤?3. 杈撳叆閿欒瀵嗙爜 鈫?鏄剧ず"瀵嗙爜閿欒"
4. 杈撳叆姝ｇ‘瀵嗙爜锛坄.env.local` 涓殑 `SITE_PASSWORD`锛夆啋 璺宠浆鍒?`/dashboard`
5. 鐩存帴璁块棶 `http://localhost:3000/dashboard`锛堟湭鐧诲綍锛夆啋 閲嶅畾鍚戝洖 `/`

**Step 3: Commit**

```bash
git add src/app/dashboard/
git commit -m "feat: add dashboard placeholder and complete auth flow"
```

---

**Module 2 瀹屾垚妫€鏌ユ竻鍗曪細**
- [ ] 姝ｇ‘瀵嗙爜鍙櫥褰曞苟璺宠浆 Dashboard
- [ ] 閿欒瀵嗙爜鏄剧ず閿欒鎻愮ず
- [ ] 鏈櫥褰曡闂彈淇濇姢椤甸潰鑷姩閲嶅畾鍚?- [ ] 鏈櫥褰曡闂?API 杩斿洖 401
- [ ] Cookie 鏈夋晥鏈?14 澶?- [ ] `npm run build` 鏃犻敊璇?

