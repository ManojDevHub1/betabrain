"use client";

import React, { useState, useEffect } from "react";
import { useChatStore } from "@/store/chatStore";
import { ModelSelector } from "@/components/ModelSelector";
import { HardwareCalibrationModal } from "@/components/HardwareCalibrationModal";

interface HeaderProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function Header({ isSidebarOpen = true, onToggleSidebar }: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  const engineStatus = useChatStore((s) => s.engineStatus);
  const clearWorkspace = useChatStore((s) => s.clearWorkspace);
  const liveTokRate = useChatStore((s) => s.liveTokRate);
  const selectedVram = useChatStore((s) => s.selectedVram);
  const isCalibrationOpen = useChatStore((s) => s.isCalibrationOpen);
  const setIsCalibrationOpen = useChatStore((s) => s.setIsCalibrationOpen);
  const activeArtifact = useChatStore((s) => s.activeArtifact);
  const isSandboxOpen = useChatStore((s) => s.isSandboxOpen);
  const setIsSandboxOpen = useChatStore((s) => s.setIsSandboxOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 w-full h-16 bg-white/95 backdrop-blur-md border-b border-[#E4E4E7] px-4 sm:px-8 flex items-center justify-between select-none lab-shadow-sm">
        {/* Left: Brand & Sidebar Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            title={isSidebarOpen ? "Collapse Sidebar (Full-Screen Chat)" : "Expand Sidebar"}
            className="p-2 rounded-xl text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F5] border border-[#E4E4E7] bg-white transition-all lab-shadow-sm cursor-pointer active:scale-[0.95] flex items-center justify-center shrink-0"
          >
            <svg
              className="w-4 h-4 transition-transform duration-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <rect x="3" y="4" width="18" height="16" rx="3" strokeWidth="1.8" />
              <path d="M9 4v16" strokeWidth="1.8" strokeLinecap="round" />
              <path
                d={isSidebarOpen ? "M15 10l-2 2 2 2" : "M13 10l2 2-2 2"}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#0055FF] flex items-center justify-center text-white font-mono text-xs font-bold shadow-xs">
              β
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-[#09090B]">
                BetaBrain
              </span>
              <span className="font-mono text-[9px] tracking-wider uppercase text-[#71717A] -mt-0.5">
                AI SOFTWARE BUILDER
              </span>
            </div>
          </div>
        </div>

        {/* Center: Tiered Interactive Model Selector Dropdown */}
        <ModelSelector />

        {/* Right: Actions, Hardware Profiler & Sandbox Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hardware Calibration Button */}
          <button
            type="button"
            onClick={() => setIsCalibrationOpen(true)}
            title="Calibrate GPU VRAM Tier"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E4E4E7] hover:border-[#0055FF] bg-white hover:bg-[#FAFAFB] text-[#09090B] text-xs font-medium transition-all lab-shadow-sm cursor-pointer active:scale-[0.98]"
          >
            <svg className="w-3.5 h-3.5 text-[#0055FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <span className="font-mono text-[11px] text-[#09090B]">
              VRAM:{" "}
              <strong className="text-[#0055FF] font-semibold" suppressHydrationWarning>
                {mounted ? (selectedVram || "8GB") : "8GB"}
              </strong>
            </span>
          </button>

          {/* Sandbox Toggle Button (Active when an artifact is detected) */}
          {activeArtifact && (
            <button
              type="button"
              onClick={() => setIsSandboxOpen(!isSandboxOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-medium cursor-pointer ${
                isSandboxOpen
                  ? "bg-[#EEF4FF] border-[#0055FF]/40 text-[#0055FF]"
                  : "bg-white border-[#E4E4E7] text-[#09090B] hover:border-[#09090B] hover:bg-[#FAFAFB]"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#0055FF] animate-pulse" />
              <span className="hidden sm:inline font-mono text-[11px]">
                {isSandboxOpen ? "Hide Sandbox" : "View Sandbox"}
              </span>
              <span className="sm:hidden font-mono text-[11px]">Sandbox</span>
            </button>
          )}

          {/* Status Badge */}
          <div className="hidden xl:flex items-center gap-2 font-mono text-[11px] text-[#71717A] bg-[#F4F4F5] px-3 py-1 rounded-full border border-[#E4E4E7]">
            <span className="text-[#0055FF] font-semibold">
              {engineStatus === "ready" ? "WebGPU Active" : engineStatus === "downloading" ? "Caching Weights" : "Standby"}
            </span>
            {liveTokRate > 0 && (
              <>
                <span className="text-[#D4D4D8]">|</span>
                <span className="text-[#09090B] font-medium">{liveTokRate} tok/s</span>
              </>
            )}
          </div>

          {/* Clear Workspace Button */}
          <button
            type="button"
            onClick={clearWorkspace}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E4E4E7] hover:border-[#09090B] text-[#09090B] text-xs font-medium bg-white hover:bg-[#FAFAFB] transition-all lab-shadow-sm cursor-pointer active:scale-[0.98]"
          >
            <svg className="w-3.5 h-3.5 text-[#71717A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden md:inline">Clear</span>
          </button>
        </div>
      </header>

      {/* Hardware Calibration Modal */}
      <HardwareCalibrationModal
        isOpen={isCalibrationOpen}
        onClose={() => setIsCalibrationOpen(false)}
      />
    </>
  );
}
