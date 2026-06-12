import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Card Shop",
  description: "Self-hosted digital card shop"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
