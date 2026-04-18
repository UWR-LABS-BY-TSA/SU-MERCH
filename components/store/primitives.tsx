"use client"

import { useRef, useMemo, useState, Suspense, type ReactNode } from "react"
import { useFrame } from "@react-three/fiber"
import { Text, useGLTF, useTexture } from "@react-three/drei"
import * as THREE from "three"

/* ============================================================
   GLTFProduct — drop a real 3D model in anywhere a primitive lives.

   Usage:
     <Pedestal>
       <GLTFProduct url="/models/my-hoodie.glb" scale={1.2}>
         <HangingGarment ... />   // fallback / loading state
       </GLTFProduct>
     </Pedestal>

   Put .glb/.gltf files in /public/models/. Polyhaven, Sketchfab, and
   the KhronosGroup sample assets are great starting points.
   ============================================================ */
export function GLTFProduct({
  url,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  children,
}: {
  url?: string
  scale?: number | [number, number, number]
  position?: [number, number, number]
  rotation?: [number, number, number]
  children?: ReactNode
}) {
  if (!url) {
    return (
      <group position={position} rotation={rotation} scale={scale as number}>
        {children}
      </group>
    )
  }
  return (
    <Suspense fallback={<group position={position}>{children}</group>}>
      <GLTFInner url={url} scale={scale} position={position} rotation={rotation} />
    </Suspense>
  )
}

function GLTFInner({
  url,
  scale,
  position,
  rotation,
}: {
  url: string
  scale: number | [number, number, number]
  position: [number, number, number]
  rotation: [number, number, number]
}) {
  const { scene } = useGLTF(url)
  const cloned = useMemo(() => scene.clone(true), [scene])
  return <primitive object={cloned} position={position} rotation={rotation} scale={scale} />
}

/* ============================================================
   Color palette — Streamer University castle (SU brand)
   Keys preserved from prior palette so all 9 consumers update
   in place; only values changed.
   ============================================================ */
export const PALETTE = {
  forest: "#93000B",       // SU burgundy (primary)
  forestLight: "#b8111d",  // burgundy highlight
  cream: "#f1e6c8",        // parchment
  creamDark: "#d9c89a",
  brass: "#c89232",        // antique gold (shadowed)
  brassBright: "#FFB100",  // SU gold — matches logo
  walnut: "#2a1a12",       // castle stone-wood trim
  walnutLight: "#5a3a24",
  ivory: "#f7f1e1",
  off: "#e8dcc0",
  charcoal: "#14100c",     // warmer dark
  white: "#f8f4ea",
  red: "#93000B",          // aligned to burgundy primary
  navy: "#0a1224",         // deep night sky (enchanted ceiling)
}

/* Textured front — a flat mockup plane + a simple chrome hook that
   continues into a shaft disappearing into the hoodie.

   The hook is a 3/4 loop so it has ONE free tip (the side opening that
   catches the rail) and ONE closing point at the bottom-center — the
   shaft continues out of that point straight down, so the hook and the
   wire read as a single continuous bent piece of wire. */
