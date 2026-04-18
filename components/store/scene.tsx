"use client"

import { useEffect, useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { useScroll, Text, Environment, useTexture, Stars } from "@react-three/drei"
import * as THREE from "three"
import {
  PALETTE,
  GarmentRack,
  Pegboard,
  CeilingLamp,
  Bookshelf,
  Pedestal,
  HangingGarment,
  FloatingCandles,
  WoodenBench,
  TomeStack,
} from "./primitives"
import { setScrollOffset, setScrollEl } from "./scroll-store"
import { openProduct } from "./cart-store"

/* Boutique room dimensions — tight showroom, not a long aisle.
   x: -8 to +8 (width 16)
   z: -14 (back wall) to +4 (entrance)
   y: 0 to 5 (ceiling)
*/

/* Camera path — each section gets a straight-on, head-on framing.
   Room: x:[-8,8], z:[-14,4]. Racks on left wall at x=-6.2. Pegboard on right at x=7.85.

   Between Tees (facing left) and Accessories (facing right) we inject a pivot
   keyframe that faces the back wall. Without it, lerping the look target across
   the camera's own position causes a 180° flip through the floor — the "drop
   and jump" you saw. The pivot makes it a smooth left → forward → right turn. */
const CAMERA_PATH: Array<{ t: number; pos: [number, number, number]; look: [number, number, number] }> = [
  { t: 0.0, pos: [0, 1.7, 9], look: [0, 1.7, -5] },         // outside looking in
  { t: 0.1, pos: [0, 1.7, 3], look: [0, 1.7, -5] },         // stepping through the door
  { t: 0.22, pos: [1.5, 1.65, -3], look: [-7, 1.5, -3] },   // HOODIES — head-on, left wall
  { t: 0.4, pos: [1.5, 1.65, -9], look: [-7, 1.5, -9] },    // TEES — head-on, left wall
  { t: 0.5, pos: [0, 1.65, -7.5], look: [0, 1.65, -13.5] }, // pivot: face the back wall
  { t: 0.6, pos: [-1.5, 1.65, -6], look: [8, 1.5, -6] },    // ACCESSORIES — head-on, right wall
  { t: 0.85, pos: [0, 1.7, -8.5], look: [0, 3.5, -13.9] },  // approach hero wall
  { t: 1.0, pos: [0, 1.8, -10.5], look: [0, 4.2, -13.9] },  // hero reveal — look up at the centered crest
]

function sampleCameraPath(t: number) {
  for (let i = 0; i < CAMERA_PATH.length - 1; i++) {
    const a = CAMERA_PATH[i]
    const b = CAMERA_PATH[i + 1]
    if (t >= a.t && t <= b.t) {
      const localT = (t - a.t) / (b.t - a.t)
      const s = localT * localT * (3 - 2 * localT)
      return {
        pos: [
          a.pos[0] + (b.pos[0] - a.pos[0]) * s,
          a.pos[1] + (b.pos[1] - a.pos[1]) * s,
          a.pos[2] + (b.pos[2] - a.pos[2]) * s,
        ] as [number, number, number],
        look: [
          a.look[0] + (b.look[0] - a.look[0]) * s,
          a.look[1] + (b.look[1] - a.look[1]) * s,
          a.look[2] + (b.look[2] - a.look[2]) * s,
        ] as [number, number, number],
      }
    }
  }
  const last = CAMERA_PATH[CAMERA_PATH.length - 1]
  return { pos: last.pos, look: last.look }
}

export function CameraRig() {
  const scroll = useScroll()
  const { camera } = useThree()
  const targetLook = useRef(new THREE.Vector3(0, 1.6, -5))
  const prevOffset = useRef(0)
  const bobPhase = useRef(0)

  /* Drag-to-scroll state — dragging on the canvas adjusts scroll position */
  const dragState = useRef<{
    down: boolean
    startX: number
    startY: number
    lastY: number
    moved: boolean
  } | null>(null)

  useEffect(() => {
    setScrollEl(scroll.el as HTMLElement)
    return () => setScrollEl(null)
  }, [scroll.el])

  useEffect(() => {
    const sEl = scroll.el as HTMLElement | null
    if (!sEl) return

    const CLICK_THRESHOLD = 6 // pixels — under this is a click, over this is a drag

    // pointerdown is attached to the ScrollControls DOM container itself
    // (drei overlays it on top of the canvas to capture scroll), so ANY
    // click/drag inside the 3D hall enters this handler. Overlay buttons
    // are in a separate DOM subtree and don't trigger this.
    const onDown = (e: PointerEvent) => {
      // Ignore drags that start on an interactive descendant (links/buttons)
      const target = e.target as HTMLElement | null
      if (target?.closest("a, button, input, select, textarea")) return
      dragState.current = {
        down: true,
        startX: e.clientX,
        startY: e.clientY,
        lastY: e.clientY,
        moved: false,
      }
    }
    const onMove = (e: PointerEvent) => {
      const s = dragState.current
      if (!s?.down) return
      const totalDy = Math.abs(e.clientY - s.startY)
      const totalDx = Math.abs(e.clientX - s.startX)
      if (!s.moved && totalDy + totalDx > CLICK_THRESHOLD) {
        s.moved = true
        document.body.style.cursor = "grabbing"
      }
      if (!s.moved) return
      const dy = e.clientY - s.lastY
      s.lastY = e.clientY
      // Drag UP (negative dy) scrolls forward into the store.
      sEl.scrollTop = Math.max(
        0,
        Math.min(sEl.scrollHeight - sEl.clientHeight, sEl.scrollTop - dy * 1.2)
      )
    }
    const onUp = () => {
      if (dragState.current) dragState.current.down = false
      document.body.style.cursor = ""
    }

    sEl.addEventListener("pointerdown", onDown)
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
    return () => {
      sEl.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
    }
  }, [scroll.el])

  useFrame((_, delta) => {
    const t = scroll.offset
    setScrollOffset(t)
    const { pos, look } = sampleCameraPath(t)
    const targetPos = new THREE.Vector3(...pos)

    /* Walk-cycle bob — driven by scroll velocity */
    const scrollVel = Math.min(Math.abs(t - prevOffset.current) / Math.max(delta, 0.001), 2)
    prevOffset.current = t
    bobPhase.current += delta * (3 + scrollVel * 8)
    const bob = Math.sin(bobPhase.current) * 0.018 * Math.min(1, scrollVel * 6)
    const sway = Math.cos(bobPhase.current * 0.5) * 0.008 * Math.min(1, scrollVel * 6)
    targetPos.y += bob
    targetPos.x += sway

    camera.position.lerp(targetPos, 0.08)
    targetLook.current.lerp(new THREE.Vector3(...look), 0.08)
    camera.lookAt(targetLook.current)
  })

  return null
}

/* ============================================================
   Floor — PBR stone flagstone with burgundy center runner rug
   ============================================================ */
function Floor() {
  const [stoneMap, stoneNormal] = useTexture([
    "https://threejs.org/examples/textures/brick_diffuse.jpg",
    "https://threejs.org/examples/textures/brick_bump.jpg",
  ])

  useMemo(() => {
    ;[stoneMap, stoneNormal].forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.repeat.set(5, 6)
      t.anisotropy = 8
    })
  }, [stoneMap, stoneNormal])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -5]} receiveShadow>
        <planeGeometry args={[16, 20]} />
        <meshStandardMaterial
          map={stoneMap}
          normalMap={stoneNormal}
          normalScale={new THREE.Vector2(0.6, 0.6)}
          color="#8a7f73"
          roughness={0.95}
        />
      </mesh>
      {/* Center burgundy runner (castle aisle) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -6]} receiveShadow>
        <planeGeometry args={[6, 12]} />
        <meshStandardMaterial color={PALETTE.forest} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, -6]}>
        <planeGeometry args={[5.6, 11.6]} />
        <meshStandardMaterial color={PALETTE.forestLight} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.007, -6]}>
        <planeGeometry args={[4.4, 10.4]} />
        <meshStandardMaterial color={PALETTE.forest} roughness={0.95} />
      </mesh>
      {/* Gold trim stripe along the runner edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, -6]}>
        <planeGeometry args={[4.6, 10.6]} />
        <meshStandardMaterial color={PALETTE.brassBright} roughness={0.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.009, -6]}>
        <planeGeometry args={[4.4, 10.4]} />
        <meshStandardMaterial color={PALETTE.forest} roughness={0.95} />
      </mesh>
    </group>
  )
}

/* Enchanted ceiling — raised to y=9 for cathedral height. Deep-night
   emissive plane with a star field just below it. */
const CEILING_Y = 9

function Ceiling() {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, CEILING_Y, -5]}>
        <planeGeometry args={[16, 20]} />
        <meshStandardMaterial
          color={PALETTE.navy}
          emissive={PALETTE.navy}
          emissiveIntensity={0.4}
          roughness={1}
        />
      </mesh>
      {/* Stars span the full height of the upper-hall void */}
      <group position={[0, CEILING_Y - 0.3, -5]}>
        <Stars
          radius={11}
          depth={4}
          count={1100}
          factor={1.4}
          saturation={0}
          fade
          speed={0.3}
        />
      </group>
    </group>
  )
}

