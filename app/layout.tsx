import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "심플스캔 — 문서 스캐너",
  description:
    "카메라로 문서를 촬영하거나 이미지·PDF를 가져와 자동 보정 후 PDF로 저장하는 간편한 문서 스캐너.",
  applicationName: "심플스캔",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "심플스캔",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#15171a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// FOUC 방지: 페인트 전에 저장된/시스템 테마를 <html>에 반영.
const themeInit = `(function(){try{var s=localStorage.getItem("ss-theme");var d=s?s==="dark":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

const fontStack =
  '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Segoe UI", "Malgun Gothic", "Helvetica Neue", Arial, sans-serif';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" style={{ ["--font-app-sans" as string]: fontStack }}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
