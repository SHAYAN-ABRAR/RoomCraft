import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Opening, Room, WallSide } from '@/lib/types'
import { useDesignStore } from '@/store/useDesignStore'
import { pbrProps } from './materials'

interface Seg {
  u0: number
  u1: number
  v0: number
  v1: number
}

/** Solid rectangles that remain after subtracting openings from a wall. */
function wallSegments(length: number, height: number, ops: Opening[]): Seg[] {
  const sorted = [...ops].sort((a, b) => a.offset - b.offset)
  const segs: Seg[] = []
  let cursor = 0
  for (const o of sorted) {
    const s = Math.max(0, o.offset - o.width / 2)
    const e = Math.min(length, o.offset + o.width / 2)
    if (s > cursor) segs.push({ u0: cursor, u1: s, v0: 0, v1: height })
    if (o.sill > 0) segs.push({ u0: s, u1: e, v0: 0, v1: o.sill }) // under window
    const top = o.sill + o.height
    if (top < height) segs.push({ u0: s, u1: e, v0: top, v1: height }) // header
    cursor = Math.max(cursor, e)
  }
  if (cursor < length) segs.push({ u0: cursor, u1: length, v0: 0, v1: height })
  return segs
}

/** Map a wall-local rectangle to world position + size. */
function place(
  side: WallSide,
  room: Room,
  uC: number,
  vC: number,
  uS: number,
  vS: number,
  boxT: number,
): { position: [number, number, number]; size: [number, number, number] } {
  const T = room.wallThickness
  switch (side) {
    case 'north':
      return { position: [uC, vC, -T / 2], size: [uS, vS, boxT] }
    case 'south':
      return { position: [uC, vC, room.length + T / 2], size: [uS, vS, boxT] }
    case 'west':
      return { position: [-T / 2, vC, uC], size: [boxT, vS, uS] }
    case 'east':
      return { position: [room.width + T / 2, vC, uC], size: [boxT, vS, uS] }
  }
}

const SIDES: WallSide[] = ['north', 'south', 'east', 'west']

export function Room3D({ room }: { room: Room }) {
  const renderStyle = useDesignStore((s) => s.renderStyle)
  const wireframe = renderStyle === 'wireframe'

  const wallMats = useMemo(() => {
    const make = () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(room.wallColor),
        roughness: 0.96,
        metalness: 0,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
        wireframe,
      })
    return { north: make(), south: make(), east: make(), west: make() } as Record<
      WallSide,
      THREE.MeshStandardMaterial
    >
  }, [room.wallColor, wireframe])

  const segments = useMemo(() => {
    const result: Record<WallSide, Seg[]> = { north: [], south: [], east: [], west: [] }
    for (const side of SIDES) {
      const len = side === 'north' || side === 'south' ? room.width : room.length
      const ops = room.openings.filter((o) => o.wall === side)
      result[side] = wallSegments(len, room.height, ops)
    }
    return result
  }, [room.width, room.length, room.height, room.openings])

  const windows = room.openings.filter((o) => o.type === 'window')

  // Auto dollhouse: fade whichever walls sit between the camera and interior.
  useFrame(({ camera }) => {
    const cx = room.width / 2
    const cz = room.length / 2
    const target: Record<WallSide, number> = {
      north: camera.position.z < cz ? 0.06 : 1,
      south: camera.position.z > cz ? 0.06 : 1,
      west: camera.position.x < cx ? 0.06 : 1,
      east: camera.position.x > cx ? 0.06 : 1,
    }
    for (const side of SIDES) {
      const m = wallMats[side]
      m.opacity = THREE.MathUtils.lerp(m.opacity, target[side], 0.18)
      m.depthWrite = m.opacity > 0.6
    }
  })

  return (
    <group>
      {/* Floor */}
      <mesh position={[room.width / 2, -0.025, room.length / 2]} receiveShadow>
        <boxGeometry args={[room.width, 0.05, room.length]} />
        <meshPhysicalMaterial {...pbrProps(room.floorMaterial)} wireframe={wireframe} />
      </mesh>

      {/* Walls */}
      {SIDES.map((side) =>
        segments[side].map((seg, i) => {
          const uC = (seg.u0 + seg.u1) / 2
          const vC = (seg.v0 + seg.v1) / 2
          const uS = Math.max(0.001, seg.u1 - seg.u0)
          const vS = Math.max(0.001, seg.v1 - seg.v0)
          const { position, size } = place(side, room, uC, vC, uS, vS, room.wallThickness)
          return (
            <mesh key={`${side}-${i}`} position={position} material={wallMats[side]} castShadow receiveShadow>
              <boxGeometry args={size} />
            </mesh>
          )
        }),
      )}

      {/* Window glazing */}
      {windows.map((o) => {
        const len = o.wall === 'north' || o.wall === 'south' ? room.width : room.length
        const uC = Math.min(Math.max(o.offset, o.width / 2), len - o.width / 2)
        const vC = o.sill + o.height / 2
        const { position, size } = place(o.wall, room, uC, vC, o.width - 0.06, o.height - 0.06, 0.02)
        return (
          <mesh key={o.id} position={position}>
            <boxGeometry args={size} />
            <meshPhysicalMaterial color="#cfe2ee" roughness={0.04} transmission={0.92} transparent opacity={0.45} thickness={0.05} ior={1.45} metalness={0} />
          </mesh>
        )
      })}
    </group>
  )
}
