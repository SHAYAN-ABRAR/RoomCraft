import type { FurnitureItem, Room, SpaceAnalysis, Vec2 } from './types'
import { clamp, round } from './utils'

/* ----------------------------------------------------------------------------
   Footprints & oriented-bounding-box collision (SAT).
---------------------------------------------------------------------------- */

interface Obb {
  cx: number
  cz: number
  hw: number // half width  (local X)
  hd: number // half depth  (local Z)
  angle: number
}

export const itemObb = (item: FurnitureItem): Obb => ({
  cx: item.position.x,
  cz: item.position.z,
  hw: item.size.w / 2,
  hd: item.size.d / 2,
  angle: item.rotation,
})

/** World-space corners of a furniture footprint (clockwise). */
export function footprintCorners(item: FurnitureItem): Vec2[] {
  const { cx, cz, hw, hd, angle } = itemObb(item)
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const pts: [number, number][] = [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd],
  ]
  return pts.map(([x, z]) => ({ x: cx + x * c - z * s, z: cz + x * s + z * c }))
}

/** Axis-aligned bounds of a (possibly rotated) footprint. */
export function footprintAabb(item: FurnitureItem) {
  const corners = footprintCorners(item)
  const xs = corners.map((p) => p.x)
  const zs = corners.map((p) => p.z)
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minZ: Math.min(...zs),
    maxZ: Math.max(...zs),
  }
}

const project = (o: Obb, ax: number, az: number) => {
  // Half-projection radius of the OBB onto a (normalized) axis.
  const ux = Math.cos(o.angle)
  const uz = Math.sin(o.angle)
  const vx = -uz
  const vz = ux
  return o.hw * Math.abs(ux * ax + uz * az) + o.hd * Math.abs(vx * ax + vz * az)
}

/** Separating Axis Theorem overlap test for two oriented rectangles. */
export function obbOverlap(a: Obb, b: Obb, tolerance = 0.01): boolean {
  const axes: [number, number][] = [
    [Math.cos(a.angle), Math.sin(a.angle)],
    [-Math.sin(a.angle), Math.cos(a.angle)],
    [Math.cos(b.angle), Math.sin(b.angle)],
    [-Math.sin(b.angle), Math.cos(b.angle)],
  ]
  const dx = b.cx - a.cx
  const dz = b.cz - a.cz
  for (const [ax, az] of axes) {
    const dist = Math.abs(dx * ax + dz * az)
    const ra = project(a, ax, az)
    const rb = project(b, ax, az)
    if (dist > ra + rb - tolerance) return false // gap found
  }
  return true
}

export const itemsCollide = (a: FurnitureItem, b: FurnitureItem) =>
  obbOverlap(itemObb(a), itemObb(b))

/** Is a point inside an item's footprint? */
export function pointInItem(p: Vec2, item: FurnitureItem): boolean {
  const dx = p.x - item.position.x
  const dz = p.z - item.position.z
  const c = Math.cos(-item.rotation)
  const s = Math.sin(-item.rotation)
  const lx = dx * c - dz * s
  const lz = dx * s + dz * c
  return Math.abs(lx) <= item.size.w / 2 && Math.abs(lz) <= item.size.d / 2
}

/** Distance (m) from item center to the nearest interior wall face. */
export function distanceToNearestWall(item: FurnitureItem, room: Room): number {
  const aabb = footprintAabb(item)
  return Math.max(
    0,
    Math.min(aabb.minX, room.width - aabb.maxX, aabb.minZ, room.length - aabb.maxZ),
  )
}

/** Clamp an item so its footprint stays within the room interior. */
export function clampToRoom(item: FurnitureItem, room: Room): Vec2 {
  const aabb = footprintAabb(item)
  const halfX = (aabb.maxX - aabb.minX) / 2
  const halfZ = (aabb.maxZ - aabb.minZ) / 2
  return {
    x: clamp(item.position.x, halfX, room.width - halfX),
    z: clamp(item.position.z, halfZ, room.length - halfZ),
  }
}

/* ----------------------------------------------------------------------------
   Grid-based space analysis. The floor is rasterized into cells; each cell is
   tested against every footprint. This yields a true union area (no double
   counting), free %, and a walking-clearance proxy.
---------------------------------------------------------------------------- */

const STORAGE_KINDS = new Set([
  'wardrobe',
  'bookshelf',
  'dresser',
  'dressingTable',
  'cabinet',
  'nightstand',
  'tvUnit',
])

export function analyzeSpace(room: Room, items: FurnitureItem[]): SpaceAnalysis {
  const floorArea = room.width * room.length

  // Adaptive cell size keeps the grid bounded for large rooms.
  const cell = clamp(Math.min(room.width, room.length) / 80, 0.05, 0.15)
  const cols = Math.max(1, Math.ceil(room.width / cell))
  const rows = Math.max(1, Math.ceil(room.length / cell))
  const cellArea = cell * cell

  const placeable = items.filter((i) => i.kind !== 'rug')
  const occupied: Uint8Array = new Uint8Array(cols * rows)
  let occupiedCells = 0

  for (let r = 0; r < rows; r++) {
    const z = (r + 0.5) * cell
    for (let c = 0; c < cols; c++) {
      const x = (c + 0.5) * cell
      const p = { x, z }
      for (const item of placeable) {
        if (pointInItem(p, item)) {
          occupied[r * cols + c] = 1
          occupiedCells++
          break
        }
      }
    }
  }

  const occupiedArea = occupiedCells * cellArea
  const freeArea = Math.max(0, floorArea - occupiedArea)
  const coveragePct = floorArea > 0 ? (occupiedArea / floorArea) * 100 : 0
  const freePct = 100 - coveragePct

  // Largest all-free square via DP -> walking clearance proxy.
  const dp = new Int32Array(cols * rows)
  let maxSide = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c
      if (occupied[idx]) {
        dp[idx] = 0
      } else if (r === 0 || c === 0) {
        dp[idx] = 1
      } else {
        dp[idx] =
          1 +
          Math.min(
            dp[idx - 1],
            dp[idx - cols],
            dp[idx - cols - 1],
          )
      }
      if (dp[idx] > maxSide) maxSide = dp[idx]
    }
  }
  const walkway = maxSide * cell

  // Collisions (pairwise, between non-locked overlapping items).
  const collisions = new Set<string>()
  for (let i = 0; i < placeable.length; i++) {
    for (let j = i + 1; j < placeable.length; j++) {
      if (itemsCollide(placeable[i], placeable[j])) {
        collisions.add(placeable[i].id)
        collisions.add(placeable[j].id)
      }
    }
  }

  const storageVolume = items
    .filter((i) => STORAGE_KINDS.has(i.kind))
    .reduce((sum, i) => sum + i.size.w * i.size.h * i.size.d * 0.65, 0)

  // Heuristic 0–100 scores.
  const accessibility = clamp(Math.round((walkway / 1.0) * 100), 0, 100)
  const storage = clamp(
    Math.round((storageVolume / Math.max(0.001, floorArea * 0.35)) * 100),
    0,
    100,
  )
  // Comfort peaks around 55–65% free floor.
  const comfort = clamp(Math.round(100 - Math.abs(freePct - 60) * 1.7), 0, 100)

  return {
    floorArea: round(floorArea, 3),
    occupiedArea: round(occupiedArea, 3),
    freeArea: round(freeArea, 3),
    coveragePct: round(coveragePct, 1),
    freePct: round(freePct, 1),
    walkway: round(walkway, 2),
    itemCount: items.length,
    storageVolume: round(storageVolume, 3),
    collisions: [...collisions],
    scores: { comfort, storage, accessibility },
  }
}
