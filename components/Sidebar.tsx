"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useChatStore, ChatSession } from "@/store/chatStore";

function FormattedDate({ timestamp }: { timestamp: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <span suppressHydrationWarning>
      {mounted
        ? new Date(timestamp).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "--"}
    </span>
  );
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const sessions = useChatStore((s) => s.sessions);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const selectSession = useChatStore((s) => s.selectSession);
  const createSession = useChatStore((s) => s.createSession);
  const deleteSession = useChatStore((s) => s.deleteSession);
  const clearWorkspace = useChatStore((s) => s.clearWorkspace);
  const activeModelId = useChatStore((s) => s.activeModelId);
  const selectedVram = useChatStore((s) => s.selectedVram);
  const setIsCalibrationOpen = useChatStore((s) => s.setIsCalibrationOpen);

  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const filtered = sessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const totalTokens = sessions.reduce(
    (acc, s) => acc + (s.totalTokensGenerated || 0),
    0
  );

  const renderContent = () => (
    <div className="w-[320px] h-full flex flex-col justify-between shrink-0 select-none">
      {/* Header Section */}
      <div className="p-4 border-b border-[#E4E4E7] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-3 rounded-full bg-[#0055FF]" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#09090B]">
              Workspace Archives
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Sidebar"
            className="p-1.5 rounded-lg text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F5] transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* New Canvas Action */}
        <button
          onClick={() => {
            createSession();
            if (typeof window !== "undefined" && window.innerWidth < 1024) onClose();
          }}
          className="w-full py-2.5 px-3 rounded-xl bg-[#0055FF] hover:bg-[#0047D6] text-white text-xs font-medium tracking-tight flex items-center justify-center gap-2 transition-all lab-shadow-glow active:scale-[0.98] cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>New Neural Canvas</span>
        </button>

        {/* Search Box */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter archives..."
            className="w-full bg-[#F4F4F5] border border-[#E4E4E7] rounded-xl px-3 py-1.5 pl-8 text-xs text-[#09090B] placeholder-[#A1A1AA] focus:outline-none focus:border-[#0055FF]"
          />
          <svg
            className="w-3.5 h-3.5 text-[#A1A1AA] absolute left-2.5 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1" data-lenis-prevent>
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-[#A1A1AA] text-xs font-mono">
            No Archives Found
          </div>
        ) : (
          filtered.map((s: ChatSession) => {
            const isActive = s.id === activeSessionId;

            return (
              <div
                key={s.id}
                onClick={() => {
                  selectSession(s.id);
                  if (typeof window !== "undefined" && window.innerWidth < 1024) onClose();
                }}
                className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                  isActive
                    ? "bg-[#EEF4FF] text-[#0055FF]"
                    : "text-[#09090B] hover:bg-[#F4F4F5]"
                }`}
              >
                {/* Micro-interaction: blue highlight line on the left */}
                <span
                  className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-[#0055FF] transition-opacity duration-200 ${
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                />

                {/* Micro-interaction: indents text x: 4 on hover */}
                <div className="flex-1 min-w-0 pl-2 transition-transform duration-200 group-hover:translate-x-1">
                  <p
                    className={`text-xs font-medium truncate ${
                      isActive ? "text-[#0055FF] font-semibold" : "text-[#09090B]"
                    }`}
                  >
                    {s.title || "Neural Canvas"}
                  </p>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-[#71717A] mt-0.5">
                    <FormattedDate timestamp={s.updatedAt} />
                    <span>•</span>
                    <span>{s.messages.length} notes</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(s.id);
                  }}
                  aria-label={`Delete ${s.title}`}
                  className="opacity-0 group-hover:opacity-100 p-1 text-[#A1A1AA] hover:text-[#DC2626] transition-opacity cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer & Telemetry */}
      <div className="p-4 border-t border-[#E4E4E7] bg-[#FAFAFC] space-y-3 shrink-0">
        <div className="p-3 bg-white rounded-xl border border-[#E4E4E7] lab-shadow-sm font-mono text-[10px] space-y-1">
          <div className="flex justify-between text-[#71717A]">
            <span>GPU TOKENS:</span>
            <span className="text-[#09090B] font-semibold" suppressHydrationWarning>
              {mounted ? totalTokens.toLocaleString() : "0"}
            </span>
          </div>
          <div className="flex justify-between text-[#71717A]">
            <span>ACTIVE MODEL:</span>
            <span className="text-[#0055FF] font-medium truncate max-w-[140px]" suppressHydrationWarning>
              {mounted ? activeModelId.split("-q4")[0] : "Qwen2.5-Coder-1.5B-Instruct"}
            </span>
          </div>
          <div className="flex justify-between text-[#71717A]">
            <span>EGRESS STATUS:</span>
            <span className="text-[#059669] font-medium">100% AIR-GAPPED</span>
          </div>
        </div>

        {/* Hardware Calibration Quick Access */}
        <button
          type="button"
          onClick={() => {
            setIsCalibrationOpen(true);
            if (typeof window !== "undefined" && window.innerWidth < 1024) onClose();
          }}
          className="w-full py-2 px-3 rounded-xl bg-white border border-[#E4E4E7] hover:border-[#0055FF] text-[11px] font-medium text-[#09090B] flex items-center justify-between transition-all lab-shadow-sm cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-[#0055FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <span>Calibrate VRAM Tier</span>
          </span>
          <span
            className="font-mono text-[9px] text-[#0055FF] font-semibold bg-[#EEF4FF] px-1.5 py-0.5 rounded border border-[#0055FF]/20"
            suppressHydrationWarning
          >
            {mounted ? (selectedVram || "8GB") : "8GB"}
          </span>
        </button>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0055FF]" />
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-[#09090B]">
                Manoj in Beta
              </span>
              <span className="font-mono text-[8px] text-[#71717A] tracking-wider uppercase">
                THE CLEAN ROOM
              </span>
            </div>
          </div>
          <button
            onClick={clearWorkspace}
            className="text-[10px] font-mono text-[#71717A] hover:text-[#DC2626] transition-colors cursor-pointer"
          >
            Clear Workspace
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Mobile Drawer (Overlay Mode) */}
      <AnimatePresence>
        {isOpen && (
          <div className="lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/25 backdrop-blur-xs z-40"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 left-0 bottom-0 w-[320px] max-w-[85vw] bg-white border-r border-[#E4E4E7] z-50 flex flex-col justify-between overflow-hidden shadow-2xl"
              data-lenis-prevent
            >
              {renderContent()}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Desktop Collapsible Sidebar (Fluid Layout Mode) */}
      <motion.aside
        data-lenis-prevent
        initial={false}
        animate={{
          width: isOpen ? 320 : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{
          duration: 0.3,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="hidden lg:flex flex-col h-svh shrink-0 overflow-hidden bg-white border-r border-[#E4E4E7] relative z-20"
      >
        {renderContent()}
      </motion.aside>
    </>
  );
}
