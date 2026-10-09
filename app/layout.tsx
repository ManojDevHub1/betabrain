import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { MotionConfig } from "motion/react";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Cursor } from "@/components/Cursor";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "BetaBrain // The Clean Room | Manoj in Beta",
  description:
    "Clinical, zero-latency in-browser local AI client running directly on your GPU via WebGPU. 100% private neural weight caching in IndexedDB.",
  keywords: [
    "BetaBrain",
    "Manoj in Beta",
    "WebGPU LLM",
    "WebLLM",
    "In-Browser AI",
    "The Clean Room",
    "Private AI",
  ],
  authors: [{ name: "Manoj in Beta" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self' app: file:; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' app: https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' app: https://fonts.googleapis.com; font-src 'self' app: data: https://fonts.gstatic.com; img-src 'self' app: data: blob: https:; connect-src 'self' app: blob: data: https://huggingface.co https://*.huggingface.co https://cdn-lfs.huggingface.co https://*.hf.co https://raw.githubusercontent.com https://github.com http://localhost:* ws://localhost:*; worker-src 'self' blob:; child-src 'self' blob:; frame-src 'self' data: blob:; object-src 'none'; base-uri 'self'; form-action 'self';"
        />
      </head>
      <body className="bg-[#F7F7F9] text-[#09090B] font-sans antialiased selection:bg-[#0055FF] selection:text-white">
        {/* Accessibility Skip Link */}
        <a
          href="#clean-canvas"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100000] focus:px-4 focus:py-2 focus:bg-[#0055FF] focus:text-white focus:text-xs font-medium rounded-lg"
        >
          Skip to Clean Canvas
        </a>

        {/* Global Motion Configuration with user reducedMotion preference */}
        <MotionConfig reducedMotion="user">
          <SmoothScroll>
            <Cursor />
            {children}
          </SmoothScroll>
        </MotionConfig>
      </body>
    </html>
  );
}
