import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lab Data Platform",
  description: "Frontend reset for redesign",
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