function Walls() {
  const [wallMap, wallNormal] = useTexture([
    "https://threejs.org/examples/textures/brick_diffuse.jpg",
    "https://threejs.org/examples/textures/brick_bump.jpg",
  ])

  useMemo(() => {
    ;[wallMap, wallNormal].forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.repeat.set(6, 2)
      t.anisotropy = 8
    })
  }, [wallMap, wallNormal])

  return (
    <group>
      {/* Walls go floor (y=0) to ceiling (y=CEILING_Y=9). Center at y=4.5, height 9. */}
      {/* Left wall — stone */}
      <mesh position={[-8, 4.5, -5]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 9]} />
        <meshStandardMaterial
          map={wallMap}
          normalMap={wallNormal}
          normalScale={new THREE.Vector2(0.6, 0.6)}
          color="#6d655a"
          roughness={0.95}
        />
      </mesh>
      {/* Right wall — stone */}
      <mesh position={[8, 4.5, -5]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 9]} />
        <meshStandardMaterial
          map={wallMap}
          normalMap={wallNormal}
          normalScale={new THREE.Vector2(0.6, 0.6)}
          color="#6d655a"
          roughness={0.95}
        />
      </mesh>
      {/* Back wall — burgundy-tinted stone (hero wall) */}
      <mesh position={[0, 4.5, -14]} receiveShadow>
        <planeGeometry args={[16, 9]} />
        <meshStandardMaterial
          map={wallMap}
          normalMap={wallNormal}
          normalScale={new THREE.Vector2(0.5, 0.5)}
          color={PALETTE.forest}
          roughness={0.9}
        />
      </mesh>
      {/* Entrance wall — stone */}
      <mesh position={[0, 4.5, 4]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[16, 9]} />
        <meshStandardMaterial
          map={wallMap}
          normalMap={wallNormal}
          normalScale={new THREE.Vector2(0.6, 0.6)}
          color="#6d655a"
          roughness={0.95}
        />
      </mesh>

      {/* Wainscot — left */}
      <mesh position={[-7.99, 0.6, -5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[20, 1.2]} />
        <meshStandardMaterial color={PALETTE.walnutLight} roughness={0.9} />
      </mesh>
      {/* Wainscot — right */}
      <mesh position={[7.99, 0.6, -5]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[20, 1.2]} />
        <meshStandardMaterial color={PALETTE.walnutLight} roughness={0.9} />
      </mesh>
      {/* Wainscot — back */}
      <mesh position={[0, 0.6, -13.99]}>
        <planeGeometry args={[16, 1.2]} />
        <meshStandardMaterial color={PALETTE.walnutLight} roughness={0.9} />
      </mesh>

      {/* Trim lines */}
      <mesh position={[-7.98, 1.22, -5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[20, 0.05]} />
        <meshStandardMaterial color={PALETTE.walnut} />
      </mesh>
      <mesh position={[7.98, 1.22, -5]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[20, 0.05]} />
        <meshStandardMaterial color={PALETTE.walnut} />
      </mesh>

      {/* Mid-wall trim line — above the wainscot, below the windows */}
      <mesh position={[-7.98, 5.2, -5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[20, 0.08]} />
        <meshStandardMaterial color={PALETTE.walnut} />
      </mesh>
      <mesh position={[7.98, 5.2, -5]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[20, 0.08]} />
        <meshStandardMaterial color={PALETTE.walnut} />
      </mesh>

      {/* Crown molding — at new ceiling height */}
      <mesh position={[-7.98, 8.85, -5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[20, 0.3]} />
        <meshStandardMaterial color={PALETTE.walnut} />
      </mesh>
      <mesh position={[7.98, 8.85, -5]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[20, 0.3]} />
        <meshStandardMaterial color={PALETTE.walnut} />
      </mesh>
    </group>
  )
}

/* ============================================================
   Banner — vertical hanging cloth with SU brand imagery
   ============================================================ */
function Banner({
  textureUrl,
  position,
  rotation = [0, 0, 0],
  width = 1.8,
  height = 4.2,
  swayOffset = 0,
}: {
  textureUrl: string
  position: [number, number, number]
  rotation?: [number, number, number]
  width?: number
  height?: number
  swayOffset?: number
}) {
  const group = useRef<THREE.Group>(null)
  const tex = useTexture(textureUrl)
  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.elapsedTime
    group.current.rotation.z = Math.sin(t * 0.4 + swayOffset) * 0.012
  })
  return (
    <group ref={group} position={position} rotation={rotation}>
      {/* Burgundy backing for contrast against stone walls */}
      <mesh position={[0, 0, -0.015]}>
        <planeGeometry args={[width * 1.05, height * 1.04]} />
        <meshStandardMaterial color={PALETTE.forest} roughness={0.9} />
      </mesh>
      {/* Brass rod — horizontal across the banner top, with finial end-caps. */}
      <group position={[0, height / 2 + 0.06, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, width * 1.2, 12]} />
          <meshStandardMaterial color={PALETTE.brassBright} metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Finial caps on both ends so the rod reads as a real fixture */}
        <mesh position={[-(width * 1.2) / 2, 0, 0]}>
          <sphereGeometry args={[0.055, 12, 8]} />
          <meshStandardMaterial color={PALETTE.brassBright} metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[(width * 1.2) / 2, 0, 0]}>
          <sphereGeometry args={[0.055, 12, 8]} />
          <meshStandardMaterial color={PALETTE.brassBright} metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
      {/* Banner face — semi-translucent so the stone wall reads through
          (tapestry blend). alphaTest still trims the edge fringing. */}
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          map={tex}
          transparent
          opacity={0.88}
          alphaTest={0.05}
          roughness={0.9}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

