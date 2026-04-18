"use client"

import { Canvas } from "@react-three/fiber"
import { ScrollControls } from "@react-three/drei"
import {
  EffectComposer,
  Bloom,
  Vignette,
  N8AO,
} from "@react-three/postprocessing"
import { Suspense } from "react"
import { SceneContent } from "./scene"

export default function StoreCanvas() {
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.5]}
      // Start at the Hall of Honor pose so the first paint shows the
      // back-wall crest — matches the intro state. CameraRig snaps this
      // precisely on first useFrame regardless.
      camera={{ position: [0, 1.8, -10.5], fov: 48, near: 0.1, far: 200 }}
      gl={{ antialias: true, preserveDrawingBuffer: false, powerPreference: "high-performance" }}
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#14100c"]} />
      <Suspense fallback={null}>
        {/* pages=5 makes the full hall walk span 5 viewport-heights of
            scroll instead of 2 — one wheel tick is no longer enough to
            fling the camera straight to the Hall of Honor. */}
        <ScrollControls pages={5} damping={0.25} distance={1}>
          <SceneContent />
        </ScrollControls>

        <EffectComposer multisampling={0} enableNormalPass>
          {/* Ambient occlusion — softer intensity so corners ground
              without muddying the overall read. */}
          <N8AO
            aoRadius={0.4}
            intensity={1.2}
            distanceFalloff={0.6}
            quality="performance"
          />
          <Bloom
            intensity={0.9}
            luminanceThreshold={0.6}
            luminanceSmoothing={0.25}
            mipmapBlur
            resolutionScale={0.5}
          />
          <Vignette offset={0.3} darkness={0.72} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  )
}
