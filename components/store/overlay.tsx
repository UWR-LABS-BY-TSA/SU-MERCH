"use client"

import { ShoppingBag, Search, Menu, ChevronDown } from "lucide-react"
import { useScrollOffset, scrollToPct } from "./scroll-store"
import { ProductPanel } from "./product-panel"
import { cartCount, useCart } from "./cart-store"

const SECTIONS = [
  { label: "Entrance", at: 0 },
  { label: "Hoodies", at: 0.22 },
  { label: "Tees", at: 0.4 },
  { label: "Accessories", at: 0.6 },
  { label: "Hero", at: 1 },
] as const

const NAV_LINKS: Array<{ label: string; at: number }> = [
  { label: "Entrance", at: 0 },
  { label: "Hoodies", at: 0.22 },
  { label: "Tees", at: 0.4 },
  { label: "Accessories", at: 0.6 },
  { label: "Lookbook", at: 1 },
]

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
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <div className="pointer-events-auto flex items-center gap-3">
          <button
            onClick={() => scrollToPct(0)}
            className="flex h-10 w-10 items-center justify-center rounded-sm border border-accent/60 bg-background/80 backdrop-blur-md transition hover:border-accent"
            aria-label="Home"
          >
            <span className="font-serif text-lg font-bold tracking-tight text-primary">SU</span>
          </button>
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="font-serif text-sm font-semibold tracking-wide text-background/95 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
              STREAMER UNIVERSITY
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
              The Campus Store
            </span>
          </div>
        </div>

        <nav className="pointer-events-auto hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((item) => (
            <button
              key={item.label}
              onClick={() => scrollToPct(item.at)}
              className="font-mono text-[11px] uppercase tracking-[0.25em] text-background/90 transition hover:text-accent drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            aria-label="Search"
            className="flex h-10 w-10 items-center justify-center rounded-sm border border-background/30 bg-background/10 text-background backdrop-blur-md transition hover:border-accent hover:bg-background/20"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            aria-label="Bag"
            className="relative flex h-10 items-center gap-2 rounded-sm border border-background/30 bg-background/10 px-3 text-background backdrop-blur-md transition hover:border-accent hover:bg-background/20"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="font-mono text-[11px] uppercase tracking-[0.2em]">
              Bag · {bagCount}
            </span>
            {bagCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-primary">
                {bagCount}
              </span>
            )}
          </button>
          <button
            aria-label="Menu"
            className="flex h-10 w-10 items-center justify-center rounded-sm border border-background/30 bg-background/10 text-background backdrop-blur-md transition hover:border-accent hover:bg-background/20 md:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Center hero title (fades out on scroll) */}
      <div
        className="pointer-events-none flex flex-1 flex-col items-center justify-center px-6 text-center transition-opacity duration-500"
        style={{ opacity: Math.max(0, 1 - scrollPct * 8) }}
      >
        <span className="mb-6 font-mono text-[11px] uppercase tracking-[0.4em] text-accent drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
          — The Official Campus Store —
        </span>
        <h1 className="font-serif text-5xl font-semibold leading-[0.95] text-background drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)] md:text-7xl lg:text-[8rem]">
          Streamer
          <br />
          <span className="italic text-accent">University</span>
        </h1>
        <p className="mt-8 max-w-md font-sans text-sm leading-relaxed text-background/85 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] md:text-base">
          Step inside the bookstore. An immersive walk through the collegiate merch hall — hoodies on the rack,
          mugs on the pegboard, pennants overhead.
        </p>
      </div>

      {/* Section indicator (clickable) */}
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
                className={`font-mono text-[10px] uppercase tracking-[0.3em] transition-colors drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)] ${
                  active ? "text-accent" : "text-background/50 hover:text-background/80"
                }`}
              >
                {String(i + 1).padStart(2, "0")} · {s.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Scroll hint (visible initially) */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-2 transition-opacity duration-500"
        style={{ opacity: Math.max(0, 1 - scrollPct * 20) }}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-background/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
          Scroll to enter
        </span>
        <ChevronDown className="h-4 w-4 animate-bounce text-accent drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]" />
      </div>

      {/* Product detail panel */}
      <ProductPanel />

      {/* Drag-to-peek hint */}
      <div
        className="pointer-events-none absolute bottom-28 left-1/2 flex -translate-x-1/2 items-center gap-2 transition-opacity duration-500"
        style={{ opacity: started && scrollPct < 0.9 ? 0.7 : 0 }}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-background/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
          Scroll or drag to walk
        </span>
      </div>

      {/* Right side — current section label */}
      <div
        className="pointer-events-none absolute right-6 top-1/2 flex -translate-y-1/2 flex-col items-end gap-1 transition-opacity duration-500 md:right-10"
        style={{ opacity: started ? 1 : 0 }}
      >
        <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-background/60 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
          Now viewing
        </span>
        <span className="font-serif text-2xl font-semibold italic text-accent drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] md:text-3xl">
          {currentSection}
        </span>
        <div className="mt-2 h-[1px] w-24 bg-gradient-to-r from-transparent to-accent" />
        <span className="mt-2 font-mono text-[10px] uppercase tracking-[0.3em] text-background/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
          {String(Math.round(scrollPct * 100)).padStart(2, "0")}%
        </span>
      </div>

      {/* Bottom info bar */}
      <footer className="flex items-end justify-between px-6 pb-6 md:px-10 md:pb-8">
        <div className="pointer-events-auto flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-background/70 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
            Collection 001
          </span>
          <span className="font-serif text-lg font-medium text-background drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)] md:text-xl">
            Fall Semester &apos;24
          </span>
        </div>

        <button
          onClick={() => scrollToPct(0.3)}
          className="pointer-events-auto group flex items-center gap-3 rounded-sm border border-accent/70 bg-accent/10 px-5 py-3 text-background backdrop-blur-md transition hover:bg-accent hover:text-primary"
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.3em]">Enter the store</span>
          <span className="font-mono text-[11px]">→</span>
        </button>

        <div className="pointer-events-auto hidden flex-col items-end gap-1 md:flex">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-background/70 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
            streameruniversity.com
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
            by Kai Cenat
          </span>
        </div>
      </footer>
    </div>
  )
}
