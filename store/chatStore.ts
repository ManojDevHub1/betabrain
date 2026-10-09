import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface MessageTelemetry {
  tokens?: number;
  tokensPerSecond?: number;
  firstTokenLatencyMs?: number;
  totalTimeMs?: number;
  model?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  telemetry?: MessageTelemetry;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  model: string;
  messages: ChatMessage[];
  totalTokensGenerated: number;
}

export type VramTier = "4GB" | "6GB" | "8GB" | "12GB" | "16GB" | "24GB+";

export interface WebLlmModelSpec {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4;
  tierTitle: string;
  tierSubtitle: string;
  vramBadge: string;
  approxDownloadSize: string;
  approxDownloadMB: number;
  parameters: string;
  quantization: string;
  description: string;
  category: "coder" | "general" | "reasoning";
  recommendedVrams: VramTier[];
}

export interface ArtifactCode {
  id: string;
  title: string;
  language: string;
  code: string;
  timestamp: number;
}

export function extractArtifactFromMarkdown(content: string): ArtifactCode | null {
  if (!content) return null;

  // Search for fenced code blocks with html, jsx, tsx, js, javascript, react, svg
  const codeBlockRegex = /```(html|jsx|tsx|javascript|js|react|svg)?\s*([\s\S]*?)```/gi;
  let match: RegExpExecArray | null;
  let lastArtifact: ArtifactCode | null = null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const rawLang = (match[1] || "").toLowerCase().trim();
    const code = match[2].trim();

    const isRenderable =
      rawLang === "html" ||
      rawLang === "jsx" ||
      rawLang === "tsx" ||
      rawLang === "react" ||
      rawLang === "svg" ||
      code.includes("<!DOCTYPE") ||
      code.includes("<html") ||
      code.includes("import React") ||
      code.includes("export default function") ||
      code.includes("function App") ||
      (code.includes("<div") && code.includes("className="));

    if (isRenderable && code.length > 25) {
      let title = "Generated Software Prototype";
      const titleMatch = content.match(/#+\s+([^\n\r]+)/) || content.match(/\*\*([^\*]+)\*\*/);
      if (titleMatch && titleMatch[1] && titleMatch[1].length < 40) {
        title = titleMatch[1].trim();
      } else if (code.includes("<title>")) {
        const t = code.match(/<title>([^<]+)<\/title>/);
        if (t && t[1]) title = t[1].trim();
      }

      lastArtifact = {
        id: `artifact-${Date.now()}`,
        title,
        language: rawLang || "html",
        code,
        timestamp: Date.now(),
      };
    }
  }

  // Handle in-progress streaming code block
  if (!lastArtifact && content.includes("```")) {
    const openBlock = content.lastIndexOf("```");
    const openSnippet = content.slice(openBlock + 3);
    const newlineIdx = openSnippet.indexOf("\n");
    if (newlineIdx !== -1) {
      const lang = openSnippet.slice(0, newlineIdx).toLowerCase().trim();
      const streamingCode = openSnippet.slice(newlineIdx + 1).trim();
      if (
        streamingCode.length > 40 &&
        (lang === "html" ||
          lang === "jsx" ||
          lang === "tsx" ||
          lang === "react" ||
          streamingCode.includes("<div") ||
          streamingCode.includes("<!DOCTYPE"))
      ) {
        lastArtifact = {
          id: `artifact-streaming`,
          title: "Synthesizing Live Prototype...",
          language: lang || "html",
          code: streamingCode,
          timestamp: Date.now(),
        };
      }
    }
  }

  return lastArtifact;
}

export type EngineStatus = "uninitialized" | "downloading" | "ready" | "error";

interface ChatStoreState {
  sessions: ChatSession[];
  activeSessionId: string;
  activeModelId: string;
  availableModels: WebLlmModelSpec[];
  engineStatus: EngineStatus;
  downloadProgress: number; // 0 to 1
  downloadText: string;
  webGpuSupported: boolean | null;
  hardwareDevice: string;
  isGenerating: boolean;
  liveTokRate: number;
  lastLatencyMs: number | null;
  systemPrompt: string;

