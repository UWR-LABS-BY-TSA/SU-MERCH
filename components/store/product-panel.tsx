"use client"

import { useEffect, useState } from "react"
import { X, Plus, Minus, ShoppingBag } from "lucide-react"
import { getProduct } from "@/lib/products"
import { addToCart, closeProduct, useCart } from "./cart-store"

export function ProductPanel() {
  const cart = useCart()
  const product = cart.openProductId ? getProduct(cart.openProductId) : null

  const [qty, setQty] = useState(1)
  const [size, setSize] = useState<string | undefined>(undefined)
  const [color, setColor] = useState<string | undefined>(undefined)
  const [justAdded, setJustAdded] = useState(false)

  useEffect(() => {
    if (product) {
      setQty(1)
      setSize(product.sizes?.[Math.floor((product.sizes.length - 1) / 2)])
      setColor(product.colors?.[0]?.label)
      setJustAdded(false)
    }
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
      {/* Backdrop */}
      <div
        onClick={closeProduct}
        className={`pointer-events-${open ? "auto" : "none"} fixed inset-0 z-20 bg-black/40 backdrop-blur-sm transition-opacity duration-300`}
        style={{ opacity: open ? 1 : 0 }}
      />

      {/* Panel */}
      <aside
        className={`pointer-events-${open ? "auto" : "none"} fixed right-0 top-0 z-30 flex h-full w-full max-w-md flex-col border-l border-accent/30 bg-[#1a1713] text-background shadow-[0_0_80px_rgba(0,0,0,0.6)] transition-transform duration-400`}
        style={{ transform: open ? "translateX(0)" : "translateX(100%)" }}
        aria-hidden={!open}
      >
        {product ? (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-accent/20 px-6 py-5">
              <div className="flex flex-col gap-1">
                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((t) => (
                      <span
                        key={t}
                        className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <h2 className="font-serif text-2xl font-semibold leading-tight text-background">
                  {product.name}
                </h2>
                <span className="font-mono text-sm text-background/80">
                  ${product.price.toFixed(0)}
                </span>
              </div>
              <button
                onClick={closeProduct}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-sm border border-background/20 text-background/70 transition hover:border-accent hover:text-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Visual — placeholder swatch block in brand colors */}
            <div className="relative flex h-56 items-center justify-center border-b border-accent/20 bg-gradient-to-br from-[#211812] to-[#0f0b08]">
              <div
                className="h-36 w-36 rounded-sm shadow-[0_12px_30px_rgba(0,0,0,0.5)]"
                style={{
                  backgroundColor:
                    product.colors?.find((c) => c.label === color)?.hex ||
                    product.colors?.[0]?.hex ||
                    "#3a2418",
                }}
              />
              <span className="absolute bottom-3 left-4 font-mono text-[9px] uppercase tracking-[0.3em] text-background/40">
                {product.type}
              </span>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <p className="font-sans text-sm leading-relaxed text-background/80">
                {product.description}
              </p>

              {product.colors && product.colors.length > 0 && (
                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-background/60">
                      Color
                    </span>
                    <span className="font-mono text-[11px] text-accent">{color}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((c) => {
                      const active = c.label === color
                      return (
                        <button
                          key={c.label}
                          onClick={() => setColor(c.label)}
                          aria-label={c.label}
                          className={`h-9 w-9 rounded-sm border transition ${
                            active ? "border-accent" : "border-background/20 hover:border-background/50"
                          }`}
                          style={{ backgroundColor: c.hex }}
                        />
                      )
                    })}
                  </div>
                </div>
              )}

              {product.sizes && product.sizes.length > 0 && (
                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-background/60">
                      Size
                    </span>
                    <button className="font-mono text-[10px] uppercase tracking-[0.2em] text-background/50 underline-offset-4 hover:underline">
                      Size chart
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s) => {
                      const active = s === size
                      return (
                        <button
                          key={s}
                          onClick={() => setSize(s)}
                          className={`min-w-[3rem] border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.2em] transition ${
                            active
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-background/20 text-background/70 hover:border-background/50"
                          }`}
                        >
                          {s}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <div className="mb-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-background/60">
                    Quantity
                  </span>
                </div>
                <div className="inline-flex items-center gap-0 border border-background/20">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="flex h-9 w-9 items-center justify-center text-background/70 transition hover:bg-background/10"
                    aria-label="Decrease"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="flex h-9 w-10 items-center justify-center font-mono text-sm text-background">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="flex h-9 w-9 items-center justify-center text-background/70 transition hover:bg-background/10"
                    aria-label="Increase"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer — add to bag */}
            <div className="border-t border-accent/20 px-6 py-4">
              <button
                onClick={() => {
                  addToCart({ productId: product.id, qty, size, color })
                  setJustAdded(true)
                  setTimeout(() => setJustAdded(false), 1600)
                }}
                className="group flex w-full items-center justify-center gap-3 rounded-sm bg-accent px-5 py-4 text-primary transition hover:bg-[#c79a47]"
              >
                <ShoppingBag className="h-4 w-4" />
                <span className="font-mono text-[11px] uppercase tracking-[0.3em]">
                  {justAdded ? "Added to bag" : `Add to bag · $${(product.price * qty).toFixed(0)}`}
                </span>
              </button>
            </div>
          </>
        ) : null}
      </aside>
    </>
  )
}
