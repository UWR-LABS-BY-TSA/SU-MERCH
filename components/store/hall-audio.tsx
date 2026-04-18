"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Volume2, VolumeX } from "lucide-react"

/**
 * Cathedral-pad ambient — soft, airy major chord that breathes.
 *
 * Design:
 *  - Five sine voices tuned to a C major chord (C2 E2 G2 C3 G3).
 *    Sines only — triangles and squares add harmonics that read
 *    as "buzz" in a low drone.
 *  - Each voice has its own slow pitch LFO (0.15–0.4 Hz, ±6 cents)
 *    so the voices drift in and out of unison — gives the cloud-of-
 *    strings/choir shimmer without external samples.
 *  - Routed through a warm lowpass (1.2 kHz).
 *  - A feedback-delay network provides a reverb-like tail
 *    (0.35 s delay, 45% feedback) without an impulse-response file.
 *  - Master gain target ~0.035 (very quiet). A slow gain LFO at
 *    0.06 Hz adds a ~17 s breathing swell.
 *  - Long fades on start/stop prevent clicks.
 */
export function HallAudio() {
  const [enabled, setEnabled] = useState(false)
  const ctxRef = useRef<AudioContext | null>(null)
  const nodesRef = useRef<{
    oscs: OscillatorNode[]
    master: GainNode
  } | null>(null)

  const start = useCallback(() => {
    if (ctxRef.current) return
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    ctxRef.current = ctx

    // --- master bus ---
    const master = ctx.createGain()
    master.gain.value = 0 // silent start; fade in below
    master.connect(ctx.destination)

    // breathing LFO on the master gain — slow swell
    const swellLfo = ctx.createOscillator()
    swellLfo.type = "sine"
    swellLfo.frequency.value = 0.06
    const swellDepth = ctx.createGain()
    swellDepth.gain.value = 0.008 // ±0.008 around the master target
    swellLfo.connect(swellDepth).connect(master.gain)
    swellLfo.start()

    // --- warmth filter ---
    const filter = ctx.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.value = 1200
    filter.Q.value = 0.5
    filter.connect(master)

    // --- feedback-delay network (fake reverb tail) ---
    const delay = ctx.createDelay(2)
    delay.delayTime.value = 0.35
    const feedback = ctx.createGain()
    feedback.gain.value = 0.45 // stable tail
    const wetGain = ctx.createGain()
    wetGain.gain.value = 0.55

    // tap: filter -> delay -> [feedback loop] -> wetGain -> master
    filter.connect(delay)
    delay.connect(feedback)
    feedback.connect(delay)
    delay.connect(wetGain)
    wetGain.connect(master)

    // --- voices: C major chord ---
    const voices: Array<{ freq: number; gain: number; lfoRate: number; lfoDepth: number }> = [
      { freq: 65.41, gain: 0.32, lfoRate: 0.19, lfoDepth: 5 }, // C2
      { freq: 82.41, gain: 0.24, lfoRate: 0.24, lfoDepth: 6 }, // E2
      { freq: 98.0, gain: 0.24, lfoRate: 0.21, lfoDepth: 5 }, // G2
      { freq: 130.81, gain: 0.16, lfoRate: 0.28, lfoDepth: 7 }, // C3
      { freq: 196.0, gain: 0.1, lfoRate: 0.33, lfoDepth: 8 }, // G3 (brightness)
    ]

    const oscs: OscillatorNode[] = []
    voices.forEach((v, i) => {
      const osc = ctx.createOscillator()
      osc.type = "sine"
      osc.frequency.value = v.freq
      // static detune spread — keeps voices from perfectly phase-locking
      osc.detune.value = ((i % 2 === 0 ? 1 : -1) * (3 + i)) // ±3..7 cents

      const g = ctx.createGain()
      g.gain.value = v.gain

      // per-voice slow pitch LFO for chorus drift
      const vLfo = ctx.createOscillator()
      vLfo.type = "sine"
      vLfo.frequency.value = v.lfoRate
      const vLfoGain = ctx.createGain()
      vLfoGain.gain.value = v.lfoDepth
      vLfo.connect(vLfoGain).connect(osc.detune)
      vLfo.start()

      osc.connect(g).connect(filter)
      osc.start()
      oscs.push(osc, vLfo)
    })
    oscs.push(swellLfo)

    // gentle 3.5 s fade-in to avoid any click
    master.gain.cancelScheduledValues(ctx.currentTime)
    master.gain.setValueAtTime(0, ctx.currentTime)
    master.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 3.5)

    nodesRef.current = { oscs, master }
  }, [])

  const stop = useCallback(() => {
    const ctx = ctxRef.current
    const nodes = nodesRef.current
    if (!ctx || !nodes) return
    const now = ctx.currentTime
    nodes.master.gain.cancelScheduledValues(now)
    nodes.master.gain.setValueAtTime(nodes.master.gain.value, now)
    nodes.master.gain.linearRampToValueAtTime(0, now + 1.2)
    // tear down slightly after the fade completes
    const disposeDelayMs = 1300
    setTimeout(() => {
      nodes.oscs.forEach((o) => {
        try {
          o.stop()
        } catch {
          /* already stopped */
        }
      })
      ctx.close().catch(() => {})
      ctxRef.current = null
      nodesRef.current = null
    }, disposeDelayMs)
  }, [])

  useEffect(() => {
    if (enabled) start()
    else stop()
    return () => stop()
  }, [enabled, start, stop])

  return (
    <button
      onClick={() => setEnabled((e) => !e)}
      aria-label={enabled ? "Mute ambient" : "Play ambient"}
      title={enabled ? "Mute ambient" : "Play ambient"}
      className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-background/25 bg-background/5 text-background/80 backdrop-blur-md transition hover:border-accent hover:text-accent"
    >
      {enabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
    </button>
  )
}
