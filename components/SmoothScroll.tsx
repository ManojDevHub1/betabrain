"use client";

import React, { useEffect, useRef } from "react";
import { ReactLenis, type LenisRef } from "lenis/react";
import { frame, cancelFrame } from "motion/react";
import "lenis/dist/lenis.css";

interface SmoothScrollProps {
  children: React.ReactNode;
}

export function SmoothScroll({ children }: SmoothScrollProps) {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    function update(data: { timestamp: number; delta: number }) {
      lenisRef.current?.lenis?.raf(data.timestamp);
    }

    frame.update(update, true);

    return () => {
      cancelFrame(update);
    };
  }, []);

  return (
    <ReactLenis root options={{ autoRaf: false, duration: 1.1, smoothWheel: true }} ref={lenisRef}>
      {children}
    </ReactLenis>
  );
}
