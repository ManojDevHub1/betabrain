# 🧠 BetaBrain // In-Browser Local AI Engine

<div align="center">
  <img src="https://via.placeholder.com/d:\BetaBrain\emage\Screenshot 2026-10-09 120614.png1200x400?text=BetaBrain+Cinematic+Banner" alt="BetaBrain Banner" />
</div>

> **A cinematic, zero-latency, 100% private AI software architect that executes entirely on your local GPU inside the browser.**

Most modern "AI clients" are thin API wrappers that forward your prompts to centralized cloud data centers—charging monthly subscriptions, incurring network latency, and storing private code on third-party servers.

**BetaBrain is fundamentally different.** It is an enterprise-grade AI software builder that runs **100% in-browser on client silicon**. Powered by **WebGPU** and `@mlc.ai/web-llm`, quantized neural weights (such as Qwen 2.5 Coder) are executed directly on your dedicated graphics hardware, then cached locally in browser `IndexedDB`.

---

## ✨ Signature Features

*   **⚡ 100% Client-Side WebGPU Acceleration:** Direct hardware execution via WebGPU WGSL compute shaders. Zero HTTP round-trips to external model inference APIs.
*   **🛠️ The Artifacts Sandbox (Live Code Execution):** BetaBrain doesn't just generate code—it executes and previews it in real time. Interactive HTML5, CSS3, JavaScript, and React UI components are automatically extracted and rendered into an isolated split-screen sandbox.
*   **🎛️ Hardware Profiler & VRAM Calibration:** Browsers cannot read physical GPU VRAM directly. BetaBrain features a dedicated onboarding modal with conservative fallback estimation to recommend the optimal coding model (from 4GB mobile GPUs to 24GB+ workstations).
*   **💾 Zero-Database Air-Gapped Persistence:** Session history, workspace tabs, and user configuration are managed through reactive client-side Zustand stores backed by `localStorage`. No database setup, no cloud syncing, no telemetry tracking.
*   **🎨 "Clinical White Lab" Aesthetic:** Diverges from dark, terminal-heavy hacker clichés. The interface is styled around a hyper-modern, sterile laboratory aesthetic with buttery-smooth Framer Motion choreography.

---

## 🏗️ Tech Stack & Architecture

*   **Framework:** Next.js (App Router), React 19
*   **AI Engine:** `@mlc.ai/web-llm` (WebGPU)
*   **Styling:** Tailwind CSS v4
*   **Motion & Physics:** Motion for React (Framer Motion), Lenis (Smooth Scrolling)
*   **State Management:** Zustand (with localStorage persistence)
*   **Markdown Parsing:** `react-markdown` & `react-syntax-highlighter`

---

## 🚀 Getting Started

Experience BetaBrain locally on your machine. Ensure your browser supports WebGPU (Chrome/Edge 113+).

### 1. Clone the repository
`bash
git clone https://github.com/ManojDevHub1/betabrain.git
cd betabrain
`

### 2. Install dependencies
`bash
npm install
`

### 3. Run the Neural Core
`bash
npm run dev
`
Open `http://localhost:3000` in your browser.

> **Note on Initial Boot:** Upon launching BetaBrain for the first time, the "Crystalline Fill" sequence will cache the model weights directly from Hugging Face into your browser's `IndexedDB` (~1.5GB to 4GB depending on your VRAM tier). Subsequent loads will be instant and fully offline-capable.

---

## 🔒 Security & Privacy

**BetaBrain operates in a strict Clean Room environment:**
*   **Zero Cloud Latency:** No API keys required.
*   **100% Air-Gapped Privacy:** Your proprietary source code and telemetry never leave your machine.
*   **Persistent Offline Caching:** Once downloaded, the application runs entirely offline.

---

## 👨‍💻 Developer & Creator

Developed with precision by **Manoj in Beta** 
*   **GitHub:** [@ManojDevHub1](https://github.com/ManojDevHub1)
*   *Part of a high-utility engineering series dedicated to building privacy-first, edge-native developer tooling.*
