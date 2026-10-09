import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lab Data Platform",
  description: "项目资料、实验记录与待办管理平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
