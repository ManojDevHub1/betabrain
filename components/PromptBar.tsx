"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useChatStore } from "@/store/chatStore";
import { SPRING } from "@/lib/motion";

interface PromptBarProps {
  onSubmitPrompt: (text: string) => void;
  onStopGeneration?: () => void;
}

export function PromptBar({ onSubmitPrompt, onStopGeneration }: PromptBarProps) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isGenerating = useChatStore((s) => s.isGenerating);
  const activeModelId = useChatStore((s) => s.activeModelId);
  const engineStatus = useChatStore((s) => s.engineStatus);
  const shouldReduceMotion = useReducedMotion();

  // Dynamic expansion
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isGenerating) return;

    // Scale to 0.98 and snap back
    setIsSending(true);
    setTimeout(() => setIsSending(false), 200);

    onSubmitPrompt(trimmed);
    setInput("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full px-4 sm:px-8 pb-6 pt-2 select-none relative z-20">
      <div className="max-w-4xl mx-auto">
        {/* Floating, pill-shaped white bar with 1px silver border */}
        <motion.div
          animate={{
            scale: isSending && !shouldReduceMotion ? 0.98 : 1,
          }}
          transition={{ type: "spring", ...SPRING.snappy }}
          className="bg-white rounded-3xl border border-[#E4E4E7] lab-shadow-md hover:lab-shadow-lg transition-shadow duration-300 p-2 sm:p-3"
        >
          {/* Top Info Pill */}
          <div className="flex items-center justify-between px-3 pb-1.5 text-[11px] font-mono text-[#71717A] border-b border-[#ECECEF] mb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0055FF]" />
              <span className="text-[#0055FF] font-medium">
                {isGenerating
                  ? "WebGPU Stream Active"
                  : engineStatus === "ready"
                  ? "WebGPU Ready"
                  : "Engine Standby"}
              </span>
              <span className="hidden sm:inline text-[#D4D4D8]">|</span>
              <span className="hidden sm:inline text-[#71717A]">{activeModelId.split("-q4")[0]}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[10px]">
              <span>Return to Send</span>
              <span>•</span>
              <span>Shift+Enter Newline</span>
            </div>
          </div>

          {/* Input & Action */}
          <div className="flex items-end gap-3 px-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask BetaBrain (e.g., Draft in-browser WGSL compute shader or molecular dynamics pipeline)..."
              rows={1}
              className="w-full bg-transparent text-sm text-[#09090B] placeholder-[#A1A1AA] focus:outline-none resize-none leading-relaxed min-h-[36px] max-h-[180px] py-1"
            />

            {isGenerating ? (
              <button
                onClick={onStopGeneration}
                className="px-3.5 py-2 rounded-xl bg-[#DC2626] text-white text-xs font-medium hover:bg-[#B91C1C] transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>Halt</span>
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                aria-label="Transmit Prompt"
                className={`px-4 py-2 rounded-xl text-xs font-medium tracking-tight shrink-0 transition-all duration-200 flex items-center gap-1.5 ${
                  input.trim()
                    ? "bg-[#0055FF] hover:bg-[#0047D6] text-white lab-shadow-glow cursor-pointer active:scale-95"
                    : "bg-[#F4F4F5] text-[#A1A1AA] border border-[#E4E4E7] cursor-not-allowed"
                }`}
              >
                <span>Send</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </motion.div>

        {/* Clinical Privacy Footnote */}
        <div className="flex items-center justify-between px-3 pt-2 text-[10px] font-mono text-[#A1A1AA]">
          <span className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-[#059669]" />
            100% PRIVATE • ZERO CLOUD LOGS
          </span>
          <span>MANOJ IN BETA // THE CLEAN ROOM</span>
        </div>
      </div>
    </div>
  );
}