  // Hardware Profiler
  selectedVram: VramTier | null;
  isCalibrationOpen: boolean;

  // Artifact Sandbox
  activeArtifact: ArtifactCode | null;
  isSandboxOpen: boolean;
  sandboxViewMode: "preview" | "code";
  sandboxViewport: "desktop" | "tablet" | "mobile";

  // Actions
  createSession: (initialTitle?: string) => string;
  selectSession: (id: string) => void;
  deleteSession: (id: string) => void;
  clearWorkspace: () => void;
  addMessage: (sessionId: string, message: Omit<ChatMessage, "id" | "timestamp">) => string;
  appendStreamingChunk: (sessionId: string, chunk: string, tokenDelta?: number) => void;
  finalizeStreaming: (sessionId: string, telemetry?: MessageTelemetry) => void;
  setActiveModelId: (modelId: string) => void;
  setEngineStatus: (status: EngineStatus) => void;
  setDownloadProgress: (progress: number, text: string) => void;
  setWebGpuSupported: (supported: boolean, device?: string) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setLiveTokRate: (rate: number) => void;
  setLastLatency: (ms: number) => void;
  setSelectedVram: (vram: VramTier) => void;
  setIsCalibrationOpen: (open: boolean) => void;
  setActiveArtifact: (artifact: ArtifactCode | null) => void;
  setIsSandboxOpen: (open: boolean) => void;
  setSandboxViewMode: (mode: "preview" | "code") => void;
  setSandboxViewport: (viewport: "desktop" | "tablet" | "mobile") => void;
}

