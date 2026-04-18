"use client"

import { useEffect, useState } from "react"

let _scroll = 0
const listeners = new Set<(v: number) => void>()

let _scrollEl: HTMLElement | null = null

export function setScrollOffset(v: number) {
  if (_scroll === v) return
  _scroll = v
  listeners.forEach((l) => l(v))
}

export function getScrollOffset() {
  return _scroll
}

export function setScrollEl(el: HTMLElement | null) {
  _scrollEl = el
  if (typeof window !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).__scrollEl = el
  }
}

export function scrollToPct(pct: number, smooth = true) {
  if (!_scrollEl) return
  const clamped = Math.max(0, Math.min(1, pct))
  const max = _scrollEl.scrollHeight - _scrollEl.clientHeight
  const targetTop = clamped * max

  if (!smooth) {
    _scrollEl.scrollTop = targetTop
    setScrollOffset(clamped)
    return
  }

  const el = _scrollEl
  const startTop = el.scrollTop
  const duration = 600
  const startTime = performance.now()
  const step = (now: number) => {
    const t = Math.min(1, (now - startTime) / duration)
    const eased = t * t * (3 - 2 * t)
    el.scrollTop = startTop + (targetTop - startTop) * eased
    setScrollOffset(el.scrollTop / max)
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

/**
 * Animate scroll over a custom duration with an ease-out curve and an
 * optional completion callback. Used by the intro to sweep from the
 * hero reveal (pct=1) back to the entrance (pct=0) over ~4 seconds.
 */
export function scrollAnimate(
  toPct: number,
  durationMs: number,
  onComplete?: () => void
) {
  if (!_scrollEl) return
  const el = _scrollEl
  const clamped = Math.max(0, Math.min(1, toPct))
  const max = el.scrollHeight - el.clientHeight
  const targetTop = clamped * max
  const startTop = el.scrollTop
  const startTime = performance.now()
  const step = (now: number) => {
    const t = Math.min(1, (now - startTime) / durationMs)
    // Cubic ease-out — fast start, slow landing (feels cinematic)
    const eased = 1 - Math.pow(1 - t, 3)
    el.scrollTop = startTop + (targetTop - startTop) * eased
    setScrollOffset(el.scrollTop / max)
    if (t < 1) {
      requestAnimationFrame(step)
    } else {
      onComplete?.()
    }
  }
  requestAnimationFrame(step)
}

export function useScrollOffset() {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const handler = (v: number) => setValue(v)
    listeners.add(handler)
    return () => {
      listeners.delete(handler)
    }
  }, [])
  return value
}
