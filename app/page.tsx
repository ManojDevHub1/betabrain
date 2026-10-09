"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Preloader } from "@/components/Preloader";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ChatCanvas } from "@/components/ChatCanvas";
import { PromptBar } from "@/components/PromptBar";
import { CrystallineFill } from "@/components/CrystallineFill";
import { WebGpuFallback } from "@/components/WebGpuFallback";
import { useChatStore } from "@/store/chatStore";
import { detectWebGpu, streamWebLlmChat, getEngineInstance } from "@/lib/webllm";
import type { MLCEngine } from "@mlc-ai/web-llm";

import { motion, AnimatePresence } from "motion/react";
import { ArtifactSandbox } from "@/components/ArtifactSandbox";

export default function Home() {
  const [showPreloader, setShowPreloader] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showIncompatibleModal, setShowIncompatibleModal] = useState(false);
  const [mobileTab, setMobileTab] = useState<"chat" | "sandbox">("chat");

  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const activeModelId = useChatStore((s) => s.activeModelId);
  const engineStatus = useChatStore((s) => s.engineStatus);
  const isGenerating = useChatStore((s) => s.isGenerating);
  const systemPrompt = useChatStore((s) => s.systemPrompt);
  const sessions = useChatStore((s) => s.sessions);
  const addMessage = useChatStore((s) => s.addMessage);
  const appendStreamingChunk = useChatStore((s) => s.appendStreamingChunk);
  const finalizeStreaming = useChatStore((s) => s.finalizeStreaming);
  const setIsGenerating = useChatStore((s) => s.setIsGenerating);
  const setLiveTokRate = useChatStore((s) => s.setLiveTokRate);
  const setLastLatency = useChatStore((s) => s.setLastLatency);
  const isSandboxOpen = useChatStore((s) => s.isSandboxOpen);
  const setIsSandboxOpen = useChatStore((s) => s.setIsSandboxOpen);
  const activeArtifact = useChatStore((s) => s.activeArtifact);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const abortControllerRef = useRef<AbortController | null>(null);
  const engineRef = useRef<MLCEngine | null>(null);

  // Automatically switch mobile tab to sandbox when an artifact is detected
  useEffect(() => {
    if (activeArtifact && isSandboxOpen) {
      setMobileTab("sandbox");
    }
  }, [activeArtifact?.id, isSandboxOpen]);

  // Hardware check on initial mount
  useEffect(() => {
    const checkGpu = async () => {
      const gpu = await detectWebGpu();
      if (!gpu.supported || gpu.isMobile) {
        setShowIncompatibleModal(true);
      }
    };
    checkGpu();
  }, []);

  // Transmit prompt to in-browser WebLLM / WebGPU stream
  const handleSendPrompt = useCallback(
    async (promptText: string) => {
      if (!promptText.trim() || isGenerating) return;

      // 1. Add user message
      addMessage(activeSessionId, {
        role: "user",
        content: promptText,
      });

      // 2. Add placeholder assistant message
      addMessage(activeSessionId, {
        role: "assistant",
        content: "",
        isStreaming: true,
      });

      setIsGenerating(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const conversationHistory = (activeSession?.messages || []).map((m) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content : String(m.content || ""),
      }));
      conversationHistory.push({ role: "user", content: promptText });

      try {
        await streamWebLlmChat(
          engineRef.current || getEngineInstance(),
          activeModelId,
          systemPrompt,
          conversationHistory,
          {
            onToken: (chunk, _count, rate) => {
              const textChunk = typeof chunk === "string" ? chunk : String(chunk ?? "");
              if (textChunk) {
                appendStreamingChunk(activeSessionId, textChunk, 1);
                setLiveTokRate(rate);
              }
            },
            onFirstToken: (latencyMs) => {
              setLastLatency(latencyMs);
            },
            onDone: (telemetry) => {
              finalizeStreaming(activeSessionId, telemetry);
              abortControllerRef.current = null;
            },
            onError: (err) => {
              console.error("Inference stream error:", err);
              finalizeStreaming(activeSessionId);
              abortControllerRef.current = null;
            },
          },
          controller.signal
        );
      } catch (err) {
        console.error("Unhandled error:", err);
        finalizeStreaming(activeSessionId);
        abortControllerRef.current = null;
      }
    },
    [
      activeModelId,
      activeSession?.messages,
      activeSessionId,
      addMessage,
      appendStreamingChunk,
      finalizeStreaming,
      isGenerating,
      setIsGenerating,
      setLastLatency,
      setLiveTokRate,
      systemPrompt,
    ]
  );

  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      finalizeStreaming(activeSessionId);
    }
  }, [activeSessionId, finalizeStreaming]);

  const showSplitScreen = Boolean(isSandboxOpen && activeArtifact);

  return (
    <div className="relative min-h-svh w-full bg-[#F7F7F9] text-[#09090B] flex overflow-hidden">
      {/* Scene 1: Intro & Hardware Scan Preloader */}
      {showPreloader && (
        <Preloader onComplete={() => setShowPreloader(false)} />
      )}

      {/* WebGPU Fallback Modal for Incompatible Hardware/Mobile */}
      <WebGpuFallback
        isOpen={showIncompatibleModal}
        onBypass={() => setShowIncompatibleModal(false)}
      />

      {/* Scene 2: Left Sidebar (Workspace Archives) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Scene 3: Main Stage (The Clean Canvas & Artifact Sandbox) */}
      <main
        id="clean-canvas"
        className="flex-1 flex flex-col min-w-0 h-svh overflow-hidden relative bg-[#F7F7F9]"
      >
        {/* Sleek White Sticky Header */}
        <Header
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />

        {/* View Routing: If Model is Downloading or Uninitialized, show The Crystalline Fill */}
        {engineStatus !== "ready" ? (
          <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
            <CrystallineFill />
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            {/* Mobile Tab Switcher when Artifact Sandbox is Active */}
            {showSplitScreen && (
              <div className="lg:hidden flex items-center justify-center p-2 bg-white border-b border-[#E4E4E7] shrink-0">
                <div className="flex items-center p-1 rounded-xl bg-[#F4F4F5] border border-[#E4E4E7] text-xs">
                  <button
                    type="button"
                    onClick={() => setMobileTab("chat")}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      mobileTab === "chat"
                        ? "bg-white text-[#09090B] lab-shadow-sm font-semibold"
                        : "text-[#71717A]"
                    }`}
                  >
                    Chat Canvas
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileTab("sandbox")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                      mobileTab === "sandbox"
                        ? "bg-white text-[#0055FF] lab-shadow-sm font-semibold"
                        : "text-[#71717A]"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0055FF] animate-pulse" />
                    Live Sandbox
                  </button>
                </div>
              </div>
            )}

            {/* Split Screen Stage (Fluid Transition) */}
            <div className="flex-1 flex min-h-0 overflow-hidden relative">
              {/* Left: Chat Canvas (40% on Desktop when Sandbox is Open, 100% when Closed) */}
              <motion.div
                layout
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className={`flex flex-col h-full overflow-hidden bg-[#F7F7F9] transition-all relative ${
                  showSplitScreen
                    ? `w-full lg:w-[42%] xl:w-[40%] border-r border-[#E4E4E7] shrink-0 ${
                        mobileTab === "sandbox" ? "hidden lg:flex" : "flex"
                      }`
                    : "w-full flex-1"
                }`}
              >
                <ChatCanvas onQuickPrompt={handleSendPrompt} />
                <PromptBar
                  onSubmitPrompt={handleSendPrompt}
                  onStopGeneration={handleStopGeneration}
                />
              </motion.div>

              {/* Right: The Artifact Sandbox (60% on Desktop, 100% on Mobile when selected) */}
              <AnimatePresence>
                {showSplitScreen && activeArtifact && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                    className={`flex-1 h-full bg-white z-10 ${
                      mobileTab === "chat" ? "hidden lg:flex" : "flex"
                    }`}
                  >
                    <ArtifactSandbox
                      artifact={activeArtifact}
                      onClose={() => setIsSandboxOpen(false)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