function GarmentMockupFront({
  url,
  width = 1.1,
  height = 1.2,
}: {
  url: string
  width?: number
  height?: number
}) {
  const tex = useTexture(url)

  // --- Hook + shaft geometry (HangingGarment local space; bar at y=0.6) ---
  const CHROME = "#dcdcdc"
  const WIRE_R = 0.009

  // Hook: 3/4 torus so the arc's trailing endpoint lands at bottom-center —
  // the shaft continues from that exact point, reading as one bent wire.
  const HOOK_R = 0.055
  const HOOK_CENTER_Y = 0.6 // arc center sits AT the bar height
  const HOOK_Z = 0.05 // in front of the bar (viewer's side)

  // Shaft — longer than before so it reaches down PAST the PNG's
  // transparent top-padding and into where the hoodie's hood actually
  // begins. Rendered BEHIND the PNG (z < 0) so the portion that would
  // visually cross the opaque hoodie is hidden by the hoodie itself,
  // while the portion passing through the PNG's transparent "sky" area
  // stays visible — reads as the hanger disappearing into the collar.
  const SHAFT_TOP_Y = HOOK_CENTER_Y - HOOK_R // y = 0.545
  const SHAFT_BOTTOM_Y = 0.18 // pushes ~0.24 units into the hoodie
  const SHAFT_LEN = SHAFT_TOP_Y - SHAFT_BOTTOM_Y
  const SHAFT_MID_Y = (SHAFT_TOP_Y + SHAFT_BOTTOM_Y) / 2
  const SHAFT_Z = -0.015 // behind the PNG (PNG at z=0)

  return (
    <group>
      {/* Hook — 3/4 torus. Free tip at (+HOOK_R, 0), trailing end at
          (0, -HOOK_R) where the shaft begins. */}
      <mesh position={[0, HOOK_CENTER_Y, HOOK_Z]}>
        <torusGeometry args={[HOOK_R, WIRE_R, 12, 30, Math.PI * 1.5]} />
        <meshStandardMaterial color={CHROME} metalness={0.95} roughness={0.15} />
      </mesh>
      {/* Nub on the free tip */}
      <mesh position={[HOOK_R, HOOK_CENTER_Y, HOOK_Z]}>
        <sphereGeometry args={[WIRE_R * 1.05, 10, 8]} />
        <meshStandardMaterial color={CHROME} metalness={0.95} roughness={0.15} />
      </mesh>

      {/* Shaft — drops from the hook into/through the hoodie, behind the PNG
          so opaque hood pixels naturally hide its lower half. */}
      <mesh position={[0, SHAFT_MID_Y, SHAFT_Z]}>
        <cylinderGeometry args={[WIRE_R, WIRE_R, SHAFT_LEN, 12]} />
        <meshStandardMaterial color={CHROME} metalness={0.95} roughness={0.15} />
      </mesh>

      {/* Mockup PNG — meshBasicMaterial so it shows true colors regardless
          of scene lighting (the Cloakroom is dark, which was making the
          standard-lit hoodies render near-black). */}
      <mesh position={[0, -0.18, 0]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={tex} alphaTest={0.5} toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ============================================================
   HANGING GARMENT (hoodie / tee)
   When `textureUrl` is supplied, renders as a flat mockup card
   (PNG on a plane) instead of the geometric primitive — ideal
   for dropping in product photos on the hanging racks.
   ============================================================ */
export function HangingGarment({
  position = [0, 0, 0],
  color = PALETTE.forest,
  accentColor = PALETTE.cream,
  type = "hoodie",
  label = "SU",
  swayOffset = 0,
  onClick,
  productId,
  textureUrl,
}: {
  position?: [number, number, number]
  color?: string
  accentColor?: string
  type?: "hoodie" | "tee"
  label?: string
  swayOffset?: number
  onClick?: () => void
  productId?: string
  textureUrl?: string
}) {
  const group = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const clickable = !!onClick || !!productId

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.elapsedTime
    group.current.rotation.z = Math.sin(t * 0.5 + swayOffset) * 0.015
    group.current.rotation.y = Math.sin(t * 0.3 + swayOffset * 1.3) * 0.02
    const scale = hovered && clickable ? 1.08 : 1
    group.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.18)
  })

  const isHoodie = type === "hoodie"

  return (
    <group
      position={position}
      ref={group}
      onClick={
        clickable
          ? (e) => {
              e.stopPropagation()
              onClick?.()
            }
          : undefined
      }
      onPointerOver={
        clickable
          ? (e) => {
              e.stopPropagation()
              setHovered(true)
              document.body.style.cursor = "pointer"
            }
          : undefined
      }
      onPointerOut={
        clickable
          ? () => {
              setHovered(false)
              document.body.style.cursor = ""
            }
          : undefined
      }
    >
      {textureUrl ? (
        <GarmentMockupFront url={textureUrl} />
      ) : (
        <>
          {/* Hanger hook */}
          <mesh position={[0, 0.55, 0]}>
            <torusGeometry args={[0.06, 0.012, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#c9c9c9" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Hanger bar */}
          <mesh position={[0, 0.42, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.7, 0.02, 0.03]} />
            <meshStandardMaterial color="#b8b8b8" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Hanger triangle sides */}
          <mesh position={[-0.26, 0.5, 0]} rotation={[0, 0, Math.PI / 2.3]}>
            <boxGeometry args={[0.22, 0.02, 0.02]} />
            <meshStandardMaterial color="#b8b8b8" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0.26, 0.5, 0]} rotation={[0, 0, -Math.PI / 2.3]}>
            <boxGeometry args={[0.22, 0.02, 0.02]} />
            <meshStandardMaterial color="#b8b8b8" metalness={0.7} roughness={0.3} />
          </mesh>

          {/* Garment body (torso) */}
          <mesh position={[0, -0.05, 0]} castShadow>
            <boxGeometry args={[0.72, 0.95, 0.14]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>

          {/* Left sleeve */}
          <mesh position={[-0.46, 0.22, 0]} rotation={[0, 0, 0.35]} castShadow>
            <boxGeometry args={[0.28, 0.55, 0.13]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
          {/* Right sleeve */}
          <mesh position={[0.46, 0.22, 0]} rotation={[0, 0, -0.35]} castShadow>
            <boxGeometry args={[0.28, 0.55, 0.13]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>

          {/* Collar / neckline */}
          {isHoodie ? (
            // Hood
            <mesh position={[0, 0.38, -0.04]} castShadow>
              <boxGeometry args={[0.42, 0.22, 0.18]} />
              <meshStandardMaterial color={color} roughness={0.9} />
            </mesh>
          ) : (
            // Tee neck
            <mesh position={[0, 0.4, 0.071]}>
              <boxGeometry args={[0.24, 0.08, 0.01]} />
              <meshStandardMaterial color={PALETTE.charcoal} roughness={0.9} />
            </mesh>
          )}

          {/* Hoodie drawstrings */}
          {isHoodie && (
            <>
              <mesh position={[-0.08, 0.2, 0.075]}>
                <boxGeometry args={[0.015, 0.25, 0.015]} />
                <meshStandardMaterial color={PALETTE.cream} roughness={0.8} />
              </mesh>
              <mesh position={[0.08, 0.2, 0.075]}>
                <boxGeometry args={[0.015, 0.25, 0.015]} />
                <meshStandardMaterial color={PALETTE.cream} roughness={0.8} />
              </mesh>
              {/* Kangaroo pocket */}
              <mesh position={[0, -0.25, 0.071]}>
                <boxGeometry args={[0.5, 0.28, 0.01]} />
                <meshStandardMaterial color={color} roughness={0.9} />
              </mesh>
            </>
          )}

          {/* Chest logo / label */}
          <Text
            position={[0, isHoodie ? -0.02 : 0.1, 0.072]}
            fontSize={0.09}
            color={accentColor}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.05}
          >
            {label}
          </Text>
        </>
      )}
    </group>
  )
}

/* ============================================================
   GARMENT RACK — horizontal bar with hanging garments
   ============================================================ */
export function GarmentRack({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  length = 4,
  garments = [],
}: {
  position?: [number, number, number]
  rotation?: [number, number, number]
  length?: number
  garments?: Array<{
    color: string
    type?: "hoodie" | "tee"
    label?: string
    productId?: string
    onClick?: () => void
    textureUrl?: string
  }>
}) {
  const count = garments.length
  const spacing = length / (count + 1)

  return (
    <group position={position} rotation={rotation}>
      {/* Vertical posts */}
      <mesh position={[-length / 2 - 0.1, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 2.4, 12]} />
        <meshStandardMaterial color={PALETTE.brass} metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[length / 2 + 0.1, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 2.4, 12]} />
        <meshStandardMaterial color={PALETTE.brass} metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Base feet */}
      <mesh position={[-length / 2 - 0.1, -0.05, 0]} castShadow>
        <boxGeometry args={[0.35, 0.06, 0.6]} />
        <meshStandardMaterial color={PALETTE.walnut} roughness={0.8} />
      </mesh>
      <mesh position={[length / 2 + 0.1, -0.05, 0]} castShadow>
        <boxGeometry args={[0.35, 0.06, 0.6]} />
        <meshStandardMaterial color={PALETTE.walnut} roughness={0.8} />
      </mesh>

      {/* Horizontal hanging bar */}
      <mesh position={[0, 2.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, length + 0.2, 16]} />
        <meshStandardMaterial color={PALETTE.brass} metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Garments */}
      {garments.map((g, i) => (
        <HangingGarment
          key={i}
          position={[-length / 2 + spacing * (i + 1), 1.5, 0]}
          color={g.color}
          type={g.type}
          label={g.label}
          swayOffset={i * 0.7}
          productId={g.productId}
          onClick={g.onClick}
          textureUrl={g.textureUrl}
        />
      ))}
    </group>
  )
}

