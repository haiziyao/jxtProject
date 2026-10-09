"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "首页" },
  { href: "/experiments", label: "实验记录" },
  { href: "/todo", label: "意见/TODO" },
];

interface TopNavProps {
  onCreateTodoToolClick?: () => void;
}

export function TopNav({ onCreateTodoToolClick }: TopNavProps) {
  const pathname = usePathname();
  const activeIndex = Math.max(
    NAV_ITEMS.findIndex((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)),
    0,
  );

  return (
    <header className="sticky top-0 z-30 border-b border-[#d8e2f7] bg-white/95 backdrop-blur">
      <div className="mx-auto grid w-full max-w-[1500px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3 md:grid-cols-[176px_minmax(0,1fr)_176px] md:px-6">
        <Link href="/dashboard" className="min-w-0 text-sm font-semibold tracking-wide text-[#2f4f9b]">实验数据平台</Link>
        <nav aria-label="主导航" className="col-span-2 row-start-2 min-w-0 md:col-span-1 md:col-start-2 md:row-start-1 md:flex md:justify-center">
          <div className="relative flex w-full max-w-md items-center rounded-full border border-[#c8d8f5] bg-[#edf3ff] p-1">
            <span
              className="absolute bottom-1 left-1 top-1 rounded-full bg-[#4f78c8] shadow-[0_6px_16px_rgba(79,120,200,0.35)] transition-transform duration-300"
              style={{
                width: `calc((100% - 8px) / ${NAV_ITEMS.length})`,
                transform: `translateX(${activeIndex * 100}%)`,
              }}
            />
            {NAV_ITEMS.map((item) => {
              const active = NAV_ITEMS[activeIndex].href === item.href;
              const className = active
                ? "relative z-10 flex min-h-10 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-full px-2 text-center text-sm text-white"
                : "relative z-10 flex min-h-10 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-full px-2 text-center text-sm text-[#5b79ba] transition hover:text-[#2f4f9b]";

              return (
                <Link key={item.href} href={item.href} className={className} aria-current={active ? "page" : undefined}>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="col-start-2 row-start-1 flex justify-end md:col-start-3">
          {onCreateTodoToolClick ? (
            <button
              type="button"
              onClick={onCreateTodoToolClick}
              className="min-h-10 whitespace-nowrap rounded-full border border-[#9db5e5] bg-[#eff4ff] px-3 text-xs text-[#365fae] transition hover:bg-[#e4edff]"
            >
              + 创建 TODO
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