/* ============================================================
   FLOOR MEDALLION — inlaid circular emblem at the aisle's center.
   Gold ring + burgundy disc + SU monogram, slightly emissive so
   bloom catches the gold. Sits just above the rug to avoid z-fight.
   ============================================================ */
function FloorMedallion() {
  const tex = useTexture("/SU1.png")
  return (
    <group position={[0, 0.012, -6]}>
      {/* Outer gold ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.55, 1.85, 64]} />
        <meshStandardMaterial
          color={PALETTE.brassBright}
          metalness={0.85}
          roughness={0.25}
          emissive={PALETTE.brassBright}
          emissiveIntensity={0.08}
        />
      </mesh>
      {/* Secondary thin inner ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[1.42, 1.48, 64]} />
        <meshStandardMaterial
          color={PALETTE.brassBright}
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>
      {/* Burgundy inner disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <circleGeometry args={[1.42, 64]} />
        <meshStandardMaterial color={PALETTE.forest} roughness={0.9} />
      </mesh>
      {/* SU monogram centered on top */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[2.2, 2.2]} />
        <meshStandardMaterial
          map={tex}
          transparent
          alphaTest={0.2}
          emissive={PALETTE.brassBright}
          emissiveIntensity={0.18}
          roughness={0.8}
        />
      </mesh>
    </group>
  )
}