export const AVAILABLE_MODELS: WebLlmModelSpec[] = [
  // Tier 1: Fast & Light (4GB - 6GB VRAM)
  {
    id: "Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC",
    name: "Qwen2.5-Coder 1.5B Instruct",
    tier: 1,
    tierTitle: "Tier 1: Fast & Light",
    tierSubtitle: "For 4GB-6GB VRAM",
    vramBadge: "4GB VRAM",
    approxDownloadSize: "1.3 GB",
    approxDownloadMB: 1300,
    parameters: "1.54B",
    quantization: "q4f16_1",
    description: "Specialized in-browser coding model for full apps, widgets, and algorithmic logic.",
    category: "coder",
    recommendedVrams: ["4GB", "6GB"],
  },
  {
    id: "Phi-3-mini-4k-instruct-q4f16_1-MLC",
    name: "Phi-3 Mini 4K Instruct",
    tier: 1,
    tierTitle: "Tier 1: Fast & Light",
    tierSubtitle: "For 4GB-6GB VRAM",
    vramBadge: "6GB VRAM",
    approxDownloadSize: "2.4 GB",
    approxDownloadMB: 2400,
    parameters: "3.82B",
    quantization: "q4f16_1",
    description: "Microsoft dense architecture with high-efficiency reasoning.",
    category: "reasoning",
    recommendedVrams: ["6GB"],
  },
  {
    id: "Qwen2-1.5B-Instruct-q4f16_1-MLC",
    name: "Qwen2 1.5B Instruct",
    tier: 1,
    tierTitle: "Tier 1: Fast & Light",
    tierSubtitle: "For 4GB-6GB VRAM",
    vramBadge: "4GB VRAM",
    approxDownloadSize: "1.2 GB",
    approxDownloadMB: 1220,
    parameters: "1.54B",
    quantization: "q4f16_1",
    description: "Ultra-fast foundation core for quick conversational tasks and general reasoning.",
    category: "general",
    recommendedVrams: ["4GB"],
  },
  // Tier 2: Balanced (8GB - 12GB VRAM)
  {
    id: "Qwen2.5-Coder-7B-Instruct-q4f16_1-MLC",
    name: "Qwen2.5-Coder 7B Instruct",
    tier: 2,
    tierTitle: "Tier 2: Balanced",
    tierSubtitle: "For 8GB-12GB VRAM",
    vramBadge: "8GB VRAM",
    approxDownloadSize: "4.7 GB",
    approxDownloadMB: 4700,
    parameters: "7.61B",
    quantization: "q4f16_1",
    description: "Premier coding powerhouse for full-stack software architecture and reactive component design.",
    category: "coder",
    recommendedVrams: ["8GB", "12GB"],
  },
  {
    id: "Llama-3.1-8B-Instruct-q4f16_1-MLC",
    name: "Llama 3.1 8B Instruct",
    tier: 2,
    tierTitle: "Tier 2: Balanced",
    tierSubtitle: "For 8GB-12GB VRAM",
    vramBadge: "8GB VRAM",
    approxDownloadSize: "4.9 GB",
    approxDownloadMB: 4920,
    parameters: "8.03B",
    quantization: "q4f16_1",
    description: "Meta state-of-the-art open weights with deep conversational reasoning.",
    category: "general",
    recommendedVrams: ["8GB", "12GB"],
  },
  {
    id: "Mistral-7B-Instruct-v0.3-q4f16_1-MLC",
    name: "Mistral 7B Instruct v0.3",
    tier: 2,
    tierTitle: "Tier 2: Balanced",
    tierSubtitle: "For 8GB-12GB VRAM",
    vramBadge: "8GB VRAM",
    approxDownloadSize: "4.3 GB",
    approxDownloadMB: 4350,
    parameters: "7.25B",
    quantization: "q4f16_1",
    description: "High-efficiency European foundation architecture with sliding-window attention.",
    category: "general",
    recommendedVrams: ["8GB", "12GB"],
  },
  // Tier 3: Heavy Duty (16GB VRAM & Mac Studios)
  {
    id: "Qwen2-7B-Instruct-q4f16_1-MLC",
    name: "Qwen2 7B Instruct",
    tier: 3,
    tierTitle: "Tier 3: Heavy Duty",
    tierSubtitle: "For 16GB VRAM & Mac Studios",
    vramBadge: "16GB VRAM",
    approxDownloadSize: "4.5 GB",
    approxDownloadMB: 4500,
    parameters: "7.07B",
    quantization: "q4f16_1",
    description: "Full-scale Alibaba foundation model for heavy scientific compute and coding.",
    category: "coder",
    recommendedVrams: ["16GB"],
  },
  {
    id: "gemma-2-9b-it-q4f16_1-MLC",
    name: "Gemma 2 9B IT",
    tier: 3,
    tierTitle: "Tier 3: Heavy Duty",
    tierSubtitle: "For 16GB VRAM & Mac Studios",
    vramBadge: "16GB VRAM",
    approxDownloadSize: "5.6 GB",
    approxDownloadMB: 5600,
    parameters: "9.24B",
    quantization: "q4f16_1",
    description: "Google DeepMind heavyweight model with superior precision and logic mastery.",
    category: "reasoning",
    recommendedVrams: ["16GB"],
  },
  // Tier 4: Enterprise Frontier (24GB+ VRAM)
  {
    id: "Llama-3.1-70B-Instruct-q3f16_1-MLC",
    name: "Llama 3.1 70B Instruct",
    tier: 4,
    tierTitle: "Tier 4: Enterprise Frontier",
    tierSubtitle: "For 24GB+ VRAM & Mac Studios",
    vramBadge: "24GB+ VRAM",
    approxDownloadSize: "35.0 GB",
    approxDownloadMB: 35000,
    parameters: "70.6B",
    quantization: "q3f16_1",
    description: "Frontier foundation model for enterprise software architecture and zero-shot code generation.",
    category: "coder",
    recommendedVrams: ["24GB+"],
  },
];

const DETERMINISTIC_TIMESTAMP = 1710000000000;

