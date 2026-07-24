"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CameraState = "idle" | "starting" | "ready" | "denied" | "unsupported";

/**
 * 후면 카메라 우선으로 getUserMedia 스트림을 관리.
 * 권한 거부·미지원 상황을 상태로 노출해 가져오기 대체 UI를 띄울 수 있게 한다.
 */
export function useCamera(active: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>("idle");

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    // 이 상태 전이들은 카메라 하드웨어(getUserMedia) 수명주기를 React 상태로
    // 반영하는 외부 시스템 동기화라 effect 내부 setState가 의도된 사용이다.
    if (!active) {
      stop();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState("idle");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      return;
    }

    let cancelled = false;
    setState("starting");
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("denied");
      });

    return () => {
      cancelled = true;
      stop();
    };
  }, [active, stop]);

  /** 현재 프레임을 캔버스로 캡처. */
  const capture = useCallback((): HTMLCanvasElement | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    ctx.drawImage(video, 0, 0);
    return canvas;
  }, []);

  return { videoRef, state, capture };
}