/* Entrance monogram plate — small SU logo over the front arch */
function EntranceMonogram() {
  const tex = useTexture("/SU1.png")
  return (
    <mesh position={[0, 3.85, 3.92]} rotation={[0, Math.PI, 0]}>
      <planeGeometry args={[0.9, 0.9]} />
      <meshStandardMaterial
        map={tex}
        alphaTest={0.5}
        emissive={PALETTE.brassBright}
        emissiveIntensity={0.25}
      />
    </mesh>
  )
}

/* Back-wall crest — centered on the 9-unit-tall hero wall, enlarged
   so it properly dominates the room at the reveal. */
function BackWallCrest() {
  const tex = useTexture("/SUCREST.PNG")
  return (
    <mesh position={[0, 4.5, -13.88]}>
      <planeGeometry args={[5.2, 5.2]} />
      <meshStandardMaterial
        map={tex}
        alphaTest={0.5}
        emissive={PALETTE.brassBright}
        emissiveIntensity={0.28}
        roughness={0.85}
      />
    </mesh>
  )
}

/* ============================================================
   STAINED-GLASS WINDOW
   Procedural leaded-glass panel — generated at runtime via Canvas
   2D API so there's no asset dependency. Rendered with
   meshBasicMaterial + toneMapped={false} so the bright colors
   punch through Bloom and read as "backlit by sunlight."
   ============================================================ */
