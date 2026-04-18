"use client"

import { useEffect, useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { useScroll, Text, Environment, useTexture } from "@react-three/drei"
import * as THREE from "three"
import {
  PALETTE,
  GarmentRack,
  Pegboard,
  Pennant,
  CeilingLamp,
  Bookshelf,
  Pedestal,
  HangingGarment,
} from "./primitives"
import { setScrollOffset, setScrollEl, setCamState } from "./scroll-store"
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
  { t: 0.85, pos: [0, 1.7, -8.5], look: [0, 1.85, -13.9] }, // approach hero wall
  { t: 1.0, pos: [0, 1.8, -10.5], look: [0, 1.9, -13.9] },  // hero reveal
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
    const CLICK_THRESHOLD = 6 // pixels — under this is a click, over this is a drag
    const onDown = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null
      if (!el || el.tagName !== "CANVAS") return
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
      const sEl = scroll.el as HTMLElement
      if (sEl) {
        // Drag UP (negative dy) scrolls forward into the store.
        sEl.scrollTop = Math.max(
          0,
          Math.min(sEl.scrollHeight - sEl.clientHeight, sEl.scrollTop - dy * 1.2)
        )
      }
    }
    const onUp = () => {
      if (dragState.current) dragState.current.down = false
      document.body.style.cursor = ""
    }
    window.addEventListener("pointerdown", onDown)
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    return () => {
      window.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
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

    /* Publish camera pose for minimap */
    const dir = new THREE.Vector3().subVectors(targetLook.current, camera.position)
    const heading = Math.atan2(dir.x, dir.z)
    setCamState(camera.position.x, camera.position.z, heading)
  })

  return null
}

/* ============================================================
   Floor — PBR wood plank floor with center rug
   ============================================================ */
function Floor() {
  const [woodMap, woodRough, woodNormal] = useTexture([
    "https://threejs.org/examples/textures/hardwood2_diffuse.jpg",
    "https://threejs.org/examples/textures/hardwood2_roughness.jpg",
    "https://threejs.org/examples/textures/hardwood2_bump.jpg",
  ])

  useMemo(() => {
    ;[woodMap, woodRough, woodNormal].forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.repeat.set(4, 5)
      t.anisotropy = 8
    })
  }, [woodMap, woodRough, woodNormal])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -5]} receiveShadow>
        <planeGeometry args={[16, 20]} />
        <meshStandardMaterial
          map={woodMap}
          roughnessMap={woodRough}
          normalMap={woodNormal}
          normalScale={new THREE.Vector2(0.35, 0.35)}
          roughness={1}
        />
      </mesh>
      {/* Center rug */}
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
    </group>
  )
}

function Ceiling() {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5, -5]}>
      <planeGeometry args={[16, 20]} />
      <meshStandardMaterial color={PALETTE.charcoal} roughness={1} />
    </mesh>
  )
}

function Walls() {
  return (
    <group>
      {/* Left wall */}
      <mesh position={[-8, 2.5, -5]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 5]} />
        <meshStandardMaterial color={PALETTE.cream} roughness={0.95} />
      </mesh>
      {/* Right wall */}
      <mesh position={[8, 2.5, -5]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 5]} />
        <meshStandardMaterial color={PALETTE.cream} roughness={0.95} />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, 2.5, -14]} receiveShadow>
        <planeGeometry args={[16, 5]} />
        <meshStandardMaterial color={PALETTE.forest} roughness={0.9} />
      </mesh>
      {/* Entrance wall (with opening suggested by door frame) */}
      <mesh position={[0, 2.5, 4]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[16, 5]} />
        <meshStandardMaterial color={PALETTE.cream} roughness={0.95} />
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

      {/* Crown molding */}
      <mesh position={[-7.98, 4.85, -5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[20, 0.25]} />
        <meshStandardMaterial color={PALETTE.walnut} />
      </mesh>
      <mesh position={[7.98, 4.85, -5]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[20, 0.25]} />
        <meshStandardMaterial color={PALETTE.walnut} />
      </mesh>
    </group>
  )
}

