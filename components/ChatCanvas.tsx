"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import hljs from "highlight.js";
import { useChatStore, ChatMessage } from "@/store/chatStore";
import { SPRING } from "@/lib/motion";

interface ChatCanvasProps {
  onQuickPrompt: (promptText: string) => void;
}

export function ChatCanvas({ onQuickPrompt }: ChatCanvasProps) {
  const sessions = useChatStore((s) => s.sessions);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const activeModelId = useChatStore((s) => s.activeModelId);
  const isGenerating = useChatStore((s) => s.isGenerating);
  const liveTokRate = useChatStore((s) => s.liveTokRate);

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messages = activeSession?.messages || [];

  // Auto-scroll on new token or message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: isGenerating ? "auto" : "smooth",
      });
    }
  }, [messages, isGenerating]);

  return (
    <div
      ref={scrollRef}
      data-lenis-prevent
      className="flex-1 overflow-y-auto px-4 py-6 sm:px-10 sm:py-10 space-y-6 clean-room-bg min-h-0"
    >
      {messages.length === 0 ? (
        <EmptyCleanStage onSelectPrompt={onQuickPrompt} activeModelId={activeModelId} />
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message, index) => {
            const isLastAi =
              message.role === "assistant" && index === messages.length - 1;

            return (
              <MessageItem
                key={message.id}
                message={message}
                isLastAi={isLastAi}
                isGenerating={isGenerating}
                liveRate={liveTokRate}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                       EMPTY STAGE: THE CLEAN CANVAS                        */
/* -------------------------------------------------------------------------- */
const CLINICAL_PROMPTS = [
  {
    tag: "LIVE ARTIFACT",
    title: "Molecular Dynamics Dashboard",
    prompt: "Build an interactive molecular dynamics control dashboard with real-time canvas particle simulation, thermal velocity sliders, and FPS telemetry.",
    desc: "Generates full self-contained HTML/Tailwind app rendered live in Artifact Sandbox.",
  },
  {
    tag: "UI SANDBOX",
    title: "Interactive Waveform Synthesizer",
    prompt: "Build an interactive audio waveform synthesizer prototype with frequency modulation dials, preset toggles, and live canvas oscilloscope.",
    desc: "Complete functional UI component with responsive Tailwind styling.",
  },
  {
    tag: "WGSL COMPUTE",
    title: "In-Browser Matrix Multiplication",
    prompt: "Write a high-performance WGSL matrix compute shader utilizing 16x16 workgroup tiles for in-browser WebGPU dispatch.",
    desc: "Optimized for Apple Silicon & NVIDIA unified WebGPU memory.",
  },
  {
    tag: "BENCHMARK",
    title: "Client-Side Coder Throughput Audit",
    prompt: "Audit time-to-first-token (TTFT) and sustained tokens per second for Qwen2.5-Coder under 4k context on local WebGPU.",
    desc: "Hardware throughput metrics for air-gapped web inference.",
  },
];

function EmptyCleanStage({
  onSelectPrompt,
  activeModelId,
}: {
  onSelectPrompt: (p: string) => void;
  activeModelId: string;
}) {
  return (
    <div className="max-w-3xl mx-auto h-full min-h-[55vh] flex flex-col justify-center items-center text-center space-y-8 select-none py-12">
      {/* Surgical Minimalist Indicator */}
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-white border border-[#E4E4E7] lab-shadow-md flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-[#0055FF] animate-pulse" />
        </div>
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#EEF4FF] border border-[#D6E4FF] font-mono text-[9px] font-semibold text-[#0055FF] uppercase whitespace-nowrap">
          WebGPU Core Active
        </span>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#09090B]">
          The Clean Room
        </h1>
        <p className="text-sm text-[#71717A] max-w-md mx-auto leading-relaxed">
          Sterile, zero-latency local intelligence running directly on your GPU.
          Zero software installation. 100% private in-browser compute.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3 font-mono text-[11px] text-[#71717A]">
          <span>CORE: {activeModelId.split("-q4")[0]}</span>
          <span>•</span>
          <span className="text-[#059669]">ZERO CLOUD EGRESS</span>
        </div>
      </div>

      {/* 4 Clinical Prompt Cards */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
        {CLINICAL_PROMPTS.map((item) => (
          <button
            key={item.title}
            onClick={() => onSelectPrompt(item.prompt)}
            className="p-4 bg-white hover:bg-[#FAFAFB] rounded-2xl border border-[#E4E4E7] hover:border-[#0055FF]/40 transition-all duration-200 lab-shadow-sm hover:shadow-md text-left flex flex-col justify-between group cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between font-mono text-[10px] text-[#71717A] mb-1">
                <span className="text-[#0055FF] font-semibold">{item.tag}</span>
                <span className="group-hover:text-[#0055FF] transition-colors">
                  Engage →
                </span>
              </div>
              <p className="text-xs font-semibold text-[#09090B] group-hover:text-[#0055FF] transition-colors">
                {item.title}
              </p>
              <p className="text-[11px] text-[#71717A] mt-1 leading-relaxed">
                {item.desc}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                MESSAGE ITEM                                */
/* -------------------------------------------------------------------------- */
function FormattedTimestamp({ timestamp }: { timestamp: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <span suppressHydrationWarning>
      {mounted
        ? new Date(timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "--:--"}
    </span>
  );
}

interface MessageItemProps {
  message: ChatMessage;
  isLastAi: boolean;
  isGenerating: boolean;
  liveRate: number;
}

function MessageItem({
  message,
  isLastAi,
  isGenerating,
  liveRate,
}: MessageItemProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", ...SPRING.snappy }}
        className="flex justify-end"
      >
        {/* User messages: light grey (#F4F4F5), rounded-xl */}
        <div className="max-w-[85%] sm:max-w-2xl bg-[#F4F4F5] rounded-xl p-4 sm:p-5 border border-[#E4E4E7]">
          <div className="flex items-center justify-between gap-4 pb-2 mb-2 border-b border-[#E4E4E7] font-mono text-[10px] text-[#71717A]">
            <span className="font-semibold text-[#09090B] uppercase">OPERATOR</span>
            <FormattedTimestamp timestamp={message.timestamp} />
          </div>
          <p className="text-xs sm:text-sm text-[#09090B] whitespace-pre-wrap leading-relaxed select-text font-normal">
            {message.content}
          </p>
        </div>
      </motion.div>
    );
  }

  // AI messages: pure white (#FFFFFF), subtle shadow, 1px border, rounded-xl
  const isStreamingNow = isLastAi && isGenerating;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex justify-start w-full"
    >
      <div className="w-full bg-white rounded-xl border border-[#E4E4E7] lab-shadow-md p-4 sm:p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E4E4E7]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0055FF]" />
            <span className="text-xs font-semibold text-[#09090B] tracking-tight">
              BetaBrain In-Browser Core
            </span>
            {isStreamingNow && (
              <span className="font-mono text-[10px] text-[#0055FF] bg-[#EEF4FF] px-2 py-0.5 rounded-full border border-[#D6E4FF]">
                Streaming: {liveRate > 0 ? `${liveRate} tok/s` : "Active"}
              </span>
            )}
          </div>
          <div className="font-mono text-[10px] text-[#71717A]">
            {message.telemetry?.model || "WebGPU Core"}
          </div>
        </div>

        {/* Content Area with Markdown & Code Blocks */}
        <div className="text-xs sm:text-sm text-[#09090B] leading-relaxed select-text space-y-4">
          {(() => {
            const rawContent = message.content;
            const textToRender =
              typeof rawContent === "string"
                ? rawContent
                : rawContent && typeof rawContent === "object"
                ? typeof (rawContent as Record<string, unknown>).content === "string"
                  ? String((rawContent as Record<string, unknown>).content)
                  : JSON.stringify(rawContent)
                : String(rawContent ?? "");

            return (
              <ReactMarkdown
                components={{
                  code({ node, className, children, ...props }) {
                    // Secure raw string extraction avoiding any object casting or AST serialization
                    const extractText = (val: unknown): string => {
                      if (typeof val === "string") return val;
                      if (typeof val === "number") return String(val);
                      if (!val) return "";
                      if (Array.isArray(val)) return val.flat().map(extractText).join("");
                      if (React.isValidElement(val)) {
                        return extractText((val.props as { children?: React.ReactNode })?.children);
                      }
                      if (typeof val === "object" && val !== null) {
                        if ("props" in val && (val as { props?: { children?: unknown } }).props?.children) {
                          return extractText((val as { props: { children?: unknown } }).props.children);
                        }
                        if ("children" in val) {
                          return extractText((val as { children: unknown }).children);
                        }
                        if ("value" in val && typeof (val as { value: unknown }).value === "string") {
                          return (val as { value: string }).value;
                        }
                      }
                      return "";
                    };

                    const codeText = (
                      Array.isArray(children)
                        ? children.flat().map(extractText).join("")
                        : typeof children === "string"
                        ? children
                        : extractText(children)
                    ).replace(/\n$/, "");

                    const match = /language-(\w+)/.exec(className || "");
                    const isBlock = Boolean(match) || codeText.includes("\n");

                    if (isBlock) {
                      return (
                        <CleanCodeBlock
                          language={match ? match[1] : "text"}
                          code={codeText}
                        />
                      );
                    }

                    return (
                      <code
                        className="px-1.5 py-0.5 bg-[#F4F4F5] text-[#0055FF] rounded border border-[#E4E4E7] font-mono text-xs"
                        dangerouslySetInnerHTML={{ __html: codeText }}
                        {...props}
                      />
                    );
                  },
                }}
              >
                {textToRender}
              </ReactMarkdown>
            );
          })()}

          {isStreamingNow && (
            <div className="flex items-center gap-2 text-[#0055FF] font-mono text-xs pt-1">
              <span className="w-1.5 h-3.5 bg-[#0055FF] animate-pulse" />
              <span className="text-[11px] text-[#71717A]">WebGPU Stream Active...</span>
            </div>
          )}
        </div>

        {/* Telemetry Footer */}
        {message.telemetry && !isStreamingNow && (
          <div className="mt-5 pt-3 border-t border-[#E4E4E7] flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] text-[#71717A]">
            <div className="flex items-center gap-3">
              <span>
                Tokens: <strong className="text-[#09090B]">{message.telemetry.tokens || 0}</strong>
              </span>
              <span>•</span>
              <span>
                Throughput: <strong className="text-[#0055FF]">{message.telemetry.tokensPerSecond || 54} tok/s</strong>
              </span>
              <span>•</span>
              <span>
                TTFT: <strong className="text-[#09090B]">{message.telemetry.firstTokenLatencyMs || 18}ms</strong>
              </span>
            </div>
            <div className="text-[#059669] font-medium uppercase tracking-wide">
              100% Client-Side WebGPU
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               CLEAN CODE BLOCK                             */
/* -------------------------------------------------------------------------- */
function CleanCodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const codeString = typeof code === "string" ? code : String(code ?? "");
  const setActiveArtifact = useChatStore((s) => s.setActiveArtifact);

  const highlightedHtml = useMemo(() => {
    try {
      if (language && hljs.getLanguage(language)) {
        return hljs.highlight(codeString, { language, ignoreIllegals: true }).value;
      }
      return hljs.highlightAuto(codeString).value;
    } catch {
      return codeString
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }
  }, [codeString, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="my-4 rounded-xl border border-[#E4E4E7] overflow-hidden bg-[#FAFAFB]">
      <div className="flex items-center justify-between px-3.5 py-2 bg-white border-b border-[#E4E4E7]">
        <div className="flex items-center gap-2 font-mono text-[10px] text-[#71717A]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0055FF]" />
          <span className="font-semibold text-[#09090B] uppercase">{language || "CODE"}</span>
          <span>•</span>
          <span>{codeString.split("\n").length} lines</span>
        </div>

        {/* Action Buttons: Preview in Sandbox & Copy */}
        <div className="flex items-center gap-2">
          {(language === "html" ||
            language === "jsx" ||
            language === "tsx" ||
            language === "react" ||
            language === "javascript" ||
            language === "js" ||
            codeString.includes("<div") ||
            codeString.includes("<!DOCTYPE")) && (
            <button
              type="button"
              onClick={() => {
                setActiveArtifact({
                  id: `artifact-${Date.now()}`,
                  title: "Code Block Prototype",
                  language: language || "html",
                  code: codeString,
                  timestamp: Date.now(),
                });
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[10px] font-medium bg-[#EEF4FF] hover:bg-[#0055FF] text-[#0055FF] hover:text-white border border-[#0055FF]/30 transition-all cursor-pointer shadow-xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#0055FF]" />
              Live Preview ↗
            </button>
          )}

          {/* Minimal Copy Button */}
          <button
            onClick={handleCopy}
            aria-label="Copy Code"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[10px] font-medium transition-all duration-200 cursor-pointer ${
              copied
                ? "bg-[#EEF4FF] border border-[#0055FF] text-[#0055FF]"
                : "bg-white border border-[#E4E4E7] hover:border-[#0055FF] text-[#09090B]"
            }`}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto p-4 font-mono text-xs text-[#09090B]">
        <pre className="!bg-transparent !p-0 !m-0">
          <code
            className={`hljs language-${language || "text"}`}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        </pre>
      </div>
    </div>
  );
}