let _stainedGlassTex: THREE.CanvasTexture | null = null
function stainedGlassTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null
  if (_stainedGlassTex) return _stainedGlassTex

  const canvas = document.createElement("canvas")
  canvas.width = 256
  canvas.height = 384
  const ctx = canvas.getContext("2d")
  if (!ctx) return null

  // Three vertical colored panels (burgundy / gold / deep blue)
  const panelColors = ["#93000B", "#FFB100", "#0a2e6b"]
  const panelW = canvas.width / 3
  panelColors.forEach((color, i) => {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
    grad.addColorStop(0, color)
    grad.addColorStop(1, i === 1 ? "#c88400" : color) // gold fades a touch
    ctx.fillStyle = grad
    ctx.fillRect(i * panelW, 0, panelW, canvas.height)
  })

  // Leaded grid — dark lines dividing the panels
  ctx.strokeStyle = "#0a0604"
  ctx.lineWidth = 5
  for (let i = 1; i < 3; i++) {
    ctx.beginPath()
    ctx.moveTo(i * panelW, 0)
    ctx.lineTo(i * panelW, canvas.height)
    ctx.stroke()
  }
  for (let i = 1; i < 6; i++) {
    ctx.beginPath()
    ctx.moveTo(0, (canvas.height / 6) * i)
    ctx.lineTo(canvas.width, (canvas.height / 6) * i)
    ctx.stroke()
  }

  // Diagonal cross quarrels in each cell for that leaded-diamond look
  ctx.lineWidth = 2
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 6; row++) {
      const x0 = col * panelW
      const y0 = (canvas.height / 6) * row
      const w = panelW
      const h = canvas.height / 6
      ctx.beginPath()
      ctx.moveTo(x0 + w * 0.5, y0 + h * 0.15)
      ctx.lineTo(x0 + w * 0.85, y0 + h * 0.5)
      ctx.lineTo(x0 + w * 0.5, y0 + h * 0.85)
      ctx.lineTo(x0 + w * 0.15, y0 + h * 0.5)
      ctx.closePath()
      ctx.stroke()
    }
  }

  // Outer stone frame
  ctx.strokeStyle = "#0a0604"
  ctx.lineWidth = 12
  ctx.strokeRect(0, 0, canvas.width, canvas.height)

  const tex = new THREE.CanvasTexture(canvas)
  tex.anisotropy = 4
  _stainedGlassTex = tex
  return tex
}

