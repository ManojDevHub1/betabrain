"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";

interface WebGpuFallbackProps {
  isOpen: boolean;
  onBypass: () => void;
}

export function WebGpuFallback({ isOpen, onBypass }: WebGpuFallbackProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/25 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          className="relative z-10 w-full max-w-md bg-white rounded-3xl border border-[#E4E4E7] p-6 sm:p-8 lab-shadow-lg text-center space-y-5"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#EEF4FF] border border-[#D6E4FF] flex items-center justify-center mx-auto text-[#0055FF]">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold tracking-tight text-[#09090B]">
              Hardware Incompatible: Desktop WebGPU Required
            </h3>
            <p className="text-xs text-[#71717A] leading-relaxed">
              In-browser neural weight caching requires a desktop browser with WebGPU enabled (Chrome, Edge, or Brave). Mobile GPUs cannot allocate model buffers directly.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={onBypass}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0055FF] hover:bg-[#0047D6] text-white text-xs font-medium tracking-tight transition-all lab-shadow-glow cursor-pointer"
            >
              Continue in Clean Room Sandbox
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
