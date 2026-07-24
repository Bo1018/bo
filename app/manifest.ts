import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "심플스캔 — 문서 스캐너",
    short_name: "심플스캔",
    description:
      "카메라로 문서를 촬영하거나 이미지·PDF를 가져와 자동 보정 후 PDF로 저장하는 간편한 문서 스캐너.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f7f5",
    theme_color: "#4c8c6b",
    lang: "ko",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
