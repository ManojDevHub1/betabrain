"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useChatStore, WebLlmModelSpec } from "@/store/chatStore";

export function ModelSelector() {
  const activeModelId = useChatStore((s) => s.activeModelId);
  const setActiveModelId = useChatStore((s) => s.setActiveModelId);
  const setEngineStatus = useChatStore((s) => s.setEngineStatus);
  const setDownloadProgress = useChatStore((s) => s.setDownloadProgress);
  const availableModels = useChatStore((s) => s.availableModels);
  const engineStatus = useChatStore((s) => s.engineStatus);

  const [isOpen, setIsOpen] = useState(false);
  const [pendingModel, setPendingModel] = useState<WebLlmModelSpec | null>(null);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedModel =
    availableModels.find((m) => m.id === activeModelId) || availableModels[0];
  const displayModel = mounted ? selectedModel : availableModels[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Group models by their tiers
  const tier1Models = availableModels.filter((m) => m.tier === 1);
  const tier2Models = availableModels.filter((m) => m.tier === 2);
  const tier3Models = availableModels.filter((m) => m.tier === 3);
  const tier4Models = availableModels.filter((m) => m.tier === 4);

  const tiers = [
    {
      id: 1,
      title: "Tier 1: Fast & Light",
      subtitle: "For 4GB-6GB VRAM",
      models: tier1Models,
    },
    {
      id: 2,
      title: "Tier 2: Balanced",
      subtitle: "For 8GB-12GB VRAM",
      models: tier2Models,
    },
    {
      id: 3,
      title: "Tier 3: Heavy Duty",
      subtitle: "For 16GB VRAM & Mac Studios",
      models: tier3Models,
    },
    {
      id: 4,
      title: "Tier 4: Enterprise Frontier",
      subtitle: "For 24GB+ VRAM & Workstations",
      models: tier4Models,
    },
  ];

  const handleSelectModel = (model: WebLlmModelSpec) => {
    if (model.id === activeModelId) {
      setIsOpen(false);
      return;
    }
    // Open confirmation dialog before downloading
    setPendingModel(model);
    setIsOpen(false);
  };

  const handleConfirmSwitch = () => {
    if (!pendingModel) return;

    // 1. Update active model
    setActiveModelId(pendingModel.id);

    // 2. Transition engine to downloading so CrystallineFill triggers immediately
    setEngineStatus("downloading");
    setDownloadProgress(
      0.01,
      `Preparing WebGPU pipeline & downloading ${pendingModel.name} shards...`
    );

    // 3. Close confirmation dialog
    setPendingModel(null);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button: Clinical White Lab Style */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full bg-[#FFFFFF] hover:bg-[#F7F7F9] border border-[#E4E4E7] transition-all lab-shadow-sm text-xs text-[#09090B] font-medium cursor-pointer active:scale-[0.98]"
      >
        {/* Soft Blue Pulsing Status Indicator */}
        <span className="relative flex items-center justify-center w-2 h-2">
          {engineStatus === "ready" ? (
            <>
              <span className="absolute w-2.5 h-2.5 rounded-full bg-[#0055FF] animate-ping opacity-60" />
              <span className="w-2 h-2 rounded-full bg-[#0055FF]" />
            </>
          ) : engineStatus === "downloading" ? (
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-[#A1A1AA]" />
          )}
        </span>

        {/* Selected Model Name */}
        <span className="font-mono text-[11px] font-semibold text-[#09090B] tracking-tight" suppressHydrationWarning>
          {displayModel.name}
        </span>

        {/* Active Model VRAM Badge */}
        <span className="hidden sm:inline-block font-mono text-[9px] px-2 py-0.5 rounded-full bg-[#F4F4F5] border border-[#E4E4E7] text-[#71717A] font-medium" suppressHydrationWarning>
          {displayModel.vramBadge}
        </span>

        {/* Dynamic Rotating Chevron */}
        <svg
          className={`w-3.5 h-3.5 text-[#71717A] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Tiered Dropdown Menu: Pure White Lab Aesthetic */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            data-lenis-prevent
            className="absolute left-1/2 -translate-x-1/2 mt-2 w-80 sm:w-96 max-h-[82vh] overflow-y-auto bg-[#FFFFFF] rounded-2xl border border-[#E4E4E7] p-2.5 lab-shadow-lg z-50 shadow-xl"
            style={{
              boxShadow:
                "0 20px 40px -10px rgba(0, 0, 0, 0.08), 0 8px 16px -4px rgba(0, 0, 0, 0.04)",
            }}
          >
            {/* Dropdown Header */}
            <div className="px-3 py-2 border-b border-[#E4E4E7] flex items-center justify-between font-mono text-[10px] text-[#71717A]">
              <span className="font-semibold tracking-wider uppercase text-[#09090B]">
                TIERED NEURAL CORES
              </span>
              <span className="flex items-center gap-1 text-[#0055FF] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0055FF]" />
                WEBGPU LOCAL
              </span>
            </div>

            {/* Model Tiers List */}
            <div className="mt-2 space-y-3">
              {tiers.map((tier) => (
                <div key={tier.id} className="space-y-1">
                  {/* Tier Group Header */}
                  <div className="px-3 pt-1 pb-1 flex items-baseline justify-between">
                    <span className="font-mono text-[10px] font-bold text-[#09090B] uppercase tracking-wide">
                      {tier.title}
                    </span>
                    <span className="font-mono text-[9px] text-[#71717A]">
                      {tier.subtitle}
                    </span>
                  </div>

                  {/* Tier Models */}
                  <div className="space-y-1">
                    {tier.models.map((model) => {
                      const isSelected = model.id === activeModelId;
                      return (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => handleSelectModel(model)}
                          className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between border cursor-pointer ${
                            isSelected
                              ? "bg-[#EEF4FF] border-[#0055FF]/40 text-[#0055FF]"
                              : "bg-[#FFFFFF] border-transparent hover:bg-[#F7F7F9] hover:border-[#E4E4E7] text-[#09090B]"
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0 pr-2">
                            <div className="font-medium text-xs flex items-center gap-1.5 truncate">
                              {isSelected && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0055FF] shrink-0" />
                              )}
                              <span className="truncate">{model.name}</span>
                            </div>
                            <div className="font-mono text-[10px] text-[#71717A] flex items-center gap-1.5 truncate">
                              <span>{model.parameters}</span>
                              <span>•</span>
                              <span>~{model.approxDownloadSize}</span>
                              <span>•</span>
                              <span className="uppercase text-[9px]">
                                {model.quantization}
                              </span>
                            </div>
                          </div>

                          {/* Pill-shaped VRAM Requirement Badge */}
                          <div className="shrink-0 flex items-center gap-1.5">
                            <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-[#F4F4F5] border border-[#E4E4E7] text-[#71717A] font-medium tracking-tight">
                              {model.vramBadge}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Dropdown Footer */}
            <div className="mt-3 pt-2.5 px-3 border-t border-[#E4E4E7] flex items-center justify-between font-mono text-[9px] text-[#71717A]">
              <span>Browser IndexedDB Cache</span>
              <span className="text-[#059669] font-medium">100% Client-Side</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog: Clinical White Lab Style */}
      <AnimatePresence>
        {pendingModel && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Modal Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPendingModel(null)}
              className="fixed inset-0 bg-black/25 backdrop-blur-xs"
            />

            {/* Modal Content Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md bg-[#FFFFFF] rounded-2xl border border-[#E4E4E7] p-6 text-left z-10 space-y-5"
              style={{
                boxShadow:
                  "0 24px 48px -12px rgba(0, 0, 0, 0.12), 0 8px 16px -4px rgba(0, 0, 0, 0.04)",
              }}
            >
              {/* Header with Clinical Badge */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0055FF]" />
                    <span className="font-mono text-[10px] tracking-wider uppercase text-[#71717A]">
                      NEURAL CORE INGESTION
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold tracking-tight text-[#09090B]">
                    Confirm Model Download
                  </h3>
                </div>

                <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-[#EEF4FF] border border-[#0055FF]/20 text-[#0055FF] font-semibold">
                  {pendingModel.vramBadge}
                </span>
              </div>

              {/* Explicit Confirmation Text Prompt */}
              <div className="p-3.5 rounded-xl bg-[#F7F7F9] border border-[#E4E4E7] space-y-2">
                <p className="text-xs sm:text-sm text-[#09090B] font-medium leading-relaxed">
                  This will download{" "}
                  <span className="text-[#0055FF] font-semibold font-mono">
                    {pendingModel.approxDownloadSize}
                  </span>{" "}
                  of neural weights to your local IndexedDB. Proceed?
                </p>
                <p className="font-mono text-[10px] text-[#71717A] leading-normal">
                  Downloaded shards are permanently cached in your browser. Subsequent launches require zero network bandwidth and run completely offline.
                </p>
              </div>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-2 gap-2 text-left font-mono text-[10px]">
                <div className="p-2.5 bg-[#FFFFFF] rounded-xl border border-[#E4E4E7]">
                  <div className="text-[#71717A] uppercase text-[9px]">TARGET ARCHITECTURE</div>
                  <div className="text-[#09090B] font-semibold truncate mt-0.5">
                    {pendingModel.name}
                  </div>
                </div>
                <div className="p-2.5 bg-[#FFFFFF] rounded-xl border border-[#E4E4E7]">
                  <div className="text-[#71717A] uppercase text-[9px]">TIER CLASSIFICATION</div>
                  <div className="text-[#0055FF] font-semibold truncate mt-0.5">
                    {pendingModel.tierTitle}
                  </div>
                </div>
                <div className="p-2.5 bg-[#FFFFFF] rounded-xl border border-[#E4E4E7]">
                  <div className="text-[#71717A] uppercase text-[9px]">HARDWARE ADVISORY</div>
                  <div className="text-[#09090B] font-semibold mt-0.5">
                    {pendingModel.tierSubtitle}
                  </div>
                </div>
                <div className="p-2.5 bg-[#FFFFFF] rounded-xl border border-[#E4E4E7]">
                  <div className="text-[#71717A] uppercase text-[9px]">QUANTIZATION</div>
                  <div className="text-[#09090B] font-semibold mt-0.5">
                    {pendingModel.quantization.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setPendingModel(null)}
                  className="px-4 py-2 rounded-xl border border-[#E4E4E7] hover:bg-[#F4F4F5] text-xs font-medium text-[#71717A] hover:text-[#09090B] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSwitch}
                  className="px-4 py-2 rounded-xl bg-[#0055FF] hover:bg-[#0047D6] text-white text-xs font-medium lab-shadow-glow transition-all active:scale-[0.98] cursor-pointer"
                >
                  Download & Initialize ({pendingModel.approxDownloadSize})
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