const INITIAL_SESSIONS: ChatSession[] = [
  {
    id: "session-clean-room-1",
    title: "WebGPU Molecular Dynamics Pipeline",
    createdAt: DETERMINISTIC_TIMESTAMP - 86400000,
    updatedAt: DETERMINISTIC_TIMESTAMP - 72000000,
    model: "Qwen2-1.5B-Instruct-q4f16_1-MLC",
    totalTokensGenerated: 342,
    messages: [
      {
        id: "msg-1",
        role: "user",
        content: "Draft a WGSL compute shader for spatial partitioning in client-side molecular dynamics simulation.",
        timestamp: DETERMINISTIC_TIMESTAMP - 86400000,
      },
      {
        id: "msg-2",
        role: "assistant",
        content: `Here is the optimized WGSL spatial hash grid kernel designed for in-browser WebGPU execution:

\`\`\`rust
struct Particle {
    position: vec4<f32>,
    velocity: vec4<f32>,
};

struct Uniforms {
    grid_dim: vec3<u32>,
    cell_size: f32,
    num_particles: u32,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> particles: array<Particle>;
@group(0) @binding(2) var<storage, read_write> cell_indices: array<u32>;

fn get_cell_coords(pos: vec3<f32>) -> vec3<u32> {
    return vec3<u32>(floor(pos / uniforms.cell_size));
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (index >= uniforms.num_particles) {
        return;
    }

    let p = particles[index];
    let cell = get_cell_coords(p.position.xyz);
    let hash = cell.x + cell.y * uniforms.grid_dim.x + cell.z * (uniforms.grid_dim.x * uniforms.grid_dim.y);
    
    cell_indices[index] = hash;
}
\`\`\`

### Execution Invariants:
- **Zero-Copy VRAM Allocation**: Binds directly via \`GPUBufferUsage::STORAGE\`.
- **Latency**: Dispatched synchronously across GPU workgroups without CPU roundtrips.`,
        timestamp: DETERMINISTIC_TIMESTAMP - 72000000,
        telemetry: {
          tokens: 342,
          tokensPerSecond: 64.2,
          firstTokenLatencyMs: 18,
          totalTimeMs: 5320,
          model: "Qwen2-1.5B-Instruct-q4f16_1-MLC",
        },
      },
    ],
  },
  {
    id: "session-clean-room-2",
    title: "IndexedDB Model Weight Caching",
    createdAt: DETERMINISTIC_TIMESTAMP - 21600000,
    updatedAt: DETERMINISTIC_TIMESTAMP - 14400000,
    model: "Qwen2-1.5B-Instruct-q4f16_1-MLC",
    totalTokensGenerated: 218,
    messages: [
      {
        id: "msg-3",
        role: "user",
        content: "Explain how browser IndexedDB caches quantized model shards without memory decompression overhead.",
        timestamp: DETERMINISTIC_TIMESTAMP - 21600000,
      },
      {
        id: "msg-4",
        role: "assistant",
        content: `WebLLM caches model weight shards directly as binary \`ArrayBuffer\` chunks in IndexedDB.

1. **Direct Memory Mapping**: Shards are fetched in chunked byte streams and stored as immutable Blobs.
2. **GPU Staging**: When the engine initializes, buffers stream directly into unified WebGPU memory (\`device.createBuffer\`), bypassing JS heap allocation.
3. **Zero Invalidation**: Cache persists across browser tabs, enabling instant sub-second reloads without network re-download.`,
        timestamp: DETERMINISTIC_TIMESTAMP - 14400000,
        telemetry: {
          tokens: 218,
          tokensPerSecond: 58.0,
          firstTokenLatencyMs: 20,
          totalTimeMs: 3750,
          model: "Qwen2-1.5B-Instruct-q4f16_1-MLC",
        },
      },
    ],
  },
];

