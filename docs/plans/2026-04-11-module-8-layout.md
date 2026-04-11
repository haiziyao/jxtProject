# Module 8: 响应式布局 & 导航

> **For Claude:** Part of the lab data platform implementation plan. Run last, after Modules 5-7.

---

### Task 8.1: 应用布局组件

**Files:**
- Create: `src/components/layout/app-layout.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: 安装 lucide-react 图标（shadcn/ui 已包含，确认可用）**

```bash
npm ls lucide-react
```

预期：已安装。若未安装则运行 `npm install lucide-react`。

**Step 2: 创建 `src/components/layout/app-layout.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, FlaskConical, BookOpen, LayoutDashboard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "主页", icon: LayoutDashboard },
  { href: "/project", label: "项目介绍", icon: BookOpen },
  { href: "/experiments", label: "实验记录", icon: FlaskConical },
];

function NavLinks({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="flex flex-col gap-1 flex-1">
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === href
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
      <div className="mt-auto pt-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          退出登录
        </Button>
      </div>
    </nav>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* 桌面端侧边栏 */}
      <aside className="hidden md:flex w-56 flex-col border-r bg-background px-4 py-6">
        <p className="mb-6 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          实验数据平台
        </p>
        <NavLinks />
      </aside>

      {/* 移动端顶部栏 */}
      <div className="flex flex-1 flex-col">
        <header className="flex md:hidden items-center gap-3 border-b px-4 py-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-56 px-4 py-6">
              <p className="mb-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                实验数据平台
              </p>
              <NavLinks onClose={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="font-medium text-sm">实验数据平台</span>
        </header>

        {/* 主内容区 */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
```

**Step 3: 修改 `src/app/layout.tsx`**

在登录页（`/`）不需要 AppLayout，受保护页面才需要。在 `src/app/(protected)/layout.tsx` 中使用：

创建 `src/app/(protected)/layout.tsx`：

```tsx
import { AppLayout } from "@/components/layout/app-layout";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
```

**Step 4: 迁移受保护页面到 (protected) 路由组**

将以下目录移动到 `src/app/(protected)/` 下：
- `src/app/dashboard/` → `src/app/(protected)/dashboard/`
- `src/app/project/` → `src/app/(protected)/project/`
- `src/app/experiments/` → `src/app/(protected)/experiments/`

路由不变（Next.js 路由组括号目录不影响 URL）。

**Step 5: Commit**

```bash
git add src/components/layout/ src/app/\(protected\)/
git commit -m "feat: add responsive app layout with sidebar (desktop) and drawer (mobile)"
```

---

### Task 8.2: Dashboard 首页

**Files:**
- Modify: `src/app/(protected)/dashboard/page.tsx`

**Step 1: 替换 Dashboard 占位页**

```tsx
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, FlaskConical } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">欢迎回来</h1>
        <p className="text-muted-foreground mt-1">
          避雷器高性能高电位梯度氧化锌压敏电阻片的研发和应用
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/project">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>项目介绍</CardTitle>
                  <CardDescription className="mt-1">
                    查看和编辑项目方案、创新点、技术路线等板块内容
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/experiments">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <FlaskConical className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>实验记录</CardTitle>
                  <CardDescription className="mt-1">
                    记录实验数据、上传图片、添加备注，支持标签筛选
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
```

**Step 2: 最终验证**

```bash
npm run build
```

预期：Build 成功，无 TypeScript / ESLint 错误。

完整流程验证：
1. 访问 `http://localhost:3000` → 登录页
2. 输入正确密码 → 跳转 `/dashboard`，显示两个入口卡片
3. 手机模式（F12 切换）→ 顶部汉堡菜单
4. 桌面模式 → 左侧边栏导航
5. 点击"退出登录" → 回到登录页，重新访问 `/dashboard` 自动重定向

**Step 3: Commit**

```bash
git add src/app/\(protected\)/dashboard/page.tsx
git commit -m "feat: complete dashboard page and finalize responsive layout"
```

---

**Module 8 完成检查清单：**
- [ ] 桌面端：左侧固定侧边栏，显示导航菜单
- [ ] 手机端：顶部汉堡菜单，点击展开抽屉导航
- [ ] 当前页面导航项高亮显示
- [ ] 退出登录清除 Cookie 并重定向到登录页
- [ ] Dashboard 两个入口卡片可正常跳转
- [ ] `npm run build` 无错误
- [ ] 全流程端到端测试通过
