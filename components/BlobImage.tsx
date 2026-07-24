"use client";

import { useEffect, useMemo } from "react";

interface BlobImageProps {
  blob: Blob | undefined;
  alt: string;
  className?: string;
}

/** Blob을 objectURL로 렌더링하고 blob 변경/언마운트 시 URL을 정리하는 이미지. */
export function BlobImage({ blob, alt, className }: BlobImageProps) {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);

  useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);

  if (!url) {
    return <div className={className} aria-label={alt} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={className} />;
}
