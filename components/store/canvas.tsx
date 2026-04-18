"use client"

import { Canvas } from "@react-three/fiber"
import { ScrollControls } from "@react-three/drei"
import {
  EffectComposer,
  Bloom,
  Vignette,
  N8AO,
  GodRays,
} from "@react-three/postprocessing"
import { BlendFunction, KernelSize } from "postprocessing"
import { Suspense, useMemo, useState } from "react"
import * as THREE from "three"
import { SceneContent } from "./scene"

export default function StoreCanvas() {
  // GodRays needs a ref to a visible mesh in the scene. Using a ref
  // callback pumps the mesh into state once it mounts. A fallback Mesh
  // is used until then so GodRays can always render (EffectComposer's
  // children type doesn't accept conditional null).
  const [sun, setSun] = useState<THREE.Mesh | null>(null)
  const fallbackSun = useMemo(() => new THREE.Mesh(), [])

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
        <ScrollControls pages={2} damping={0.25} distance={1}>
          <SceneContent />
        </ScrollControls>

        {/* Sun for GodRays — larger, higher, and positioned above the
            crest so the camera catches it during both the hero approach
            AND anywhere the camera pans up. Bright enough that the rays
            read clearly through Bloom. */}
        <mesh ref={setSun} position={[0, 7.2, -13.4]}>
          <sphereGeometry args={[0.35, 24, 24]} />
          <meshBasicMaterial color="#fff2c4" toneMapped={false} />
        </mesh>

        <EffectComposer multisampling={0} enableNormalPass>
          {/* Ambient occlusion — softer intensity so corners ground
              without muddying the overall read. */}
          <N8AO
            aoRadius={0.4}
            intensity={1.2}
            distanceFalloff={0.6}
            quality="performance"
          />
          {/* God rays — cranked so the shafts are unmistakable when
              the sun is in view. KernelSize MEDIUM blurs a touch more
              for softer shafts. */}
          <GodRays
            sun={sun ?? fallbackSun}
            blendFunction={BlendFunction.SCREEN}
            samples={60}
            density={0.97}
            decay={0.92}
            weight={0.9}
            exposure={0.7}
            clampMax={1}
            kernelSize={KernelSize.MEDIUM}
            blur
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
