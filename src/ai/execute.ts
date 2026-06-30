import { useDesignStore } from '@/store/useDesignStore'
import { footprintAabb } from '@/lib/geometry'
import { clamp } from '@/lib/utils'
import { CATALOG_BY_KIND } from '@/data/catalog'
import type { FurnitureItem, Vec2 } from '@/lib/types'
import type { AIAction } from './types'

function targetItems(target: string): FurnitureItem[] {
  const s = useDesignStore.getState()
  if (target === 'all') return s.furniture
  if (target === 'selected') {
    const sel = s.furniture.find((f) => f.id === s.selectedId)
    return sel ? [sel] : []
  }
  // most-recently-added item of a kind
  const matches = s.furniture.filter((f) => f.kind === target)
  return matches.length ? [matches[matches.length - 1]] : []
}

function anchorPosition(item: FurnitureItem, to: string): Vec2 {
  const s = useDesignStore.getState()
  const room = s.room!
  const aabb = footprintAabb(item)
  const halfX = (aabb.maxX - aabb.minX) / 2
  const halfZ = (aabb.maxZ - aabb.minZ) / 2
  const m = 0.06
  const cx = room.width / 2
  const cz = room.length / 2
  switch (to) {
    case 'left': return { x: halfX + m, z: cz }
    case 'right': return { x: room.width - halfX - m, z: cz }
    case 'back': return { x: cx, z: halfZ + m }
    case 'front': return { x: cx, z: room.length - halfZ - m }
    default: return { x: cx, z: cz }
  }
}

/** Apply a list of AI actions to the live design. Returns count applied. */
export function executeActions(actions: AIAction[]): number {
  const store = useDesignStore.getState
  let applied = 0

  for (const a of actions) {
    const s = store()
    if (!s.room) break

    switch (a.type) {
      case 'add': {
        const count = clamp(a.count ?? 1, 1, 8)
        const base = CATALOG_BY_KIND[a.item]?.size
        if (!base) break
        for (let i = 0; i < count; i++) {
          const id = s.addFurniture(a.item)
          if (!id) continue
          const size = {
            w: a.width ? clamp(a.width, 0.2, 6) : base.w,
            h: a.height ? clamp(a.height, 0.2, 4) : base.h,
            d: a.depth ? clamp(a.depth, 0.2, 4) : base.d,
          }
          const patch: Partial<FurnitureItem> = { size }
          if (a.material) patch.material = a.material
          if (a.params) {
            const cur = store().furniture.find((f) => f.id === id)
            patch.params = { ...(cur?.params ?? {}), ...a.params }
          }
          store().patchFurniture(id, patch)
        }
        applied++
        break
      }

      case 'configure': {
        const items = targetItems(a.target)
        if (items.length) {
          s.beginInteraction()
          items.forEach((it) => store().patchFurniture(it.id, { params: { ...it.params, ...a.params } }))
          applied++
        }
        break
      }

      case 'remove': {
        const items = targetItems(a.target)
        items.forEach((it) => store().removeFurniture(it.id))
        if (items.length) applied++
        break
      }

      case 'clear':
        s.clearFurniture()
        applied++
        break

      case 'move': {
        const [it] = targetItems(a.target)
        if (it) {
          s.beginInteraction()
          store().patchFurniture(it.id, { position: anchorPosition(it, a.to) })
          applied++
        }
        break
      }

      case 'resize': {
        const [it] = targetItems(a.target)
        if (it) {
          s.beginInteraction()
          store().patchFurniture(it.id, {
            size: {
              w: a.width ? clamp(a.width, 0.2, 6) : it.size.w,
              h: a.height ? clamp(a.height, 0.2, 4) : it.size.h,
              d: a.depth ? clamp(a.depth, 0.2, 4) : it.size.d,
            },
          })
          applied++
        }
        break
      }

      case 'material': {
        const items = targetItems(a.target)
        if (items.length) {
          s.beginInteraction()
          items.forEach((it) => store().patchFurniture(it.id, { material: a.material }))
          applied++
        }
        break
      }

      case 'style':
        s.applyStyle(a.style)
        applied++
        break

      case 'view':
        s.setView(a.mode)
        applied++
        break
    }
  }
  return applied
}
