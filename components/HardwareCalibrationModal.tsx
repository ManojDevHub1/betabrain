"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useChatStore, VramTier, WebLlmModelSpec } from "@/store/chatStore";

interface HardwareCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmModel?: (modelId: string) => void;
}

const VRAM_TIERS: Array<{
  id: VramTier;
  label: string;
  sublabel: string;
  description: string;
  typicalHardware: string;
  recommendedTag: string;
}> = [
  {
    id: "4GB",
    label: "4 GB",
    sublabel: "Entry Tier",
    description: "Compact in-browser execution with zero frame drop.",
    typicalHardware: "GTX 1650 / Iris Xe / Mobile GPUs",
    recommendedTag: "Light Coder Core",
  },
  {
    id: "6GB",
    label: "6 GB",
    sublabel: "Standard Tier",
    description: "Multi-step logic models with fast cold-starts.",
    typicalHardware: "RTX 3050 / 4050 / RTX 2060",
    recommendedTag: "Logic & Web",
  },
  {
    id: "8GB",
    label: "8 GB",
    sublabel: "Balanced Sweetspot",
    description: "Optimal for full-stack code synthesis and UI generation.",
    typicalHardware: "RTX 3070 / 4060 / Apple M1/M2 16GB",
    recommendedTag: "Recommended Coder",
  },
  {
    id: "12GB",
    label: "12 GB",
    sublabel: "High Performance",
    description: "Extended context window with sustained token rate.",
    typicalHardware: "RTX 3080 / 4070 / RX 6700 XT",
    recommendedTag: "Heavy Coding + Reasoning",
  },
  {
    id: "16GB",
    label: "16 GB",
    sublabel: "Pro Workstation",
    description: "Dense foundation architectures and complex refactors.",
    typicalHardware: "RTX 4080 / Apple M2/M3 Pro 36GB",
    recommendedTag: "Heavyweight Core",
  },
  {
    id: "24GB+",
    label: "24GB+",
    sublabel: "Frontier Lab",
    description: "Massive frontier models with multi-shot capabilities.",
    typicalHardware: "RTX 3090 / 4090 / Apple M-Max & Ultra",
    recommendedTag: "Frontier Architect",
  },
];

