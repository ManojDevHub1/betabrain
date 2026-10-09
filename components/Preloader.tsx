"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useChatStore } from "@/store/chatStore";
import { detectWebGpu } from "@/lib/webllm";
import { EASE } from "@/lib/motion";

export function Preloader({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"scanning" | "detected" | "ready">("scanning");
  const [deviceLabel, setDeviceLabel] = useState<string>("Scanning WebGPU Adapter...");
  const setWebGpuSupported = useChatStore((s) => s.setWebGpuSupported);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      onComplete();
      return;
    }

    let isMounted = true;

    const probe = async () => {
      const gpuResult = await detectWebGpu();
      if (!isMounted) return;

      setWebGpuSupported(gpuResult.supported, gpuResult.adapterInfo);
      if (gpuResult.supported) {
        setDeviceLabel(gpuResult.adapterInfo || "Unified WebGPU Silicon");
      } else {
        setDeviceLabel("WebGPU Adapter Unreachable");
      }

      setTimeout(() => {
        if (!isMounted) return;
        setPhase("detected");
        setTimeout(() => {
          if (!isMounted) return;
          setPhase("ready");
          setTimeout(onComplete, 400);
        }, 700);
      }, 500);
    };

    probe();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onComplete();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      isMounted = false;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onComplete, setWebGpuSupported, shouldReduceMotion]);

  return (
    <AnimatePresence>
      <motion.div
        exit={{ opacity: 0, scale: 0.99 }}
        transition={{ duration: 0.4, ease: EASE.softOut }}
        className="fixed inset-0 z-[99990] flex items-center justify-center bg-[#F7F7F9]"
      >
        <div className="flex flex-col items-center max-w-sm text-center px-6 space-y-6">
          {/* Minimalist Surgical Spinner */}
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-12 h-12 animate-spin text-[#E4E4E7]" viewBox="0 0 48 48" fill="none">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M44 24C44 12.9543 35.0457 4 24 4"
                stroke="#0055FF"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute w-2 h-2 rounded-full bg-[#0055FF]" />
          </div>

          {/* Crisp Clinical Status Text */}
          <div className="space-y-1.5">
            <div className="font-mono text-xs font-semibold tracking-wider uppercase text-[#09090B]">
              {phase === "scanning" && "AUTHENTICATING WEBGPU ACCESS..."}
              {phase === "detected" && "SILICON DETECTED."}
              {phase === "ready" && "CLEAN ROOM ONLINE."}
            </div>
            <p className="font-mono text-[11px] text-[#71717A] truncate max-w-xs">
              {deviceLabel}
            </p>
          </div>

          <div className="pt-2 font-mono text-[10px] text-[#A1A1AA]">
            MANOJ IN BETA // IN-BROWSER NEURAL CLIENT
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
