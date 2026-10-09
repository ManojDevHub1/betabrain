"use client";

import React, { useState, useEffect, useRef } from "react";
import JSZip from "jszip";
import { ArtifactCode, useChatStore } from "@/store/chatStore";

interface ArtifactSandboxProps {
  artifact: ArtifactCode;
  onClose: () => void;
}

/**
 * Builds a complete, standalone, self-contained HTML page
 * injecting Tailwind CSS CDN, Lucide icons, and React 18 / Babel runtime.
 */
export function buildSandboxHtml(rawCode: string, language: string): string {
  const code = rawCode.trim();
  const isPureHtml =
    language === "html" ||
    code.startsWith("<!DOCTYPE") ||
    code.startsWith("<html") ||
    (code.includes("<div") &&
      !code.includes("import ") &&
      !code.includes("export default") &&
      !code.includes("function App()"));

  if (isPureHtml) {
    if (code.includes("<!DOCTYPE") || code.includes("<html")) {
      if (!code.includes("cdn.tailwindcss.com")) {
        return code.replace(
          "<head>",
          `<head>
            <script src="https://cdn.tailwindcss.com"></script>
            <script src="https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.js"></script>`
        );
      }
      return code;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BetaBrain Artifact Sandbox</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 9999px; }
  </style>
</head>
<body class="bg-[#F7F7F9] text-[#09090B] antialiased min-h-screen p-4 flex flex-col items-center justify-center">
  <div class="w-full max-w-5xl mx-auto">
    ${code}
  </div>
  <script>
    if (window.lucide) { lucide.createIcons(); }
  </script>
</body>
</html>`;
  }

  // React / JSX / TSX Component Code
  // Clean imports/exports for Babel standalone
  let processedCode = code
    .replace(/import\s+.*?from\s+['"].*?['"];?/g, "")
    .replace(/export\s+default\s+function/g, "function")
    .replace(/export\s+default\s+/g, "")
    .replace(/export\s+/g, "");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BetaBrain Artifact Sandbox</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.js"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 9999px; }
  </style>
</head>
<body class="bg-[#F7F7F9] text-[#09090B] antialiased min-h-screen p-4 flex flex-col items-center justify-center">
  <div id="root" class="w-full max-w-5xl mx-auto flex flex-col items-center justify-center"></div>
  <div id="runtime-error" style="display:none; margin: 20px auto; max-width: 600px; padding: 16px; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; color: #DC2626; font-family: monospace; font-size: 12px;"></div>

  <script type="text/babel">
    window.onerror = function(msg, url, line) {
      const el = document.getElementById('runtime-error');
      if (el) {
        el.style.display = 'block';
        el.innerHTML = '<strong>Sandbox Runtime Warning:</strong> ' + msg + '<br><small>Line: ' + line + '</small>';
      }
    };

    try {
      const { useState, useEffect, useRef, useMemo, useCallback } = React;

      ${processedCode}

      // Auto-detect entry component
      let EntryComponent = null;
      if (typeof App !== 'undefined') EntryComponent = App;
      else if (typeof Component !== 'undefined') EntryComponent = Component;
      else if (typeof Widget !== 'undefined') EntryComponent = Widget;
      else if (typeof Dashboard !== 'undefined') EntryComponent = Dashboard;
      else if (typeof Playground !== 'undefined') EntryComponent = Playground;

      if (EntryComponent) {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<EntryComponent />);
      } else {
        document.getElementById('root').innerHTML = '<div class="p-6 text-center text-xs font-mono text-zinc-500">Component parsed. Ready for execution.</div>';
      }

      setTimeout(() => {
        if (window.lucide) { lucide.createIcons(); }
      }, 100);
    } catch (err) {
      const el = document.getElementById('runtime-error');
      if (el) {
        el.style.display = 'block';
        el.innerHTML = '<strong>Syntax Compilation Warning:</strong> ' + err.message;
      }
    }
  </script>
</body>
</html>`;
}

export function ArtifactSandbox({ artifact, onClose }: ArtifactSandboxProps) {
  const sandboxViewMode = useChatStore((s) => s.sandboxViewMode);
  const setSandboxViewMode = useChatStore((s) => s.setSandboxViewMode);
  const sandboxViewport = useChatStore((s) => s.sandboxViewport);
  const setSandboxViewport = useChatStore((s) => s.setSandboxViewport);

  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Re-render preview on code changes
  useEffect(() => {
    setIframeKey((k) => k + 1);
  }, [artifact.code, artifact.language]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(artifact.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const compiledHtml = buildSandboxHtml(artifact.code, artifact.language);

      zip.file("index.html", compiledHtml);
      zip.file(
        artifact.language === "html" ? "source.html" : "Component.jsx",
        artifact.code
      );
      zip.file(
        "package.json",
        JSON.stringify(
          {
            name: artifact.title.toLowerCase().replace(/[^a-z0-9]/g, "-"),
            version: "1.0.0",
            description: "Generated by BetaBrain AI Software Builder",
            scripts: {
              start: "npx serve .",
            },
          },
          null,
          2
        )
      );
      zip.file(
        "README.md",
        `# ${artifact.title}

Generated by **BetaBrain // The Clean Room** — In-Browser & Standalone WebGPU AI Client.

## Execution
Double-click \`index.html\` to run immediately in any modern browser, or launch with:
\`\`\`bash
npx serve .
\`\`\`
`
      );

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${artifact.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")}-artifact.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error creating zip package:", err);
    } finally {
      setIsZipping(false);
    }
  };

  // Determine viewport width style
  const viewportWidthClass =
    sandboxViewport === "mobile"
      ? "max-w-[375px]"
      : sandboxViewport === "tablet"
      ? "max-w-[768px]"
      : "w-full";

  return (
    <div
      data-lenis-prevent
      className="flex flex-col h-full bg-white border-l border-[#E4E4E7] lab-shadow-md select-none overflow-hidden relative"
    >
      {/* Top Clinical Header Bar */}
      <div className="h-14 px-4 sm:px-6 bg-white border-b border-[#E4E4E7] flex items-center justify-between shrink-0">
        {/* Left: Artifact Title & Identifier */}
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="w-6 h-6 rounded-lg bg-[#EEF4FF] border border-[#0055FF]/20 flex items-center justify-center text-[#0055FF]">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <div className="truncate">
            <h3 className="text-xs font-semibold text-[#09090B] tracking-tight truncate">
              {artifact.title}
            </h3>
            <div className="font-mono text-[9px] text-[#71717A] -mt-0.5 uppercase flex items-center gap-1.5">
              <span>SANDBOX RUNNER</span>
              <span>•</span>
              <span className="text-[#059669]">LIVE RENDER</span>
            </div>
          </div>
        </div>

        {/* Center: Tabs & Viewport Selector */}
        <div className="flex items-center gap-2">
          {/* Preview / Code Tabs */}
          <div className="flex items-center p-0.5 rounded-xl bg-[#F4F4F5] border border-[#E4E4E7]">
            <button
              type="button"
              onClick={() => setSandboxViewMode("preview")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                sandboxViewMode === "preview"
                  ? "bg-white text-[#09090B] lab-shadow-sm font-semibold"
                  : "text-[#71717A] hover:text-[#09090B]"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setSandboxViewMode("code")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                sandboxViewMode === "code"
                  ? "bg-white text-[#09090B] lab-shadow-sm font-semibold"
                  : "text-[#71717A] hover:text-[#09090B]"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span>Code</span>
            </button>
          </div>

          {/* Viewport switchers (only visible when in Preview mode) */}
          {sandboxViewMode === "preview" && (
            <div className="hidden md:flex items-center p-0.5 rounded-xl bg-[#F4F4F5] border border-[#E4E4E7]">
              <button
                type="button"
                onClick={() => setSandboxViewport("desktop")}
                title="Desktop Viewport"
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  sandboxViewport === "desktop"
                    ? "bg-white text-[#0055FF] lab-shadow-sm"
                    : "text-[#71717A] hover:text-[#09090B]"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setSandboxViewport("tablet")}
                title="Tablet Viewport (768px)"
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  sandboxViewport === "tablet"
                    ? "bg-white text-[#0055FF] lab-shadow-sm"
                    : "text-[#71717A] hover:text-[#09090B]"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setSandboxViewport("mobile")}
                title="Mobile Viewport (375px)"
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  sandboxViewport === "mobile"
                    ? "bg-white text-[#0055FF] lab-shadow-sm"
                    : "text-[#71717A] hover:text-[#09090B]"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Right: Actions (Refresh, Copy, Zip, Close) */}
        <div className="flex items-center gap-1.5">
          {sandboxViewMode === "preview" && (
            <button
              type="button"
              onClick={() => setIframeKey((k) => k + 1)}
              title="Refresh Preview"
              className="p-2 rounded-xl text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F5] transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#E4E4E7] hover:border-[#09090B] bg-white text-xs font-medium text-[#09090B] transition-all lab-shadow-sm cursor-pointer"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-[#059669]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-[#059669]">Copied</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 text-[#71717A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Copy Code</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0055FF] hover:bg-[#0047D6] text-white text-xs font-medium lab-shadow-glow transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">{isZipping ? "Packaging..." : "Download .zip"}</span>
          </button>

          {/* Close / Collapse Sandbox */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Sandbox"
            className="p-2 rounded-xl text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F5] transition-colors ml-1 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Sandbox Content Stage */}
      <div className="flex-1 overflow-auto bg-[#F7F7F9] flex flex-col items-center justify-start p-4 sm:p-6 min-h-0">
        {sandboxViewMode === "preview" ? (
          <div
            className={`w-full ${viewportWidthClass} h-full min-h-[500px] flex-1 bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden lab-shadow-md transition-all duration-300 relative flex flex-col`}
          >
            {/* Viewport Frame Header (Simulated Browser Tab) */}
            <div className="h-7 px-3 bg-[#FAFAFC] border-b border-[#E4E4E7] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#EF4444]/60" />
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]/60" />
                <span className="w-2 h-2 rounded-full bg-[#10B981]/60" />
              </div>
              <div className="font-mono text-[9px] text-[#A1A1AA] truncate">
                sandbox://localhost:3000/artifact/{artifact.id}
              </div>
              <div className="w-8" />
            </div>

            {/* Sandboxed Live iframe */}
            <iframe
              ref={iframeRef}
              key={iframeKey}
              srcDoc={buildSandboxHtml(artifact.code, artifact.language)}
              title={artifact.title}
              sandbox="allow-scripts allow-modals allow-same-origin"
              className="w-full h-full flex-1 border-0 bg-white"
            />
          </div>
        ) : (
          /* Code View Mode */
          <div className="w-full h-full bg-[#09090B] rounded-2xl border border-[#27272A] overflow-hidden lab-shadow-lg flex flex-col text-left">
            <div className="h-8 px-4 bg-[#18181B] border-b border-[#27272A] flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#A1A1AA] uppercase">
                {artifact.language.toUpperCase()} SOURCE
              </span>
              <span className="font-mono text-[9px] text-[#71717A]">
                {artifact.code.split("\n").length} lines
              </span>
            </div>
            <pre className="p-4 overflow-auto flex-1 font-mono text-xs text-[#F4F4F5] leading-relaxed selection:bg-[#0055FF]/30">
              <code>{artifact.code}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