export function HardwareCalibrationModal({
  isOpen,
  onClose,
  onConfirmModel,
}: HardwareCalibrationModalProps) {
  const selectedVram = useChatStore((s) => s.selectedVram);
  const setSelectedVram = useChatStore((s) => s.setSelectedVram);
  const availableModels = useChatStore((s) => s.availableModels);
  const activeModelId = useChatStore((s) => s.activeModelId);
  const setActiveModelId = useChatStore((s) => s.setActiveModelId);
  const setEngineStatus = useChatStore((s) => s.setEngineStatus);
  const setDownloadProgress = useChatStore((s) => s.setDownloadProgress);

  const [activeTier, setActiveTier] = useState<VramTier>(selectedVram || "8GB");
  const [pickedModelId, setPickedModelId] = useState<string>(activeModelId);
  const [detectionReport, setDetectionReport] = useState<{
    cpuCores: number;
    deviceMemoryGb: number;
    recommendedVram: VramTier;
    adapterName: string;
  } | null>(null);

  // Filter and prioritize models for active VRAM tier
  const filteredModels = availableModels.filter((m) =>
    m.recommendedVrams.includes(activeTier)
  );

  // If none match exactly, show adjacent models
  const displayModels =
    filteredModels.length > 0
      ? filteredModels
      : availableModels.filter(
          (m) =>
            m.vramBadge.includes(activeTier.replace("+", "")) ||
            (activeTier === "24GB+" && m.tier === 4)
        );

  // Auto-detect CPU & RAM hardware metrics with conservative VRAM fallback mapping
  const handleAutoDetect = () => {
    const cores = navigator.hardwareConcurrency || 8;
    interface ExtendedNavigator {
      deviceMemory?: number;
    }
    const rawMemGb = (navigator as ExtendedNavigator).deviceMemory;
    const memGb = rawMemGb !== undefined ? rawMemGb : 16;

    // Conservative VRAM Estimation Logic:
    // System RAM does NOT equal GPU VRAM.
    // - If deviceMemory <= 8: Set VRAM tier to 4 (4GB)
    // - If deviceMemory === 16: Set VRAM tier to 6 (6GB - very common for mid-range laptops like RTX 3050/4050)
    // - If deviceMemory >= 32: Set VRAM tier to 8 or 12
    let recommended: VramTier = "6GB";
    if (memGb <= 8) {
      recommended = "4GB";
    } else if (memGb <= 16) {
      recommended = "6GB";
    } else if (memGb >= 32) {
      recommended = cores >= 16 ? "12GB" : "8GB";
    } else {
      recommended = "6GB";
    }

    setDetectionReport({
      cpuCores: cores,
      deviceMemoryGb: memGb,
      recommendedVram: recommended,
      adapterName: "WebGPU Direct Hardware Acceleration",
    });

    setActiveTier(recommended);

    // Pick top coder model for that tier
    const topModel =
      availableModels.find(
        (m) => m.recommendedVrams.includes(recommended) && m.category === "coder"
      ) ||
      availableModels.find((m) => m.recommendedVrams.includes(recommended));

    if (topModel) {
      setPickedModelId(topModel.id);
    }
  };

  const handleApplyCalibration = () => {
    setSelectedVram(activeTier);

    if (pickedModelId !== activeModelId) {
      setActiveModelId(pickedModelId);
      setEngineStatus("downloading");
      const modelSpec = availableModels.find((m) => m.id === pickedModelId);
      setDownloadProgress(
        0.01,
        `Calibrated for ${activeTier} VRAM. Initializing ${modelSpec?.name || pickedModelId}...`
      );
      onConfirmModel?.(pickedModelId);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 select-none">
        {/* Subtle Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/30 backdrop-blur-xs"
        />

        {/* Modal Window: Pure Clinical White Lab */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#E4E4E7] p-6 sm:p-8 z-10 space-y-6 max-h-[90vh] overflow-y-auto"
          style={{
            boxShadow:
              "0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 10px 20px -5px rgba(0, 0, 0, 0.04)",
          }}
          data-lenis-prevent
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[#E4E4E7] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0055FF] animate-pulse" />
                <span className="font-mono text-[10px] tracking-widest uppercase text-[#71717A] font-semibold">
                  HARDWARE CALIBRATION // WEBGPU PROFILER
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#09090B]">
                Calibrate GPU & Neural Engines
              </h2>
              <p className="text-xs text-[#71717A] max-w-lg leading-relaxed">
                Browsers cannot read physical VRAM directly. Select your graphics memory tier to automatically filter and recommend the optimal in-browser coding model.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F5] transition-colors cursor-pointer"
              aria-label="Close Calibration"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Auto-Detect Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#F7F7F9] border border-[#E4E4E7]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white border border-[#E4E4E7] flex items-center justify-center text-[#0055FF]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-[#09090B]">Auto-Detect System Specs</div>
                <div className="text-[10px] font-mono text-[#71717A]">
                  Inspects client CPU threads and RAM capacity
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAutoDetect}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FAFAFB] border border-[#E4E4E7] text-xs font-medium text-[#09090B] lab-shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              Scan Hardware
            </button>
          </div>

          {/* Diagnostic Auto-Detect Readout */}
          {detectionReport && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-3.5 rounded-2xl bg-[#EEF4FF] border border-[#D6E4FF] font-mono text-[11px] text-[#0055FF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 shrink-0">
                <span className="w-2 h-2 rounded-full bg-[#0055FF] animate-pulse shrink-0" />
                <span>
                  Detected {detectionReport.cpuCores} Threads • ~{detectionReport.deviceMemoryGb}GB System RAM
                </span>
              </div>
              <span className="font-semibold text-left sm:text-right">
                Estimated {detectionReport.recommendedVram.replace("GB", " GB")} VRAM based on System specs. Please adjust if incorrect.
              </span>
            </motion.div>
          )}

          {/* VRAM Segmented Selection Grid */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#09090B] font-mono">
              Select GPU VRAM Tier
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {VRAM_TIERS.map((tier) => {
                const isSelected = activeTier === tier.id;
                const isEstimated = detectionReport?.recommendedVram === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => {
                      setActiveTier(tier.id);
                      const matching = availableModels.find(
                        (m) => m.recommendedVrams.includes(tier.id) && m.category === "coder"
                      );
                      if (matching) setPickedModelId(matching.id);
                    }}
                    className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer relative ${
                      isSelected
                        ? "bg-[#EEF4FF] border-[#0055FF] lab-shadow-sm text-[#0055FF]"
                        : "bg-white border-[#E4E4E7] hover:border-[#D4D4D8] hover:bg-[#FAFAFB] text-[#09090B]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-base font-bold tracking-tight">
                        {tier.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isEstimated && (
                          <span className="font-mono text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-[#0055FF] text-white uppercase tracking-wider">
                            Estimated
                          </span>
                        )}
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-[#0055FF]" />
                        )}
                      </div>
                    </div>
                    <div className="text-[11px] font-medium opacity-90 truncate">
                      {tier.sublabel}
                    </div>
                    <div className="font-mono text-[9px] text-[#71717A] mt-1.5 truncate">
                      {tier.typicalHardware}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Model Recommendations for Selected Tier */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#09090B] font-mono">
                Recommended Coding Models ({activeTier} VRAM)
              </label>
              <span className="text-[10px] font-mono text-[#0055FF]">
                {displayModels.length} models matched
              </span>
            </div>

            <div className="space-y-2">
              {displayModels.map((model) => {
                const isChosen = pickedModelId === model.id;
                return (
                  <div
                    key={model.id}
                    onClick={() => setPickedModelId(model.id)}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      isChosen
                        ? "bg-white border-[#0055FF] lab-shadow-md ring-1 ring-[#0055FF]"
                        : "bg-[#FAFAFB] border-[#E4E4E7] hover:bg-white hover:border-[#D4D4D8]"
                    }`}
                  >
                    <div className="space-y-1 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#09090B]">
                          {model.name}
                        </span>
                        {model.category === "coder" && (
                          <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-[#EEF4FF] text-[#0055FF] font-semibold border border-[#D6E4FF]">
                            CODER CORE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#71717A] leading-snug">
                        {model.description}
                      </p>
                      <div className="font-mono text-[10px] text-[#A1A1AA] flex items-center gap-2 pt-0.5">
                        <span>{model.parameters}</span>
                        <span>•</span>
                        <span>Download: ~{model.approxDownloadSize}</span>
                        <span>•</span>
                        <span>IndexedDB: {model.approxDownloadMB} MB</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <span className="font-mono text-[10px] font-medium px-2 py-0.5 rounded-full bg-white border border-[#E4E4E7] text-[#71717A]">
                        {model.vramBadge}
                      </span>
                      {isChosen && (
                        <span className="font-mono text-[9px] text-[#0055FF] font-bold uppercase">
                          Selected
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4E4E7]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E4E4E7] text-xs font-medium text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F5] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyCalibration}
              className="px-5 py-2.5 rounded-xl bg-[#0055FF] hover:bg-[#0047D6] text-white text-xs font-medium lab-shadow-glow transition-all active:scale-[0.98] cursor-pointer"
            >
              Apply Calibration ({activeTier})
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