/* ============================================================
   PEGBOARD — wall with accessories hanging on pegs
   ============================================================ */
export function Pegboard({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 4,
  height = 2.4,
  items = [],
}: {
  position?: [number, number, number]
  rotation?: [number, number, number]
  width?: number
  height?: number
  items?: Array<{
    type: "mug" | "cap" | "keychain" | "tote"
    x: number
    y: number
    color?: string
    productId?: string
    onClick?: () => void
  }>
}) {
  // Memoize the peg positions for the holes pattern
  const pegDots = useMemo(() => {
    const dots: Array<[number, number]> = []
    const cols = Math.floor(width / 0.22)
    const rows = Math.floor(height / 0.22)
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        dots.push([-width / 2 + 0.12 + i * 0.22, -height / 2 + 0.12 + j * 0.22])
      }
    }
    return dots
  }, [width, height])

  return (
    <group position={position} rotation={rotation}>
      {/* Pegboard panel */}
      <mesh receiveShadow>
        <boxGeometry args={[width, height, 0.04]} />
        <meshStandardMaterial color={PALETTE.creamDark} roughness={0.95} />
      </mesh>

      {/* Wood frame */}
      <mesh position={[0, height / 2 + 0.05, 0.01]}>
        <boxGeometry args={[width + 0.2, 0.1, 0.08]} />
        <meshStandardMaterial color={PALETTE.walnut} roughness={0.8} />
      </mesh>
      <mesh position={[0, -height / 2 - 0.05, 0.01]}>
        <boxGeometry args={[width + 0.2, 0.1, 0.08]} />
        <meshStandardMaterial color={PALETTE.walnut} roughness={0.8} />
      </mesh>
      <mesh position={[-width / 2 - 0.05, 0, 0.01]}>
        <boxGeometry args={[0.1, height, 0.08]} />
        <meshStandardMaterial color={PALETTE.walnut} roughness={0.8} />
      </mesh>
      <mesh position={[width / 2 + 0.05, 0, 0.01]}>
        <boxGeometry args={[0.1, height, 0.08]} />
        <meshStandardMaterial color={PALETTE.walnut} roughness={0.8} />
      </mesh>

      {/* Peg dots */}
      {pegDots.map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.022]}>
          <circleGeometry args={[0.02, 8]} />
          <meshStandardMaterial color={PALETTE.walnut} />
        </mesh>
      ))}

      {/* Items */}
      {items.map((item, i) => (
        <PegboardItem key={i} {...item} />
      ))}
    </group>
  )
}

