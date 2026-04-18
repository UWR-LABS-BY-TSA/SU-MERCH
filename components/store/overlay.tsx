"use client"

import Image from "next/image"
import Link from "next/link"
import { ShoppingBag, ChevronDown } from "lucide-react"
import { useScrollOffset, scrollToPct } from "./scroll-store"
import { ProductPanel } from "./product-panel"
import { cartCount, useCart } from "./cart-store"
import { HallAudio } from "./hall-audio"

const SECTIONS = [
  { label: "The Grand Foyer", at: 0 },
  { label: "The Cloakroom", at: 0.22 },
  { label: "The Common Room", at: 0.4 },
  { label: "The Armoury", at: 0.6 },
  { label: "The Hall of Honor", at: 1 },
] as const

export function Overlay() {
  const scrollPct = useScrollOffset()
  const cart = useCart()
  const bagCount = cartCount(cart)
  const started = scrollPct > 0.02

  const currentSection = SECTIONS.reduce(
    (acc, s) => (scrollPct >= s.at - 0.05 ? s.label : acc),
    SECTIONS[0].label as string
  )

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col">
      {/* ===== Top bar — minimal: crest home-link + bag + audio ===== */}
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <Link
          href="/"
          aria-label="Back to the gates"
          className="pointer-events-auto group relative flex h-11 w-11 items-center justify-center rounded-full border border-accent/50 bg-background/10 backdrop-blur-md transition hover:border-accent hover:bg-background/20"
        >
          <Image
            src="/SUCREST.PNG"
            alt=""
            width={28}
            height={28}
            className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
          />
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-serif text-[10px] italic tracking-[0.2em] text-background/0 transition group-hover:text-background/80">
            back to the gates
          </span>
        </Link>

        <div className="pointer-events-auto flex items-center gap-2">
          <HallAudio />
          <button
            aria-label={`Bag · ${bagCount} item${bagCount === 1 ? "" : "s"}`}
            className="relative flex h-9 items-center gap-2 rounded-full border border-background/25 bg-background/5 px-3 text-background/80 backdrop-blur-md transition hover:border-accent hover:text-accent"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em]">{bagCount}</span>
            {bagCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-primary">
                {bagCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ===== Center tagline (fades out on scroll) ===== */}
      <div
        className="pointer-events-none flex flex-1 flex-col items-center justify-center px-6 text-center transition-opacity duration-500"
        style={{ opacity: Math.max(0, 1 - scrollPct * 8) }}
      >
        <span className="mb-4 font-serif text-[11px] uppercase tracking-[0.5em] text-accent drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] md:text-[12px]">
          — Class of 2026 —
        </span>
        <p className="max-w-md font-serif text-base italic leading-relaxed text-background/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] md:text-xl">
          Step through the torchlit hall.
        </p>
      </div>

      {/* ===== Left-side section rail (primary nav) ===== */}
      <div
        className="pointer-events-auto absolute left-6 top-1/2 hidden -translate-y-1/2 flex-col gap-3 transition-opacity duration-500 md:flex md:left-10"
        style={{ opacity: started ? 1 : 0 }}
      >
        {SECTIONS.map((s, i) => {
          const active = currentSection === s.label
          return (
            <button
              key={s.label}
              onClick={() => scrollToPct(s.at)}
              className="flex items-center gap-3 text-left"
            >
              <span
                className={`h-[1px] transition-all duration-300 ${
                  active ? "w-10 bg-accent" : "w-4 bg-background/40"
                }`}
              />
              <span
                className={`font-serif text-[12px] tracking-[0.2em] transition-colors drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)] ${
                  active ? "text-accent italic" : "text-background/50 hover:text-background/80"
                }`}
              >
                {String(i + 1).padStart(2, "0")} · {s.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* ===== Initial scroll/drag hint (fades out once the user moves) ===== */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-10 flex flex-col items-center gap-2 transition-opacity duration-500"
        style={{ opacity: Math.max(0, 1 - scrollPct * 20) }}
      >
        <span className="font-serif text-[12px] italic tracking-[0.25em] text-background/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
          scroll or drag to walk
        </span>
        <ChevronDown className="h-4 w-4 animate-bounce text-accent drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]" />
      </div>

      {/* ===== Product detail panel (slide-in) ===== */}
      <ProductPanel />
    </div>
  )
}
