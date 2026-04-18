"use client"

import { Canvas } from "@react-three/fiber"
import { ScrollControls } from "@react-three/drei"
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing"
import { Suspense } from "react"
import { SceneContent } from "./scene"

export default function StoreCanvas() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [0, 1.7, 9], fov: 48, near: 0.1, far: 200 }}
      gl={{ antialias: true, preserveDrawingBuffer: false }}
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#1a1713"]} />
      <Suspense fallback={null}>
        <ScrollControls pages={2} damping={0.25} distance={1}>
          <SceneContent />
        </ScrollControls>
        <EffectComposer>
          <Bloom intensity={0.45} luminanceThreshold={0.7} luminanceSmoothing={0.25} mipmapBlur />
          <Vignette offset={0.3} darkness={0.55} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  )
}