function PegboardItem({
  type,
  x,
  y,
  color = PALETTE.forest,
  onClick,
  productId,
}: {
  type: "mug" | "cap" | "keychain" | "tote"
  x: number
  y: number
  color?: string
  onClick?: () => void
  productId?: string
}) {
  const ref = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const clickable = !!onClick || !!productId

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    ref.current.rotation.z = Math.sin(t * 0.8 + x * 2) * 0.04
    const s = hovered && clickable ? 1.18 : 1
    ref.current.scale.lerp(new THREE.Vector3(s, s, s), 0.2)
  })

  const handlers = clickable
    ? {
        onClick: (e: { stopPropagation: () => void }) => {
          e.stopPropagation()
          onClick?.()
        },
        onPointerOver: (e: { stopPropagation: () => void }) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = "pointer"
        },
        onPointerOut: () => {
          setHovered(false)
          document.body.style.cursor = ""
        },
      }
    : {}

  if (type === "mug") {
    return (
      <group position={[x, y, 0.15]} ref={ref} {...handlers}>
        {/* Mug body */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.1, 0.25, 24]} />
          <meshStandardMaterial color={color} roughness={0.3} />
        </mesh>
        {/* Mug handle */}
        <mesh position={[0.14, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.06, 0.018, 8, 16]} />
          <meshStandardMaterial color={color} roughness={0.3} />
        </mesh>
        {/* Logo band */}
        <mesh position={[0, 0.01, 0.121]}>
          <planeGeometry args={[0.15, 0.08]} />
          <meshStandardMaterial color={PALETTE.cream} roughness={0.4} />
        </mesh>
      </group>
    )
  }

  if (type === "cap") {
    return (
      <group position={[x, y, 0.12]} ref={ref} {...handlers}>
        <mesh position={[0, 0.05, 0]}>
          <sphereGeometry args={[0.14, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
        {/* Brim */}
        <mesh position={[0, 0.03, 0.12]} rotation={[-0.25, 0, 0]}>
          <boxGeometry args={[0.28, 0.02, 0.14]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
        {/* Front patch */}
        <mesh position={[0, 0.09, 0.095]} rotation={[0, 0, 0]}>
          <planeGeometry args={[0.1, 0.07]} />
          <meshStandardMaterial color={PALETTE.cream} />
        </mesh>
      </group>
    )
  }

  if (type === "keychain") {
    return (
      <group position={[x, y, 0.1]} ref={ref} {...handlers}>
        {/* Ring */}
        <mesh position={[0, 0.14, 0]}>
          <torusGeometry args={[0.025, 0.006, 8, 16]} />
          <meshStandardMaterial color={PALETTE.brass} metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Chain */}
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[0.008, 0.09, 0.008]} />
          <meshStandardMaterial color={PALETTE.brass} metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Pendant */}
        <mesh position={[0, -0.02, 0]}>
          <boxGeometry args={[0.12, 0.12, 0.02]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
      </group>
    )
  }

  // Tote bag
  return (
    <group position={[x, y, 0.12]} ref={ref} {...handlers}>
      {/* Handle */}
      <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.08, 0.01, 8, 16, Math.PI]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {/* Bag body */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[0.3, 0.32, 0.04]} />
        <meshStandardMaterial color={PALETTE.cream} roughness={0.95} />
      </mesh>
      {/* Logo */}
      <mesh position={[0, -0.05, 0.022]}>
        <planeGeometry args={[0.18, 0.09]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}

/* ============================================================
   PENNANT — triangular hanging flag
   ============================================================ */
export function Pennant({
  position = [0, 0, 0],
  color = PALETTE.forest,
  text = "STREAMER U",
  swayOffset = 0,
}: {
  position?: [number, number, number]
  color?: string
  text?: string
  swayOffset?: number
}) {
  const ref = useRef<THREE.Group>(null)
  const shape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0, 0.3)
    s.lineTo(1.6, 0.05)
    s.lineTo(1.6, -0.05)
    s.lineTo(0, -0.3)
    s.closePath()
    return s
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    ref.current.rotation.y = Math.sin(t * 0.7 + swayOffset) * 0.08
    ref.current.rotation.x = Math.sin(t * 0.5 + swayOffset) * 0.03
  })

  return (
    <group position={position} ref={ref}>
      {/* Flag */}
      <mesh rotation={[0, 0, 0]}>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.95} />
      </mesh>
      {/* Trim */}
      <mesh position={[0, 0.28, 0.001]}>
        <boxGeometry args={[0.04, 0.04, 0.01]} />
        <meshStandardMaterial color={PALETTE.brass} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.28, 0.001]}>
        <boxGeometry args={[0.04, 0.04, 0.01]} />
        <meshStandardMaterial color={PALETTE.brass} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Text */}
      <Text
        position={[0.5, 0, 0.01]}
        fontSize={0.13}
        color={PALETTE.cream}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.08}
      >
        {text}
      </Text>
    </group>
  )
}

