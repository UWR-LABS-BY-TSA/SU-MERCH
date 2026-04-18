"use client"

import { useRef, useMemo, useState, Suspense, type ReactNode } from "react"
import { useFrame } from "@react-three/fiber"
import { Text, useGLTF } from "@react-three/drei"
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
   Color palette — Streamer University collegiate
   ============================================================ */
export const PALETTE = {
  forest: "#1b3a2b", // deep forest green (primary)
  forestLight: "#2d5a3f",
  cream: "#f1e6c8", // parchment
  creamDark: "#d9c89a",
  brass: "#b08a3e",
  brassBright: "#d4a857",
  walnut: "#3a2418", // dark wood
  walnutLight: "#6b4528",
  ivory: "#f7f1e1",
  off: "#e8dcc0",
  charcoal: "#1a1713",
  white: "#f8f4ea",
  red: "#7a1f1f",
  navy: "#1a2a40",
}

/* ============================================================
   HANGING GARMENT (hoodie / tee)
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
}: {
  position?: [number, number, number]
  color?: string
  accentColor?: string
  type?: "hoodie" | "tee"
  label?: string
  swayOffset?: number
  onClick?: () => void
  productId?: string
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
export function CeilingLamp({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Chain */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 1, 6]} />
        <meshStandardMaterial color={PALETTE.brass} metalness={0.8} roughness={0.3} />
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
