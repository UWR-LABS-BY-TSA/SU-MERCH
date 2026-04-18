"use client"

import { useCamState, useScrollOffset, scrollToPct } from "./scroll-store"

/* Room coordinates — match scene.tsx */
const ROOM = { xMin: -8, xMax: 8, zMin: -14, zMax: 4 }
const W = 170
const H = 190

function mapX(worldX: number) {
  return ((worldX - ROOM.xMin) / (ROOM.xMax - ROOM.xMin)) * W
}
function mapY(worldZ: number) {
  return ((worldZ - ROOM.zMin) / (ROOM.zMax - ROOM.zMin)) * H
}

const NAV_STOPS = [
  { label: "Entrance", at: 0, x: 0, z: 3.5 },
  { label: "Hoodies", at: 0.22, x: -7.3, z: -3 },
  { label: "Tees", at: 0.4, x: -7.3, z: -9 },
  { label: "Accessories", at: 0.6, x: 7.3, z: -6 },
  { label: "Hero", at: 1, x: 0, z: -13.2 },
] as const

export function Minimap() {
  const cam = useCamState()
  const scrollPct = useScrollOffset()
  const started = scrollPct > 0.02

  const px = mapX(cam.x)
  const py = mapY(cam.z)
  // heading (atan2(dx, dz)): π → looking toward -z (back wall = top of map → cone up = 0°)
  // Mapping: coneRotDeg = 180 - (heading * 180/π)
  const coneRotDeg = 180 - (cam.yaw * 180) / Math.PI

  return (
    <div
      className="pointer-events-auto absolute right-6 top-24 flex flex-col items-end gap-1 transition-opacity duration-500 md:right-10 md:top-28"
      style={{ opacity: started ? 1 : 0.35 }}
    >
      <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-background/60 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
        Floor Plan
      </span>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="rounded-sm border border-accent/40 bg-[#1a1713]/80 backdrop-blur-md"
      >
        {/* Room outline */}
        <rect
          x={1}
          y={1}
          width={W - 2}
          height={H - 2}
          fill="#251c15"
          stroke="rgba(212,168,87,0.35)"
          strokeWidth={1}
        />

        {/* Left wall: Hoodies + Tees */}
        <line
          x1={mapX(-7.9)}
          y1={mapY(-5.5)}
          x2={mapX(-7.9)}
          y2={mapY(-0.5)}
          stroke="#2d5a3f"
          strokeWidth={3}
        />
        <line
          x1={mapX(-7.9)}
          y1={mapY(-11)}
          x2={mapX(-7.9)}
          y2={mapY(-7)}
          stroke="#2d5a3f"
          strokeWidth={3}
        />

        {/* Right wall: Accessories */}
        <line
          x1={mapX(7.9)}
          y1={mapY(-10)}
          x2={mapX(7.9)}
          y2={mapY(-2)}
          stroke="#b08a3e"
          strokeWidth={3}
        />

        {/* Back wall: Hero */}
        <line
          x1={mapX(-2.5)}
          y1={mapY(-13.8)}
          x2={mapX(2.5)}
          y2={mapY(-13.8)}
          stroke="#d4a857"
          strokeWidth={3}
        />


        {/* Nav stops — clickable */}
        {NAV_STOPS.map((s) => (
          <g
            key={s.label}
            onClick={() => scrollToPct(s.at)}
            style={{ cursor: "pointer" }}
          >
            <circle
              cx={mapX(s.x)}
              cy={mapY(s.z)}
              r={6}
              fill="rgba(255,255,255,0.05)"
              stroke="rgba(255,255,255,0.25)"
              strokeDasharray="2 2"
            />
          </g>
        ))}

        {/* Camera view cone */}
        <g transform={`translate(${px} ${py}) rotate(${coneRotDeg})`}>
          <path
            d={`M 0 0 L -14 -28 L 14 -28 Z`}
            fill="rgba(244,230,200,0.18)"
            stroke="rgba(244,230,200,0.5)"
            strokeWidth={1}
          />
          <circle cx={0} cy={0} r={3.5} fill="#f1e6c8" stroke="#1a1713" strokeWidth={1} />
        </g>
      </svg>
    </div>
  )
}