/* ============================================================
   CEILING LAMP — brass library style
   ============================================================ */
export function CeilingLamp({
  position = [0, 0, 0],
  chainLength = 1.5,
  ceilingY,
}: {
  position?: [number, number, number]
  /** How far the chain extends UP from the lamp. Auto-computed from
   *  `ceilingY` when provided. */
  chainLength?: number
  /** If set, the chain stretches from the lamp position up to this
   *  absolute world-Y (so the lamp visibly attaches to the ceiling). */
  ceilingY?: number
}) {
  // If a ceilingY is given, compute the chain length so the top of the
  // chain reaches the ceiling regardless of where the lamp hangs.
  const effectiveChainLength = ceilingY != null ? Math.max(0.1, ceilingY - position[1]) : chainLength
  const chainCenterY = effectiveChainLength / 2
  return (
    <group position={position}>
      {/* Chain — reaches from lamp up to the ceiling so it doesn't float */}
      <mesh position={[0, chainCenterY, 0]}>
        <cylinderGeometry args={[0.012, 0.012, effectiveChainLength, 6]} />
        <meshStandardMaterial color={PALETTE.brass} metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Small brass cap where the chain meets the ceiling */}
      <mesh position={[0, effectiveChainLength, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.04, 12]} />
        <meshStandardMaterial color={PALETTE.brass} metalness={0.85} roughness={0.25} />
      </mesh>
      {/* Shade */}
      <mesh position={[0, 0, 0]}>
        <coneGeometry args={[0.32, 0.35, 16, 1, true]} />
        <meshStandardMaterial color={PALETTE.forest} side={THREE.DoubleSide} roughness={0.6} />
      </mesh>
      {/* Brass rim */}
      <mesh position={[0, -0.18, 0]}>
        <torusGeometry args={[0.32, 0.015, 8, 24]} />
        <meshStandardMaterial color={PALETTE.brassBright} metalness={0.95} roughness={0.1} />
      </mesh>
      {/* Bulb glow */}
      <mesh position={[0, -0.12, 0]}>
        <sphereGeometry args={[0.09, 16, 12]} />
        <meshStandardMaterial
          color="#fff2cc"
          emissive="#ffd27a"
          emissiveIntensity={2.2}
          toneMapped={false}
        />
      </mesh>
      {/* Light source */}
      <pointLight position={[0, -0.15, 0]} intensity={1.4} distance={6} color="#ffd27a" decay={1.4} />
    </group>
  )
}