/* Pennant string across the room width */
function PennantString() {
  const count = 10
  const xStart = -6
  const xEnd = 6
  const dx = (xEnd - xStart) / count
  const colors = [PALETTE.forest, PALETTE.brass, PALETTE.cream, PALETTE.red]
  const texts = ["SU", "KAI", "CAMPUS", "EST 24", "GO SU"]

  return (
    <group>
      <mesh position={[0, 4.3, -3]}>
        <boxGeometry args={[Math.abs(xEnd - xStart), 0.01, 0.01]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {Array.from({ length: count }).map((_, i) => {
        const x = xStart + dx * i
        const color = colors[i % colors.length]
        const text = texts[i % texts.length]
        return (
          <group key={i} position={[x, 4.25, -3]}>
            <Pennant color={color} text={text} swayOffset={i * 0.5} />
          </group>
        )
      })}
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

      {/* Lighting */}
      <ambientLight intensity={0.4} color="#fff3d6" />
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.45}
        color="#fff0d0"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <Environment preset="apartment" />
      <fog attach="fog" args={["#1a1713", 10, 28]} />

      <Floor />
      <Ceiling />
      <Walls />

      {/* Ceiling lamps */}
      <CeilingLamp position={[-3, 4.2, 0]} />
      <CeilingLamp position={[3, 4.2, 0]} />
      <CeilingLamp position={[-3, 4.2, -6]} />
      <CeilingLamp position={[3, 4.2, -6]} />
      <CeilingLamp position={[0, 4.2, -11]} />

      <PennantString />

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
          position={[0, 0.1, 0.12]}
          fontSize={0.2}
          color={PALETTE.forest}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.08}
        >
          STREAMER UNIVERSITY
        </Text>
        <Text
          position={[0, -0.17, 0.12]}
          fontSize={0.09}
          color={PALETTE.walnut}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.3}
        >
          THE OFFICIAL CAMPUS STORE · EST. 2024
        </Text>
      </group>

      {/* ===== LEFT WALL: HOODIES + TEES ===== */}
      <group position={[-6.2, 0, -3]} rotation={[0, Math.PI / 2, 0]}>
        <GarmentRack
          position={[0, 0, 0]}
          length={5}
          garments={[
            { color: PALETTE.forest, type: "hoodie", label: "SU", productId: "su-crest-hoodie", onClick: () => openProduct("su-crest-hoodie") },
            { color: PALETTE.charcoal, type: "hoodie", label: "KAI", productId: "kai-hoodie", onClick: () => openProduct("kai-hoodie") },
            { color: PALETTE.cream, type: "hoodie", label: "SU", productId: "su-crest-hoodie", onClick: () => openProduct("su-crest-hoodie") },
            { color: PALETTE.forestLight, type: "hoodie", label: "24", productId: "su-crest-hoodie", onClick: () => openProduct("su-crest-hoodie") },
            { color: PALETTE.walnut, type: "hoodie", label: "VARSITY", productId: "varsity-hoodie", onClick: () => openProduct("varsity-hoodie") },
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

      {/* ===== BACK WALL: HERO LOGO ===== */}
      <group position={[0, 2.9, -13.9]}>
        <Text
          fontSize={0.95}
          color={PALETTE.brassBright}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.1}
        >
          SU
        </Text>
        <Text
          position={[0, -0.8, 0]}
          fontSize={0.24}
          color={PALETTE.cream}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.3}
        >
          STREAMER UNIVERSITY
        </Text>
        <Text
          position={[0, -1.15, 0]}
          fontSize={0.1}
          color={PALETTE.brass}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.4}
        >
          CLASS OF 2024 · ESTABLISHED BY KAI CENAT
        </Text>
      </group>

      {/* Hero pedestals in front of back wall */}
      <group position={[-1.8, 0, -11.5]}>
        <Pedestal>
          <HangingGarment
            position={[0, 0.4, 0]}
            color={PALETTE.forest}
            type="hoodie"
            label="SU"
            productId="su-crest-hoodie"
            onClick={() => openProduct("su-crest-hoodie")}
          />
        </Pedestal>
      </group>
      <group position={[1.8, 0, -11.5]}>
        <Pedestal>
          <HangingGarment
            position={[0, 0.4, 0]}
            color={PALETTE.cream}
            type="hoodie"
            label="KAI"
            productId="kai-hoodie"
            onClick={() => openProduct("kai-hoodie")}
          />
        </Pedestal>
      </group>

      {/* Center pedestal removed — it blocked sight lines to the accessories wall. */}

      {/* Hero accent lighting */}
      <pointLight position={[0, 4, -12]} intensity={2.2} distance={9} color="#ffe4a8" />
      <pointLight position={[-2.5, 3.5, -11]} intensity={1.2} distance={5} color="#fff0d0" />
      <pointLight position={[2.5, 3.5, -11]} intensity={1.2} distance={5} color="#fff0d0" />
      <pointLight position={[0, 3.8, -6]} intensity={1.5} distance={6} color="#fff0d0" />
      <pointLight position={[-6, 3.5, -6]} intensity={0.9} distance={5} color="#fff0d0" />
      <pointLight position={[6, 3.5, -6]} intensity={0.9} distance={5} color="#fff0d0" />

      {/* Decorative bookshelves flanking the back wall */}
      <Bookshelf position={[-7.5, 2.3, -13.5]} rotation={[0, 0, 0]} />
      <Bookshelf position={[7.5, 2.3, -13.5]} rotation={[0, 0, 0]} />

      {/* Corner columns */}
      {[[-7.8, 3.95], [7.8, 3.95], [-7.8, -13.8], [7.8, -13.8]].map(([x, z], i) => (
        <mesh key={i} position={[x, 2.5, z]}>
          <boxGeometry args={[0.3, 5, 0.3]} />
          <meshStandardMaterial color={PALETTE.walnut} roughness={0.8} />
        </mesh>
      ))}
    </>
  )
}
