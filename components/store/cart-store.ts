"use client"

import { useEffect, useState } from "react"

export type CartLine = {
  productId: string
  qty: number
  size?: string
  color?: string
}

type CartState = {
  lines: CartLine[]
  openProductId: string | null
}

let _state: CartState = { lines: [], openProductId: null }
const listeners = new Set<(s: CartState) => void>()

function emit() {
  listeners.forEach((l) => l(_state))
}

export function openProduct(id: string) {
  _state = { ..._state, openProductId: id }
  emit()
}

export function closeProduct() {
  _state = { ..._state, openProductId: null }
  emit()
}

export function addToCart(line: CartLine) {
  const existingIdx = _state.lines.findIndex(
    (l) => l.productId === line.productId && l.size === line.size && l.color === line.color
  )
  let lines
  if (existingIdx >= 0) {
    lines = _state.lines.map((l, i) => (i === existingIdx ? { ...l, qty: l.qty + line.qty } : l))
  } else {
    lines = [..._state.lines, line]
  }
  _state = { ..._state, lines }
  emit()
}

export function removeFromCart(idx: number) {
  _state = { ..._state, lines: _state.lines.filter((_, i) => i !== idx) }
  emit()
}

export function useCart() {
  const [value, setValue] = useState(_state)
  useEffect(() => {
    const h = (s: CartState) => setValue(s)
    listeners.add(h)
    return () => {
      listeners.delete(h)
    }
  }, [])
  return value
}

export function cartCount(state: CartState = _state) {
  return state.lines.reduce((n, l) => n + l.qty, 0)
}
