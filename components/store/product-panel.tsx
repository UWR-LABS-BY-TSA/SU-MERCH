"use client"

import { useEffect, useMemo, useState } from "react"
import { X, Plus, Minus, ShoppingBag } from "lucide-react"
import { getProduct, type Product } from "@/lib/products"
import { addToCart, closeProduct, useCart } from "./cart-store"

/**
 * "Magical Microfiche" product panel.
 *
 * A centered slide-carrier modal that replaces the old right-slide panel.
 * Visual language: brass-trimmed academic archive viewer; illuminated
 * product "slide" with sepia vignette, scanline, and film-grain overlays;
 * Cormorant Garamond for titles and CTA, JetBrains Mono for the index-
 * card catalog rows. Opens with a flicker-in like a projector warming up.
 */
export function ProductPanel() {
  const cart = useCart()
  const product = cart.openProductId ? getProduct(cart.openProductId) : null

  const [qty, setQty] = useState(1)
  const [size, setSize] = useState<string | undefined>(undefined)
  const [color, setColor] = useState<string | undefined>(undefined)
  const [justAdded, setJustAdded] = useState(false)
  const [visibleRows, setVisibleRows] = useState(0)

  useEffect(() => {
    if (!product) return
    setQty(1)
    setSize(product.sizes?.[Math.floor((product.sizes.length - 1) / 2)])
    setColor(product.colors?.[0]?.label)
    setJustAdded(false)
    setVisibleRows(0)
    // Stagger reveal of the index-card rows — microfiche "loading in"
    const timers = [260, 420, 580, 740].map((delay, i) =>
      setTimeout(() => setVisibleRows(i + 1), delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [product])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeProduct()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const open = !!product

  return (
    <>
      {/* Backdrop — deep amber-black wash */}
      <div
        onClick={closeProduct}
        className={`${open ? "pointer-events-auto" : "pointer-events-none"} fixed inset-0 z-20 bg-[#0a0604]/85 backdrop-blur-sm transition-opacity duration-400`}
        style={{ opacity: open ? 1 : 0 }}
      />

      {/* Viewer — edge-to-edge fullscreen on mobile (under 640px),
          centered card with a cap on tablet/desktop. */}
      <aside
        className={`${open ? "pointer-events-auto" : "pointer-events-none"} fixed inset-0 z-30 flex items-stretch justify-center sm:items-center sm:p-4 md:p-8`}
        aria-hidden={!open}
        role="dialog"
      >
        {product && <MicroficheCarrier
          key={product.id}
          product={product}
          size={size}
          setSize={setSize}
          color={color}
          setColor={setColor}
          qty={qty}
          setQty={setQty}
          justAdded={justAdded}
          setJustAdded={setJustAdded}
          visibleRows={visibleRows}
        />}
      </aside>
    </>
  )
}

function MicroficheCarrier({
  product,
  size,
  setSize,
  color,
  setColor,
  qty,
  setQty,
  justAdded,
  setJustAdded,
  visibleRows,
}: {
  product: Product
  size: string | undefined
  setSize: (s: string) => void
  color: string | undefined
  setColor: (c: string) => void
  qty: number
  setQty: (updater: (q: number) => number) => void
  justAdded: boolean
  setJustAdded: (b: boolean) => void
  visibleRows: number
}) {
  // Deterministic "archive" catalog number + slide number from product id
  const { slideNum, catalogCode } = useMemo(() => {
    const hash = product.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
    const typePrefix = product.type.slice(0, 2).toUpperCase()
    return {
      slideNum: String((hash % 47) + 3).padStart(2, "0"),
      catalogCode: `SU-${typePrefix}-${String(hash % 1000).padStart(3, "0")}`,
    }
  }, [product])

  const indexRows: Array<{ label: string; value: string }> = useMemo(() => [
    { label: "CAT. NO.", value: catalogCode },
    { label: "MATERIAL", value: materialFor(product.type) },
    {
      label: "AVAILABLE",
      value: product.sizes?.join(" · ") ?? "ONE SIZE",
    },
    { label: "PRICE", value: `$${product.price}.00` },
  ], [product, catalogCode])

  const activeColorHex =
    product.colors?.find((c) => c.label === color)?.hex ||
    product.colors?.[0]?.hex ||
    "#93000B"

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-y-auto overflow-x-hidden bg-gradient-to-b from-[#3a0410] via-[#2a0208] to-[#14100c] text-[#f1e6c8] animate-microfiche-open sm:h-auto sm:max-h-[94vh] sm:max-w-[640px] sm:rounded-sm sm:border sm:border-[#FFB100]/40 sm:shadow-[0_0_90px_rgba(147,0,11,0.35),0_20px_60px_rgba(0,0,0,0.75)]"
      style={{
        // Respect iOS safe areas on notched devices (notch + home indicator)
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* ===== Burgundy header bar (gold trim, matches store palette) ===== */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#FFB100]/45 bg-gradient-to-r from-[#5a0810] via-[#7a0a14] to-[#5a0810] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,177,0,0.25),inset_0_-1px_0_rgba(0,0,0,0.4)] sm:px-5 sm:py-2.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#FFB100] sm:tracking-[0.35em]">
          ⚜ Hall of Artifacts
        </span>
        <span className="hidden font-mono text-[9px] uppercase tracking-[0.3em] text-[#FFB100]/75 sm:block">
          Slide {slideNum} / 47
        </span>
        <button
          onClick={closeProduct}
          aria-label="Close"
          className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#FFB100] transition hover:bg-[#FFB100]/15 sm:h-6 sm:w-6"
        >
          <X className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
        </button>
      </div>

      {/* ===== Slide carrier ===== */}
      <div className="relative border-b border-[#FFB100]/25 bg-[#14100c] px-4 pb-3 pt-4 sm:px-8 sm:pb-4 sm:pt-5 md:px-12">
        {/* Sprocket holes — top */}
        <SprocketRow />

        {/* The illuminated slide — dark charcoal with a warm gold backlight.
            Mobile: 38vh caps the image so header + info + CTA still fit on
            shorter phones. sm/md go back to fixed heights. */}
        <div className="relative mt-3 h-[38vh] max-h-64 overflow-hidden border border-[#FFB100]/50 bg-gradient-to-br from-[#3a0410] to-[#14100c] sm:h-56 md:h-64">
          {/* Warm gold backlight — the projector bulb shining through */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,177,0,0.22)_0%,rgba(255,177,0,0.06)_45%,transparent_75%)]" />

          {/* Product image or color swatch */}
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="relative z-10 mx-auto h-full w-auto object-contain"
              style={{ filter: "contrast(1.05) brightness(1.02)" }}
            />
          ) : (
            <div className="relative z-10 flex h-full items-center justify-center">
              <div
                className="h-28 w-28 rounded-sm shadow-[0_12px_30px_rgba(0,0,0,0.5)] sm:h-32 sm:w-32"
                style={{ backgroundColor: activeColorHex }}
              />
            </div>
          )}

          {/* Vignette */}
          <div className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.55)_100%)]" />

          {/* Subtle film grain */}
          <div
            className="pointer-events-none absolute inset-0 z-30 opacity-[0.12] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
            }}
          />
        </div>

        {/* Sprocket holes — bottom */}
        <div className="mt-3">
          <SprocketRow />
        </div>

        {/* Caption */}
        <div className="mt-2 text-center">
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#c89232]">
            FIG. {slideNum} · {product.type}
          </span>
        </div>
      </div>

      {/* ===== Info card ===== */}
      <div className="flex flex-1 flex-col px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6">
        {/* Title */}
        <h2 className="mb-4 font-serif text-xl font-medium italic leading-tight text-[#ffd98a] sm:mb-5 sm:text-2xl md:text-3xl">
          {product.name}
        </h2>

        {/* Index card rows — type in sequentially. On narrow phones the
            label column is shrunken so long values don't get squeezed. */}
        <div className="mb-5 divide-y divide-[#FFB100]/15 border-y border-[#FFB100]/25 sm:mb-6">
          {indexRows.map((row, i) => (
            <div
              key={row.label}
              className="flex items-baseline gap-3 py-2 font-mono text-[10px] transition-all duration-300 sm:gap-4 md:text-[11px]"
              style={{
                opacity: visibleRows > i ? 1 : 0,
                transform: visibleRows > i ? "translateX(0)" : "translateX(-6px)",
              }}
            >
              <span className="w-20 shrink-0 uppercase tracking-[0.2em] text-[#c89232] sm:w-24 sm:tracking-[0.25em]">
                {row.label}
              </span>
              <span className="min-w-0 break-words uppercase tracking-[0.15em] text-[#f1e6c8]">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Colorway */}
        {product.colors && product.colors.length > 0 && (
          <div className="mb-4 sm:mb-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#c89232]">
                Colorway
              </span>
              <span className="font-serif text-xs italic text-[#ffd98a]">
                {color}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((c) => {
                const active = c.label === color
                return (
                  <button
                    key={c.label}
                    onClick={() => setColor(c.label)}
                    aria-label={c.label}
                    className={`h-9 w-9 rounded-full border transition sm:h-7 sm:w-7 ${
                      active
                        ? "border-[#FFB100] shadow-[0_0_10px_rgba(255,177,0,0.55)]"
                        : "border-[#FFB100]/30 hover:border-[#FFB100]/60"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Measurement (sizes) */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="mb-4 sm:mb-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#c89232]">
                Measurement
              </span>
              <span className="font-serif text-xs italic text-[#ffd98a]">
                {size}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {product.sizes.map((s) => {
                const active = s === size
                return (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`min-w-[2.75rem] border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] transition sm:py-1.5 ${
                      active
                        ? "border-[#FFB100] bg-[#FFB100]/10 text-[#ffd98a]"
                        : "border-[#FFB100]/25 text-[#f1e6c8]/70 hover:border-[#FFB100]/50"
                    }`}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Copies (quantity) */}
        <div className="mb-4 sm:mb-5">
          <div className="mb-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#c89232]">
              Copies
            </span>
          </div>
          <div className="inline-flex items-center gap-0 border border-[#FFB100]/25">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex h-10 w-10 items-center justify-center text-[#f1e6c8]/80 transition hover:bg-[#FFB100]/10 sm:h-8 sm:w-8"
              aria-label="Decrease"
            >
              <Minus className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
            </button>
            <span className="flex h-10 w-12 items-center justify-center font-mono text-sm text-[#ffd98a] sm:h-8 sm:w-10">
              {qty}
            </span>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="flex h-10 w-10 items-center justify-center text-[#f1e6c8]/80 transition hover:bg-[#FFB100]/10 sm:h-8 sm:w-8"
              aria-label="Increase"
            >
              <Plus className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
            </button>
          </div>
        </div>

        {/* Flavor description — small, muted */}
        <p className="mb-5 font-serif text-xs italic leading-relaxed text-[#f1e6c8]/70 md:text-sm">
          {product.description}
        </p>

        {/* Request button — sticks to the bottom of the info card on mobile
            (via mt-auto) so it's always reachable without scrolling. */}
        <button
          onClick={() => {
            addToCart({ productId: product.id, qty, size, color })
            setJustAdded(true)
            setTimeout(() => setJustAdded(false), 1800)
          }}
          className="group relative mt-auto flex w-full items-center justify-center gap-3 overflow-hidden rounded-sm border-2 border-[#FFB100]/60 bg-[#FFB100]/5 px-5 py-4 transition hover:border-[#FFB100] hover:bg-[#FFB100]/15 sm:py-3.5"
        >
          <ShoppingBag className="h-4 w-4 text-[#ffd98a] transition group-hover:scale-110 sm:h-3.5 sm:w-3.5" />
          <span className="font-serif text-sm italic tracking-[0.2em] text-[#ffd98a]">
            {justAdded
              ? "Requested from the archive"
              : `Request · $${(product.price * qty).toFixed(0)}`}
          </span>
        </button>
      </div>
    </div>
  )
}

function SprocketRow() {
  return (
    <div className="flex justify-between">
      {Array.from({ length: 16 }).map((_, i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-[#FFB100]/55 shadow-[0_0_3px_rgba(255,177,0,0.35)]"
        />
      ))}
    </div>
  )
}

function materialFor(type: string): string {
  const map: Record<string, string> = {
    hoodie: "14-oz cotton fleece",
    tee: "220-gsm ringspun cotton",
    mug: "Vitreous enamel",
    cap: "6-panel cotton twill",
    tote: "12-oz duck canvas",
    keychain: "Solid brass",
  }
  return (map[type] ?? "Mixed goods").toUpperCase()
}