export const useChatStore = create<ChatStoreState>()(
  persist(
    (set, get) => ({
      sessions: INITIAL_SESSIONS,
      activeSessionId: INITIAL_SESSIONS[0].id,
      activeModelId: AVAILABLE_MODELS[0].id,
      availableModels: AVAILABLE_MODELS,
      engineStatus: "uninitialized",
      downloadProgress: 0,
      downloadText: "Awaiting initialization signal...",
      webGpuSupported: null,
      hardwareDevice: "Scanning WebGPU Adapter...",
      isGenerating: false,
      liveTokRate: 0,
      lastLatencyMs: null,
      systemPrompt:
        "You are BetaBrain, an elite software architect and AI Software Builder running locally in-browser via WebGPU. When asked to build a website, app, or UI component, always output the complete, functional, self-contained code inside a single code block so the internal Sandbox engine can render it live. Include all necessary HTML, Tailwind CSS styling, and JavaScript logic so the code executes immediately without external build steps.",

      // Hardware Profiler
      selectedVram: "8GB",
      isCalibrationOpen: false,

      // Artifact Sandbox
      activeArtifact: null,
      isSandboxOpen: false,
      sandboxViewMode: "preview",
      sandboxViewport: "desktop",

      createSession: (initialTitle = "New Neural Canvas") => {
        const id = `session-${Date.now()}`;
        const newSession: ChatSession = {
          id,
          title: initialTitle,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          model: get().activeModelId,
          messages: [],
          totalTokensGenerated: 0,
        };

        set((state) => ({
          sessions: [newSession, ...state.sessions],
          activeSessionId: id,
        }));

        return id;
      },

      selectSession: (id: string) => {
        set({ activeSessionId: id });
      },

      deleteSession: (id: string) => {
        set((state) => {
          const filtered = state.sessions.filter((s) => s.id !== id);
          if (filtered.length === 0) {
            const fallbackId = `session-${Date.now()}`;
            const fallbackSession: ChatSession = {
              id: fallbackId,
              title: "Primary Canvas",
              createdAt: Date.now(),
              updatedAt: Date.now(),
              model: state.activeModelId,
              messages: [],
              totalTokensGenerated: 0,
            };
            return {
              sessions: [fallbackSession],
              activeSessionId: fallbackId,
            };
          }
          return {
            sessions: filtered,
            activeSessionId: state.activeSessionId === id ? filtered[0].id : state.activeSessionId,
          };
        });
      },

      clearWorkspace: () => {
        const freshId = `session-${Date.now()}`;
        const freshSession: ChatSession = {
          id: freshId,
          title: "Clean Canvas",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          model: get().activeModelId,
          messages: [],
          totalTokensGenerated: 0,
        };
        set({
          sessions: [freshSession],
          activeSessionId: freshId,
          activeArtifact: null,
          isSandboxOpen: false,
        });
      },

      addMessage: (sessionId: string, messageData: Omit<ChatMessage, "id" | "timestamp">) => {
        const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const contentStr =
          typeof messageData.content === "string"
            ? messageData.content
            : messageData.content && typeof messageData.content === "object"
            ? typeof (messageData.content as Record<string, unknown>).content === "string"
              ? String((messageData.content as Record<string, unknown>).content)
              : JSON.stringify(messageData.content)
            : String(messageData.content ?? "");

        const newMessage: ChatMessage = {
          id: messageId,
          timestamp: Date.now(),
          role: messageData.role,
          content: contentStr,
          telemetry: messageData.telemetry,
          isStreaming: messageData.isStreaming,
        };

        // Extract artifact if message contains renderable code
        const detectedArtifact = extractArtifactFromMarkdown(contentStr);

        set((state) => ({
          activeArtifact: detectedArtifact ? detectedArtifact : state.activeArtifact,
          isSandboxOpen: detectedArtifact ? true : state.isSandboxOpen,
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s;
            const updated = [...s.messages, newMessage];
            let title = s.title;
            if (s.messages.length === 0 && messageData.role === "user") {
              const snippet = contentStr.trim().slice(0, 32);
              title = snippet.length > 0 ? snippet : "Neural Canvas";
            }
            return {
              ...s,
              title,
              updatedAt: Date.now(),
              messages: updated,
            };
          }),
        }));

        return messageId;
      },

      appendStreamingChunk: (sessionId: string, rawChunk: unknown, tokenDelta = 1) => {
        let chunkText = "";
        if (typeof rawChunk === "string") {
          chunkText = rawChunk;
        } else if (rawChunk && typeof rawChunk === "object") {
          const obj = rawChunk as Record<string, unknown>;
          if (typeof obj.content === "string") {
            chunkText = obj.content;
          } else if (typeof obj.text === "string") {
            chunkText = obj.text;
          } else if (typeof obj.delta === "string") {
            chunkText = obj.delta;
          } else if (
            obj.delta &&
            typeof obj.delta === "object" &&
            typeof (obj.delta as Record<string, unknown>).content === "string"
          ) {
            chunkText = (obj.delta as Record<string, unknown>).content as string;
          }
        }

        if (!chunkText) return;

        set((state) => {
          let updatedArtifact = state.activeArtifact;
          let shouldOpenSandbox = state.isSandboxOpen;

          const updatedSessions = state.sessions.map((s) => {
            if (s.id !== sessionId) return s;
            const msgs = [...s.messages];
            const lastIdx = msgs.length - 1;
            if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
              const currentContent =
                typeof msgs[lastIdx].content === "string" ? msgs[lastIdx].content : "";
              const fullContent = currentContent + chunkText;

              msgs[lastIdx] = {
                ...msgs[lastIdx],
                content: fullContent,
                isStreaming: true,
              };

              // Real-time live code artifact detection
              const detected = extractArtifactFromMarkdown(fullContent);
              if (detected) {
                updatedArtifact = detected;
                shouldOpenSandbox = true;
              }
            }
            return {
              ...s,
              messages: msgs,
              totalTokensGenerated: s.totalTokensGenerated + tokenDelta,
            };
          });

          return {
            sessions: updatedSessions,
            activeArtifact: updatedArtifact,
            isSandboxOpen: shouldOpenSandbox,
          };
        });
      },

      finalizeStreaming: (sessionId: string, telemetry?: MessageTelemetry) => {
        set((state) => {
          let finalArtifact = state.activeArtifact;

          const updatedSessions = state.sessions.map((s) => {
            if (s.id !== sessionId) return s;
            const msgs = [...s.messages];
            const lastIdx = msgs.length - 1;
            if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
              const content =
                typeof msgs[lastIdx].content === "string" ? msgs[lastIdx].content : "";
              msgs[lastIdx] = {
                ...msgs[lastIdx],
                isStreaming: false,
                telemetry: telemetry || msgs[lastIdx].telemetry,
              };

              const detected = extractArtifactFromMarkdown(content);
              if (detected) {
                finalArtifact = detected;
              }
            }
            return {
              ...s,
              messages: msgs,
              updatedAt: Date.now(),
            };
          });

          return {
            isGenerating: false,
            liveTokRate: 0,
            activeArtifact: finalArtifact,
            sessions: updatedSessions,
          };
        });
      },

      setActiveModelId: (modelId: string) => {
        set({ activeModelId: modelId });
      },

      setEngineStatus: (status: EngineStatus) => {
        set({ engineStatus: status });
      },

      setDownloadProgress: (progress: number, text: string) => {
        set({ downloadProgress: progress, downloadText: text });
      },

      setWebGpuSupported: (supported: boolean, device?: string) => {
        set({
          webGpuSupported: supported,
          hardwareDevice: device || (supported ? "Desktop WebGPU Silicon" : "WebGPU Not Available"),
        });
      },

      setIsGenerating: (isGenerating: boolean) => {
        set({ isGenerating });
      },

      setLiveTokRate: (rate: number) => {
        set({ liveTokRate: rate });
      },

      setLastLatency: (ms: number) => {
        set({ lastLatencyMs: ms });
      },

      setSelectedVram: (vram: VramTier) => {
        set({ selectedVram: vram });
      },

      setIsCalibrationOpen: (open: boolean) => {
        set({ isCalibrationOpen: open });
      },

      setActiveArtifact: (artifact: ArtifactCode | null) => {
        set({ activeArtifact: artifact, isSandboxOpen: artifact !== null });
      },

      setIsSandboxOpen: (open: boolean) => {
        set({ isSandboxOpen: open });
      },

      setSandboxViewMode: (mode: "preview" | "code") => {
        set({ sandboxViewMode: mode });
      },

      setSandboxViewport: (viewport: "desktop" | "tablet" | "mobile") => {
        set({ sandboxViewport: viewport });
      },
    }),
    {
      name: "betabrain_cleanroom_store_v2",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        activeModelId: state.activeModelId,
        selectedVram: state.selectedVram,
      }),
    }
  )
);
