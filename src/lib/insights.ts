import type { FurnitureItem, Opening, Room, SpaceAnalysis, Unit } from './types'
import { footprintAabb } from './geometry'
import { formatLength } from './units'

export interface Insight {
  tone: 'good' | 'warn' | 'bad' | 'info'
  text: string
}

interface Rect {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

/** Floor zone (room coords) that should stay clear in front of an opening. */
function clearanceZone(o: Opening, room: Room, depth: number): Rect {
  const half = o.width / 2
  switch (o.wall) {
    case 'north':
      return { minX: o.offset - half, maxX: o.offset + half, minZ: 0, maxZ: depth }
    case 'south':
      return { minX: o.offset - half, maxX: o.offset + half, minZ: room.length - depth, maxZ: room.length }
    case 'west':
      return { minX: 0, maxX: depth, minZ: o.offset - half, maxZ: o.offset + half }
    case 'east':
      return { minX: room.width - depth, maxX: room.width, minZ: o.offset - half, maxZ: o.offset + half }
  }
}

const overlaps = (a: Rect, b: Rect) =>
  a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ

export function buildInsights(
  room: Room,
  furniture: FurnitureItem[],
  analysis: SpaceAnalysis,
  unit: Unit,
): Insight[] {
  const out: Insight[] = []

  if (furniture.length === 0) {
    out.push({ tone: 'info', text: 'Add furniture from the left panel, or ask the AI assistant to design the room for you.' })
    return out
  }

  if (analysis.collisions.length > 0) {
    out.push({ tone: 'bad', text: `${analysis.collisions.length} item${analysis.collisions.length > 1 ? 's' : ''} overlap — nudge them apart to clear the red zones.` })
  }

  // Door / window blocking
  const placeable = furniture.filter((f) => f.kind !== 'rug')
  for (const o of room.openings) {
    const depth = o.type === 'door' ? 0.9 : 0.6
    const zone = clearanceZone(o, room, depth)
    const blocker = placeable.find((f) => overlaps(footprintAabb(f), zone))
    if (blocker) {
      out.push(
        o.type === 'door'
          ? { tone: 'bad', text: `The ${blocker.name.toLowerCase()} blocks the doorway — keep it clear for access.` }
          : { tone: 'warn', text: `The ${blocker.name.toLowerCase()} sits in front of a window and may block natural light.` },
      )
    }
  }

  // Walking clearance
  if (analysis.walkway < 0.6) {
    out.push({ tone: 'bad', text: `Walking space is very tight (${formatLength(analysis.walkway, unit)}). Aim for at least ${formatLength(0.9, unit)}.` })
  } else if (analysis.walkway < 0.9) {
    out.push({ tone: 'warn', text: `Walking clearance is a little snug (${formatLength(analysis.walkway, unit)}).` })
  } else {
    out.push({ tone: 'good', text: `Comfortable walking clearance (${formatLength(analysis.walkway, unit)}).` })
  }

  // Crowding
  if (analysis.coveragePct > 62) {
    out.push({ tone: 'warn', text: `Room is ${analysis.coveragePct}% covered — it's getting crowded. Removing one piece would open it up.` })
  } else if (analysis.coveragePct < 15) {
    out.push({ tone: 'good', text: `Plenty of open floor — ${analysis.freePct}% of the room is free.` })
  }

  return out
}
