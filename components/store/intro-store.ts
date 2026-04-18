"use client"

import { useEffect, useState } from "react"

/**
 * Intro flow state:
 *   intro     → camera is at the back wall, ENTER button is visible,
 *               scroll is locked
 *   animating → ENTER was clicked; camera is animating backward from
 *               the back wall to the entrance; scroll is still locked
 *   active    → animation complete; normal scroll/drag navigation is
 *               available and the main UI chrome is visible
 */
export type IntroMode = "intro" | "animating" | "active"

let _mode: IntroMode = "intro"
const listeners = new Set<(m: IntroMode) => void>()

export function setIntroMode(m: IntroMode) {
  if (_mode === m) return
  _mode = m
  listeners.forEach((l) => l(m))
}

export function getIntroMode(): IntroMode {
  return _mode
}

export function useIntroMode(): IntroMode {
  const [value, setValue] = useState<IntroMode>(_mode)
  useEffect(() => {
    const h = (m: IntroMode) => setValue(m)
    listeners.add(h)
    // Sync in case _mode changed between module init and mount
    setValue(_mode)
    return () => {
      listeners.delete(h)
    }
  }, [])
  return value
}