function StainedGlassWindow({
  position,
  rotation = [0, 0, 0],
  width = 1.1,
  height = 1.6,
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  width?: number
  height?: number
}) {
  const tex = useMemo(() => stainedGlassTexture(), [])
  if (!tex) return null
  return (
    <group position={position} rotation={rotation}>
      {/* Outer stone frame (slightly larger, sits behind the glass) */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[width + 0.18, height + 0.18]} />
        <meshStandardMaterial color={PALETTE.walnut} roughness={0.9} />
      </mesh>
      {/* Glass itself — emissive map via basic material, toneMapped off so
          the bright colors ride on top of Bloom. */}
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ============================================================
   Main scene content — boutique showroom
   ============================================================ */
export function SceneContent() {
  return (
    <>
      <CameraRig />

      {/* Lighting — warm castle torchlight */}
      <ambientLight intensity={0.3} color="#ffe3b0" />
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.55}
        color="#ffd98a"
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-camera-near={1}
        shadow-camera-far={30}
      />
      {/* Warm studio HDRI from Poly Haven — CC0, baked into /public/hdri/.
          Used only for reflections/env lighting; not rendered as a background.
          environmentIntensity dims its contribution so it doesn't wash out
          the warm candle/torch lighting. */}
      <Environment files="/hdri/hall.hdr" background={false} environmentIntensity={0.35} />
      {/* Fog pushed back — near distance raised so nearby geometry reads clean. */}
      <fog attach="fog" args={["#14100c", 14, 34]} />

      <Floor />
      <FloorMedallion />
      <Ceiling />
      <Walls />

      {/* Floating candles — fill the upper hall between y=5 and y=8 (between
          the crown molding and the enchanted ceiling) for cathedral depth. */}
      <FloatingCandles count={140} yMin={5.2} yMax={7.8} />

      {/* Ceiling lamps — chains reach the ceiling so they don't float.
          Symmetric pairs front + middle, plus a centered accent at the back. */}
      <CeilingLamp position={[-3, 7.5, 0]} ceilingY={CEILING_Y} />
      <CeilingLamp position={[3, 7.5, 0]} ceilingY={CEILING_Y} />
      <CeilingLamp position={[-3, 7.5, -6]} ceilingY={CEILING_Y} />
      <CeilingLamp position={[3, 7.5, -6]} ceilingY={CEILING_Y} />
      <CeilingLamp position={[0, 7.5, -11]} ceilingY={CEILING_Y} />

      {/* Stained-glass windows HIGH up — above the functional displays,
          near the crown molding. Reads as clerestory windows above a nave. */}
      <StainedGlassWindow
        position={[-7.93, 6.8, -3]}
        rotation={[0, Math.PI / 2, 0]}
        width={1.3}
        height={2.4}
      />
      <StainedGlassWindow
        position={[-7.93, 6.8, -7]}
        rotation={[0, Math.PI / 2, 0]}
        width={1.3}
        height={2.4}
      />
      <StainedGlassWindow
        position={[-7.93, 6.8, -11]}
        rotation={[0, Math.PI / 2, 0]}
        width={1.3}
        height={2.4}
      />
      <StainedGlassWindow
        position={[7.93, 6.8, -3]}
        rotation={[0, -Math.PI / 2, 0]}
        width={1.3}
        height={2.4}
      />
      <StainedGlassWindow
        position={[7.93, 6.8, -7]}
        rotation={[0, -Math.PI / 2, 0]}
        width={1.3}
        height={2.4}
      />
      <StainedGlassWindow
        position={[7.93, 6.8, -11]}
        rotation={[0, -Math.PI / 2, 0]}
        width={1.3}
        height={2.4}
      />

      {/* Entrance monogram over the arch */}
      <EntranceMonogram />

      {/* Streamer Lions banners — hang below the windows (windows span
          y=5.6 to y=8.0). Banner centered at y=3.8 spans y=2.5 to y=5.1,
          clearly below the clerestory. Semi-translucent so the stone
          reads through like a woven tapestry. */}
      <Banner
        textureUrl="/Flags_and_banners-6.png"
        position={[-7.85, 3.8, -5]}
        rotation={[0, Math.PI / 2, 0]}
        width={1.5}
        height={2.6}
        swayOffset={0}
      />
      <Banner
        textureUrl="/Flags_and_banners-8.png"
        position={[-7.85, 3.8, -9]}
        rotation={[0, Math.PI / 2, 0]}
        width={1.5}
        height={2.6}
        swayOffset={2.1}
      />
      <Banner
        textureUrl="/Flags_and_banners-8.png"
        position={[7.85, 3.8, -5]}
        rotation={[0, -Math.PI / 2, 0]}
        width={1.5}
        height={2.6}
        swayOffset={1.3}
      />
      <Banner
        textureUrl="/Flags_and_banners-6.png"
        position={[7.85, 3.8, -9]}
        rotation={[0, -Math.PI / 2, 0]}
        width={1.5}
        height={2.6}
        swayOffset={0.7}
      />

      {/* ===== WELCOME SIGN ABOVE ENTRANCE (facing inward) ===== */}
      <group position={[0, 3.4, 3.95]} rotation={[0, Math.PI, 0]}>
        <mesh>
          <boxGeometry args={[5.5, 1, 0.15]} />
          <meshStandardMaterial color={PALETTE.walnut} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.08]}>
          <boxGeometry args={[5.1, 0.75, 0.05]} />
          <meshStandardMaterial color={PALETTE.cream} roughness={0.8} />
        </mesh>
        <Text
          position={[0, 0, 0.12]}
          fontSize={0.16}
          color={PALETTE.walnut}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.3}
        >
          THE OFFICIAL CAMPUS STORE · EST. 2026
        </Text>
      </group>

      {/* ===== LEFT WALL: HOODIES + TEES ===== */}
      <group position={[-6.2, 0, -3]} rotation={[0, Math.PI / 2, 0]}>
        <GarmentRack
          position={[0, 0, 0]}
          length={5}
          garments={[
            { color: PALETTE.forest, type: "hoodie", label: "SU", productId: "su-crest-hoodie", textureUrl: "/hoodie-2.png", onClick: () => openProduct("su-crest-hoodie") },
            { color: PALETTE.cream, type: "hoodie", label: "SU", productId: "su-crest-hoodie", textureUrl: "/hoodie-2.png", onClick: () => openProduct("su-crest-hoodie") },
            { color: PALETTE.forestLight, type: "hoodie", label: "25", productId: "su-crest-hoodie", textureUrl: "/hoodie-2.png", onClick: () => openProduct("su-crest-hoodie") },
            { color: PALETTE.walnut, type: "hoodie", label: "VARSITY", productId: "varsity-hoodie", textureUrl: "/hoodie-1.png", onClick: () => openProduct("varsity-hoodie") },
          ]}
        />
        <group position={[0, 3.4, 0]}>
          <mesh>
            <boxGeometry args={[2, 0.5, 0.08]} />
            <meshStandardMaterial color={PALETTE.forest} roughness={0.85} />
          </mesh>
          <Text
            position={[0, 0, 0.05]}
            fontSize={0.16}
            color={PALETTE.cream}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.15}
          >
            HOODIES
          </Text>
        </group>
      </group>

      <group position={[-6.2, 0, -9]} rotation={[0, Math.PI / 2, 0]}>
        <GarmentRack
          position={[0, 0, 0]}
          length={4}
          garments={[
            { color: PALETTE.cream, type: "tee", label: "SU", productId: "campus-tee", onClick: () => openProduct("campus-tee") },
            { color: PALETTE.forest, type: "tee", label: "KAI", productId: "campus-tee", onClick: () => openProduct("campus-tee") },
            { color: PALETTE.charcoal, type: "tee", label: "CAMPUS", productId: "campus-tee", onClick: () => openProduct("campus-tee") },
            { color: PALETTE.red, type: "tee", label: "24", productId: "campus-tee", onClick: () => openProduct("campus-tee") },
          ]}
        />
        <group position={[0, 3.4, 0]}>
          <mesh>
            <boxGeometry args={[1.6, 0.5, 0.08]} />
            <meshStandardMaterial color={PALETTE.forest} roughness={0.85} />
          </mesh>
          <Text
            position={[0, 0, 0.05]}
            fontSize={0.16}
            color={PALETTE.cream}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.15}
          >
            TEES
          </Text>
        </group>
      </group>

      {/* ===== RIGHT WALL: ACCESSORIES PEGBOARD ===== */}
      <group position={[7.85, 2.3, -6]} rotation={[0, -Math.PI / 2, 0]}>
        <Pegboard
          width={8}
          height={2.6}
          items={[
            { type: "mug", x: -3.2, y: 0.7, color: PALETTE.forest, productId: "su-mug", onClick: () => openProduct("su-mug") },
            { type: "mug", x: -2.3, y: 0.7, color: PALETTE.cream, productId: "su-mug", onClick: () => openProduct("su-mug") },
            { type: "mug", x: -1.4, y: 0.7, color: PALETTE.walnut, productId: "su-mug", onClick: () => openProduct("su-mug") },
            { type: "mug", x: -0.5, y: 0.7, color: PALETTE.red, productId: "su-mug", onClick: () => openProduct("su-mug") },
            { type: "mug", x: 0.4, y: 0.7, color: PALETTE.navy, productId: "su-mug", onClick: () => openProduct("su-mug") },
            { type: "mug", x: 1.3, y: 0.7, color: PALETTE.forest, productId: "su-mug", onClick: () => openProduct("su-mug") },
            { type: "mug", x: 2.2, y: 0.7, color: PALETTE.brass, productId: "su-mug", onClick: () => openProduct("su-mug") },
            { type: "mug", x: 3.1, y: 0.7, color: PALETTE.cream, productId: "su-mug", onClick: () => openProduct("su-mug") },
            { type: "cap", x: -3, y: -0.1, color: PALETTE.forest, productId: "su-cap", onClick: () => openProduct("su-cap") },
            { type: "cap", x: -1.8, y: -0.1, color: PALETTE.charcoal, productId: "su-cap", onClick: () => openProduct("su-cap") },
            { type: "cap", x: -0.6, y: -0.1, color: PALETTE.cream, productId: "su-cap", onClick: () => openProduct("su-cap") },
            { type: "cap", x: 0.6, y: -0.1, color: PALETTE.red, productId: "su-cap", onClick: () => openProduct("su-cap") },
            { type: "cap", x: 1.8, y: -0.1, color: PALETTE.walnut, productId: "su-cap", onClick: () => openProduct("su-cap") },
            { type: "cap", x: 3, y: -0.1, color: PALETTE.forest, productId: "su-cap", onClick: () => openProduct("su-cap") },
            { type: "tote", x: -2.8, y: -0.95, color: PALETTE.forest, productId: "su-tote", onClick: () => openProduct("su-tote") },
            { type: "tote", x: -1.4, y: -0.95, color: PALETTE.walnut, productId: "su-tote", onClick: () => openProduct("su-tote") },
            { type: "tote", x: 0, y: -0.95, color: PALETTE.red, productId: "su-tote", onClick: () => openProduct("su-tote") },
            { type: "tote", x: 1.4, y: -0.95, color: PALETTE.navy, productId: "su-tote", onClick: () => openProduct("su-tote") },
            { type: "tote", x: 2.8, y: -0.95, color: PALETTE.forest, productId: "su-tote", onClick: () => openProduct("su-tote") },
          ]}
        />
        <group position={[0, 1.7, 0.1]}>
          <mesh>
            <boxGeometry args={[2.4, 0.4, 0.05]} />
            <meshStandardMaterial color={PALETTE.brass} roughness={0.5} metalness={0.3} />
          </mesh>
          <Text
            position={[0, 0, 0.04]}
            fontSize={0.14}
            color={PALETTE.walnut}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.2}
          >
            ACCESSORIES
          </Text>
        </group>
      </group>

      {/* ===== BACK WALL: HERO CREST ===== */}
      <BackWallCrest />

      {/* Hero pedestals in front of back wall — hoodie mockups front & center */}
      <group position={[-1.8, 0, -11.5]}>
        <Pedestal>
          <HangingGarment
            position={[0, 0.4, 0]}
            color={PALETTE.forest}
            type="hoodie"
            label="SU"
            productId="su-crest-hoodie"
            textureUrl="/hoodie-2.png"
            onClick={() => openProduct("su-crest-hoodie")}
          />
        </Pedestal>
      </group>
      <group position={[1.8, 0, -11.5]}>
        <Pedestal>
          <HangingGarment
            position={[0, 0.4, 0]}
            color={PALETTE.walnut}
            type="hoodie"
            label="VARSITY"
            productId="varsity-hoodie"
            textureUrl="/hoodie-1.png"
            onClick={() => openProduct("varsity-hoodie")}
          />
        </Pedestal>
      </group>

      {/* Center pedestal removed — it blocked sight lines to the accessories wall. */}

      {/* Hero accent lighting — SU gold torchlight + a high cool fill
          from the "window side" to sell the stained-glass-above look. */}
      <pointLight position={[0, 4, -12]} intensity={2.6} distance={10} color="#ffc766" />
      <pointLight position={[0, 3.8, -6]} intensity={1.8} distance={7} color="#ffc766" />
      <pointLight position={[-6, 3.5, -6]} intensity={1.2} distance={6} color="#ffb74a" />
      <pointLight position={[6, 3.5, -6]} intensity={1.2} distance={6} color="#ffb74a" />
      {/* High cool wash from the clerestory windows */}
      <pointLight position={[0, 7.5, -5]} intensity={0.9} distance={14} color="#c8b898" />

      {/* Decorative bookshelves flanking the back wall */}
      <Bookshelf position={[-7.5, 2.3, -13.5]} rotation={[0, 0, 0]} />
      <Bookshelf position={[7.5, 2.3, -13.5]} rotation={[0, 0, 0]} />

      {/* Wooden benches lining the aisle — "pews" leading to the hero wall.
          Just outside the burgundy runner rug so they don't intrude. */}
      <WoodenBench position={[-3.6, 0, 1]} rotation={[0, Math.PI / 2, 0]} length={1.8} />
      <WoodenBench position={[3.6, 0, 1]} rotation={[0, -Math.PI / 2, 0]} length={1.8} />
      <WoodenBench position={[-3.6, 0, -4]} rotation={[0, Math.PI / 2, 0]} length={1.8} />
      <WoodenBench position={[3.6, 0, -4]} rotation={[0, -Math.PI / 2, 0]} length={1.8} />

      {/* Tome stacks on the benches — the "leave your books here" vibe */}
      <TomeStack position={[-3.6, 0.5, 1.2]} rotation={[0, Math.PI / 2, 0]} seed={1} count={3} />
      <TomeStack position={[3.6, 0.5, 0.8]} rotation={[0, -Math.PI / 2, 0]} seed={2} count={2} />
      <TomeStack position={[-3.6, 0.5, -3.8]} rotation={[0, Math.PI / 2, 0]} seed={3} count={4} />
      <TomeStack position={[3.6, 0.5, -4.2]} rotation={[0, -Math.PI / 2, 0]} seed={4} count={3} />

      {/* Tomes stacked on the hero bookshelves to make them feel loved */}
      <TomeStack position={[-7.5, 2.75, -13.5]} seed={5} count={4} />
      <TomeStack position={[7.5, 2.75, -13.5]} seed={6} count={4} />

      {/* Corner columns — full-height to the new ceiling */}
      {[[-7.8, 3.95], [7.8, 3.95], [-7.8, -13.8], [7.8, -13.8]].map(([x, z], i) => (
        <mesh key={i} position={[x, 4.5, z]}>
          <boxGeometry args={[0.35, 9, 0.35]} />
          <meshStandardMaterial color={PALETTE.walnut} roughness={0.8} />
        </mesh>
      ))}
    </>
  )
}
