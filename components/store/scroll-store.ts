"use client"

import { useEffect, useState } from "react"

let _scroll = 0
const listeners = new Set<(v: number) => void>()

let _scrollEl: HTMLElement | null = null

type CamState = { x: number; z: number; yaw: number }
let _cam: CamState = { x: 0, z: 9, yaw: 0 }
const camListeners = new Set<(v: CamState) => void>()

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

export function setCamState(x: number, z: number, yaw: number) {
  if (_cam.x === x && _cam.z === z && _cam.yaw === yaw) return
  _cam = { x, z, yaw }
  camListeners.forEach((l) => l(_cam))
}

export function useCamState() {
  const [value, setValue] = useState<CamState>(_cam)
  useEffect(() => {
    const handler = (v: CamState) => setValue(v)
    camListeners.add(handler)
    return () => {
      camListeners.delete(handler)
    }
  }, [])
  return value
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
