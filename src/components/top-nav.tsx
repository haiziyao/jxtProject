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
    NAV_ITEMS.findIndex((item) => pathname === item.href),
    0,
  );

  return (
    <header className="sticky top-0 z-30 border-b border-[#d8e2f7] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1500px] items-center px-4 sm:px-6">
        <div className="w-44 shrink-0 text-sm font-semibold tracking-wide text-[#2f4f9b]">实验数据平台</div>
        <nav className="flex flex-1 items-center justify-center">
          <div className="relative flex w-full max-w-md items-center rounded-full border border-[#c8d8f5] bg-[#edf3ff] p-1">
            <span
              className="absolute bottom-1 left-1 top-1 rounded-full bg-[#4f78c8] shadow-[0_6px_16px_rgba(79,120,200,0.35)] transition-transform duration-300"
              style={{
                width: `calc((100% - 8px) / ${NAV_ITEMS.length})`,
                transform: `translateX(${activeIndex * 100}%)`,
              }}
            />
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              const className = active
                ? "relative z-10 flex-1 rounded-full px-3 py-1.5 text-center text-sm text-white"
                : "relative z-10 flex-1 rounded-full px-3 py-1.5 text-center text-sm text-[#5b79ba] transition hover:text-[#2f4f9b]";

              return (
                <Link key={item.href} href={item.href} className={className}>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
        <div className="flex w-44 shrink-0 justify-end">
          {onCreateTodoToolClick ? (
            <button
              type="button"
              onClick={onCreateTodoToolClick}
              className="rounded-full border border-[#9db5e5] bg-[#eff4ff] px-3 py-1.5 text-xs text-[#365fae] transition hover:bg-[#e4edff]"
            >
              + 创建 TODO
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