/* ============================================================
   BOOKSHELF — small detail along walls
   ============================================================ */
export function Bookshelf({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: {
  position?: [number, number, number]
  rotation?: [number, number, number]
}) {
  const books = useMemo(() => {
    const arr: Array<{ w: number; h: number; color: string; x: number }> = []
    let x = -0.9
    while (x < 0.9) {
      const w = 0.06 + Math.random() * 0.05
      const h = 0.28 + Math.random() * 0.12
      const palette = [PALETTE.forest, PALETTE.red, PALETTE.navy, PALETTE.walnutLight, PALETTE.brass]
      arr.push({ w, h, color: palette[Math.floor(Math.random() * palette.length)], x })
      x += w + 0.008
    }
    return arr
  }, [])

  return (
    <group position={position} rotation={rotation}>
      {/* Shelf plank */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[2, 0.04, 0.3]} />
        <meshStandardMaterial color={PALETTE.walnut} roughness={0.7} />
      </mesh>
      {/* Back */}
      <mesh position={[0, 0.18, -0.14]}>
        <boxGeometry args={[2, 0.4, 0.02]} />
        <meshStandardMaterial color={PALETTE.walnutLight} roughness={0.8} />
      </mesh>
      {/* Books */}
      {books.map((b, i) => (
        <mesh key={i} position={[b.x + b.w / 2, b.h / 2 + 0.02, 0]} castShadow>
          <boxGeometry args={[b.w, b.h, 0.18]} />
          <meshStandardMaterial color={b.color} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

/* ============================================================
   PEDESTAL — hero product display
   ============================================================ */
export function Pedestal({
  position = [0, 0, 0],
  children,
}: {
  position?: [number, number, number]
  children?: React.ReactNode
}) {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.7, 0.8, 0.1, 32]} />
        <meshStandardMaterial color={PALETTE.walnut} roughness={0.6} />
      </mesh>
      {/* Column */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.45, 0.55, 0.9, 32]} />
        <meshStandardMaterial color={PALETTE.cream} roughness={0.85} />
      </mesh>
      {/* Top */}
      <mesh position={[0, 1.03, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.5, 0.06, 32]} />
        <meshStandardMaterial color={PALETTE.walnut} roughness={0.6} />
      </mesh>
      {/* Brass band */}
      <mesh position={[0, 0.12, 0]}>
        <torusGeometry args={[0.75, 0.015, 8, 48]} />
        <meshStandardMaterial color={PALETTE.brassBright} metalness={0.9} roughness={0.15} />
      </mesh>
      <group position={[0, 1.06, 0]}>{children}</group>
    </group>
  )
}

/* ============================================================
   WOODEN BENCH — simple dark-wood bench with brass caps on the legs.
   Reads as a "pew" lining the aisle. Primitives-only, no GLB.
   ============================================================ */
export function WoodenBench({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  length = 2.4,
}: {
  position?: [number, number, number]
  rotation?: [number, number, number]
  length?: number
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Seat slab */}
      <mesh position={[0, 0.46, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, 0.08, 0.42]} />
        <meshStandardMaterial color={PALETTE.walnut} roughness={0.75} />
      </mesh>
      {/* Apron below seat — fills the gap between legs */}
      <mesh position={[0, 0.36, 0]}>
        <boxGeometry args={[length - 0.25, 0.06, 0.3]} />
        <meshStandardMaterial color={PALETTE.walnutLight} roughness={0.85} />
      </mesh>
      {/* Legs (4 corners) */}
      {[
        [-length / 2 + 0.12, -0.22],
        [length / 2 - 0.12, -0.22],
        [-length / 2 + 0.12, 0.17],
        [length / 2 - 0.12, 0.17],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0.21, z]}>
          <mesh castShadow>
            <boxGeometry args={[0.08, 0.42, 0.08]} />
            <meshStandardMaterial color={PALETTE.walnut} roughness={0.8} />
          </mesh>
          {/* Brass cap on the leg foot */}
          <mesh position={[0, -0.22, 0]}>
            <boxGeometry args={[0.09, 0.04, 0.09]} />
            <meshStandardMaterial color={PALETTE.brassBright} metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ============================================================
   TOME STACK — a pile of 2-4 thick leather-bound books.
   Seeded by a hash of the position so the stack looks different
   per instance without rand() reshuffling each frame.
   ============================================================ */
export function TomeStack({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  seed = 0,
  count = 3,
}: {
  position?: [number, number, number]
  rotation?: [number, number, number]
  seed?: number
  count?: number
}) {
  // Deterministic pseudo-random from seed
  const rnd = (n: number) => {
    const x = Math.sin(seed * 9301 + n * 49297) * 233280
    return x - Math.floor(x)
  }
  const bookColors = [
    PALETTE.forest,
    PALETTE.walnut,
    PALETTE.navy,
    "#4a2f1a", // aged leather brown
    PALETTE.brassBright,
    "#2a4a2f", // deep forest variant
  ]

  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: count }).map((_, i) => {
        const h = 0.045 + rnd(i * 3) * 0.025
        const w = 0.26 + rnd(i * 5) * 0.08
        const d = 0.34 + rnd(i * 7) * 0.04
        const color = bookColors[Math.floor(rnd(i * 11) * bookColors.length)]
        // Stack y position: cumulative sum of heights below
        let y = 0
        for (let j = 0; j < i; j++) {
          y += 0.045 + rnd(j * 3) * 0.025
        }
        y += h / 2
        const rotY = (rnd(i * 13) - 0.5) * 0.25 // slight cocked angle per book
        const offsetX = (rnd(i * 17) - 0.5) * 0.03
        return (
          <group key={i} position={[offsetX, y, 0]} rotation={[0, rotY, 0]}>
            {/* Book body */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[w, h, d]} />
              <meshStandardMaterial color={color} roughness={0.85} />
            </mesh>
            {/* Pages (slightly inset) */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[w + 0.002, h - 0.012, d - 0.01]} />
              <meshStandardMaterial color={PALETTE.cream} roughness={0.9} />
            </mesh>
            {/* Gilt band — thin brass stripe across the spine */}
            <mesh position={[0, 0, d / 2 - 0.001]}>
              <boxGeometry args={[w + 0.004, 0.008, 0.001]} />
              <meshStandardMaterial
                color={PALETTE.brassBright}
                metalness={0.85}
                roughness={0.25}
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

/* ============================================================
   FLOATING CANDLES — wax bodies + procedural flame shader
   Two InstancedMeshes share the same bobbing offsets:
     1. Cylinder wax body (static emissive, warm glow)
     2. Flame plane (billboard-ish quad) driven by a custom GLSL
        shader — noise-animated teardrop with per-instance phase
        offset so each flame flickers independently.
   One draw call for 120 bodies + one draw call for 120 flames.
   ============================================================ */

/* Inline flame shader — teardrop silhouette (shape is alpha),
   color gradient from white-hot core to warm amber edge,
   animated by fBm-ish noise keyed to time + instance ID. */
const FLAME_VERT = /* glsl */ `
  varying vec2 vUv;
  varying float vInstancePhase;
  void main() {
    vUv = uv;
    // Pass instanceID-based phase via a varying so the fragment
    // shader can use it for per-flame unique noise.
    #ifdef USE_INSTANCING
      vInstancePhase = float(gl_InstanceID) * 0.6180339887;
    #else
      vInstancePhase = 0.0;
    #endif
    // Billboard the quad — always face the camera
    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    // Add the vertex offset in view space so the quad always faces camera
    mvPosition.xy += position.xy;
    gl_Position = projectionMatrix * mvPosition;
  }
`

const FLAME_FRAG = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying float vInstancePhase;

  // Cheap hash-based 2D noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  void main() {
    // vUv is 0..1 across the quad. Remap so origin is at flame base (bottom-center).
    vec2 p = vUv - vec2(0.5, 0.0);
    float y = vUv.y;

    // Per-flame unique time and position shift via instance phase
    float t = uTime * 3.0 + vInstancePhase * 6.28;

    // Wavy horizontal offset so the flame sways
    float sway = (noise(vec2(y * 3.0, t * 0.5)) - 0.5) * 0.14 * y;
    p.x -= sway;

    // Teardrop shape — radius narrows as y rises
    float radius = 0.28 - y * 0.22;
    float shape = 1.0 - smoothstep(radius * 0.6, radius, abs(p.x));
    // Fade bottom + top
    shape *= smoothstep(0.0, 0.08, y) * smoothstep(1.0, 0.5, y);

    // Noise flicker modulation — adds the licking tongue texture
    float flicker = noise(vec2(vUv.x * 6.0, vUv.y * 10.0 - t));
    shape *= 0.65 + flicker * 0.55;

    // Color gradient: bright core → warm edge
    vec3 core = vec3(1.0, 0.95, 0.8);
    vec3 edge = vec3(1.0, 0.6, 0.12);
    vec3 col = mix(edge, core, pow(shape, 2.2));

    // Intensity scaling so bloom picks it up cleanly
    gl_FragColor = vec4(col * shape * 2.4, shape);
  }
`

export function FloatingCandles({
  count = 120,
  xSpread = 14,
  zMin = -13,
  zMax = 3,
  yMin = 3.2,
  yMax = 4.4,
}: {
  count?: number
  xSpread?: number
  zMin?: number
  zMax?: number
  yMin?: number
  yMax?: number
}) {
  const waxRef = useRef<THREE.InstancedMesh>(null)
  const flameRef = useRef<THREE.InstancedMesh>(null)

  const offsets = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: THREE.MathUtils.randFloatSpread(xSpread),
        z: THREE.MathUtils.randFloat(zMin, zMax),
        y: THREE.MathUtils.randFloat(yMin, yMax),
        phase: Math.random() * Math.PI * 2,
      })),
    [count, xSpread, zMin, zMax, yMin, yMax]
  )
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Shared flame shader material (one per FloatingCandles instance)
  const flameMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: FLAME_VERT,
      fragmentShader: FLAME_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    })
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    // Update time uniform for flame flicker animation
    ;(flameMaterial.uniforms.uTime as { value: number }).value = t

    if (!waxRef.current || !flameRef.current) return

    for (let i = 0; i < offsets.length; i++) {
      const o = offsets[i]
      const bob = Math.sin(t + o.phase) * 0.02

      // Wax body
      dummy.position.set(o.x, o.y + bob, o.z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      waxRef.current.setMatrixAt(i, dummy.matrix)

      // Flame — slightly above the wax top (wax height 0.22, centered on o.y+bob,
      // so top at o.y + bob + 0.11; flame center at + 0.19 to give the flame room)
      dummy.position.set(o.x, o.y + bob + 0.19, o.z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      flameRef.current.setMatrixAt(i, dummy.matrix)
    }
    waxRef.current.instanceMatrix.needsUpdate = true
    flameRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      {/* Wax body — static warm glow */}
      <instancedMesh
        ref={waxRef}
        args={[undefined, undefined, count]}
        castShadow={false}
        receiveShadow={false}
      >
        <cylinderGeometry args={[0.035, 0.04, 0.22, 8]} />
        <meshStandardMaterial
          color={PALETTE.cream}
          emissive={PALETTE.brassBright}
          emissiveIntensity={0.9}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Flame — billboard quad driven by the noise shader */}
      <instancedMesh
        ref={flameRef}
        args={[undefined, undefined, count]}
        material={flameMaterial}
        castShadow={false}
        receiveShadow={false}
      >
        <planeGeometry args={[0.14, 0.24]} />
      </instancedMesh>
    </group>
  )
}
