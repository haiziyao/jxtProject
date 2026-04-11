"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setError("密码错误，请重试。");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("网络异常，请稍后重试。");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
        <section className="relative hidden overflow-hidden border-r border-zinc-800 lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(14,165,233,0.22),transparent_38%),radial-gradient(circle_at_90%_75%,rgba(34,197,94,0.2),transparent_40%),linear-gradient(135deg,#0a0a0a_0%,#101827_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:42px_42px]" />
          <div className="relative flex h-full flex-col justify-between p-12">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Lab Data Platform</p>
              <h1 className="max-w-xl text-4xl font-semibold leading-tight">
                实验数据管理工作台
              </h1>
              <p className="max-w-lg text-sm leading-7 text-zinc-300">
                避雷器高性能高电位梯度氧化锌压敏电阻片的研发和应用
              </p>
            </div>
            <p className="text-xs tracking-wide text-zinc-500">Internal Access Only</p>
          </div>
        </section>

        <section className="flex items-center px-6 py-10 sm:px-10 lg:px-16">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-10 border-b border-zinc-800 pb-5">
              <h2 className="text-2xl font-semibold">登录</h2>
              <p className="mt-2 text-sm text-zinc-400">输入访问密码进入系统。</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                访问密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="请输入密码"
                autoFocus
                required
                className="w-full border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-zinc-100 outline-none transition focus:border-sky-400"
              />
              {error ? <p className="text-sm text-rose-400">{error}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full border border-zinc-600 bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "验证中..." : "进入系统"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
