"use client"

import dynamic from "next/dynamic"
import { Overlay } from "@/components/store/overlay"

// Disable SSR for the 3D canvas — three.js / WebGL is client-only.
const StoreCanvas = dynamic(() => import("@/components/store/canvas"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-[#14100c]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <span className="font-serif text-[13px] italic tracking-[0.3em] text-accent">
          Lighting the torches...
        </span>
      </div>
    </div>
  ),
})

export default function Page() {
  return (
    <main
      className="relative h-screen w-screen overflow-hidden bg-[#14100c]"
      style={{ cursor: "url('/wand.cur'), auto" }}
    >
      <StoreCanvas />
      <Overlay />

      {/* Vignette for cinematic feel */}
      <div className="pointer-events-none fixed inset-0 z-[5] bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.55)_100%)]" />

      {/* Subtle film grain (optional, CSS only) */}
      <div
        className="pointer-events-none fixed inset-0 z-[6] opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />
    </main>
  )
}
