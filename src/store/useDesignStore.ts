import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type {
  DesignStyle,
  FurnitureItem,
  FurnitureKind,
  MaterialKind,
  Opening,
  OpeningType,
  RenderStyle,
  Room,
  SpaceAnalysis,
  Unit,
  Vec2,
  ViewMode,
} from '@/lib/types'
import {
  analyzeSpace,
  clampToRoom,
  itemsCollide,
} from '@/lib/geometry'
import { createFurniture } from '@/data/catalog'
import { STYLE_BY_ID, styleMaterialFor } from '@/data/styles'
import { clamp, round, uid } from '@/lib/utils'

type Phase = 'onboarding' | 'editor'

interface Snapshot {
  room: Room | null
  furniture: FurnitureItem[]
  selectedId: string | null
}

interface DesignState {
  phase: Phase
  room: Room | null
  furniture: FurnitureItem[]
  selectedId: string | null
  hoveredId: string | null

  view: ViewMode
  renderStyle: RenderStyle
  unit: Unit
  designStyle: DesignStyle | null
  gridSnap: boolean
  snapToWalls: boolean
  showDimensions: boolean
  /** Read-only viewer (opened via a share link). */
  viewOnly: boolean

  analysis: SpaceAnalysis

  past: Snapshot[]
  future: Snapshot[]

  // ── lifecycle
  createRoom: (room: Room) => void
  updateRoom: (patch: Partial<Room>) => void
  patchRoom: (patch: Partial<Room>) => void
  loadDesign: (room: Room, furniture: FurnitureItem[], opts?: { viewOnly?: boolean }) => void
  setViewOnly: (viewOnly: boolean) => void
  resetAll: () => void
  clearFurniture: () => void

  // ── openings (doors & windows)
  addOpening: (type: OpeningType) => void
  updateOpening: (id: string, patch: Partial<Opening>) => void
  removeOpening: (id: string) => void

  // ── furniture
  addFurniture: (kind: FurnitureKind, position?: Vec2) => string
  addItem: (item: FurnitureItem) => string
  updateFurniture: (id: string, patch: Partial<FurnitureItem>) => void
  patchFurniture: (id: string, patch: Partial<FurnitureItem>) => void
  moveFurniture: (id: string, position: Vec2) => void
  rotateFurniture: (id: string, deltaRad: number) => void
  nudgeFurniture: (id: string, dx: number, dz: number) => void
  setMaterial: (id: string, material: MaterialKind) => void
  removeFurniture: (id: string) => void
  duplicateFurniture: (id: string) => string | null
  toggleLock: (id: string) => void

  // ── selection / view
  select: (id: string | null) => void
  hover: (id: string | null) => void
  setView: (view: ViewMode) => void
  setRenderStyle: (style: RenderStyle) => void
  setUnit: (unit: Unit) => void
  toggleGridSnap: () => void
  toggleWallSnap: () => void
  toggleDimensions: () => void

  // ── styling
  applyStyle: (style: DesignStyle) => void

  // ── history
  beginInteraction: () => void
  undo: () => void
  redo: () => void

  // ── internal
  _recompute: () => void
}

const EMPTY_ANALYSIS: SpaceAnalysis = {
  floorArea: 0,
  occupiedArea: 0,
  freeArea: 0,
  coveragePct: 0,
  freePct: 100,
  walkway: 0,
  itemCount: 0,
  storageVolume: 0,
  collisions: [],
  scores: { comfort: 0, storage: 0, accessibility: 0 },
}

const GRID = 0.05 // 5cm snapping grid
const snap = (v: number) => Math.round(v / GRID) * GRID

/** Find a non-colliding spot for a new item; falls back to room center. */
function placeItem(room: Room, items: FurnitureItem[], item: FurnitureItem): Vec2 {
  const tryPos = (x: number, z: number): Vec2 | null => {
    const candidate = { ...item, position: { x, z } }
    candidate.position = clampToRoom(candidate, room)
    const hit = items.some((o) => o.kind !== 'rug' && itemsCollide(candidate, o))
    return hit ? null : candidate.position
  }

  const center = tryPos(room.width / 2, room.length / 2)
  if (center) return center

  const margin = Math.max(item.size.w, item.size.d) / 2 + 0.1
  const step = 0.4
  for (let z = margin; z <= room.length - margin; z += step) {
    for (let x = margin; x <= room.width - margin; x += step) {
      const p = tryPos(x, z)
      if (p) return p
    }
  }
  return clampToRoom({ ...item, position: { x: room.width / 2, z: room.length / 2 } }, room)
}

export const useDesignStore = create<DesignState>()(
  persist(
    (set, get) => {
      const snapshot = (): Snapshot => {
        const s = get()
        return {
          room: s.room ? { ...s.room, openings: [...s.room.openings] } : null,
          furniture: s.furniture.map((f) => ({ ...f, position: { ...f.position }, size: { ...f.size } })),
          selectedId: s.selectedId,
        }
      }

      const pushHistory = () =>
        set((s) => ({ past: [...s.past.slice(-49), snapshot()], future: [] }))

      const recompute = () =>
        set((s) => ({
          analysis: s.room ? analyzeSpace(s.room, s.furniture) : EMPTY_ANALYSIS,
        }))

      return {
        phase: 'onboarding',
        room: null,
        furniture: [],
        selectedId: null,
        hoveredId: null,
        view: 'orbit',
        renderStyle: 'realistic',
        unit: 'ft',
        designStyle: null,
        gridSnap: true,
        snapToWalls: true,
        showDimensions: true,
        viewOnly: false,
        analysis: EMPTY_ANALYSIS,
        past: [],
        future: [],

        createRoom: (room) => {
          set({ room, furniture: [], selectedId: null, phase: 'editor', past: [], future: [] })
          recompute()
        },

        updateRoom: (patch) => {
          if (!get().room) return
          pushHistory()
          set((s) => ({ room: { ...s.room!, ...patch } }))
          // Keep furniture inside the (possibly resized) room.
          set((s) => ({
            furniture: s.furniture.map((f) => ({ ...f, position: clampToRoom(f, s.room!) })),
          }))
          recompute()
        },

        patchRoom: (patch) => {
          if (!get().room) return
          set((s) => ({ room: { ...s.room!, ...patch } }))
          set((s) => ({
            furniture: s.furniture.map((f) => ({ ...f, position: clampToRoom(f, s.room!) })),
          }))
          recompute()
        },

        addOpening: (type) => {
          const room = get().room
          if (!room) return
          pushHistory()
          const opening: Opening =
            type === 'door'
              ? { id: uid('o'), type: 'door', wall: 'south', offset: room.width / 2, width: 0.9, height: 2.1, sill: 0 }
              : { id: uid('o'), type: 'window', wall: 'north', offset: room.width / 2, width: 1.4, height: 1.2, sill: 0.9 }
          set((s) => ({ room: { ...s.room!, openings: [...s.room!.openings, opening] } }))
        },

        updateOpening: (id, patch) => {
          set((s) => ({
            room: s.room
              ? { ...s.room, openings: s.room.openings.map((o) => (o.id === id ? { ...o, ...patch } : o)) }
              : s.room,
          }))
        },

        removeOpening: (id) => {
          pushHistory()
          set((s) => ({
            room: s.room ? { ...s.room, openings: s.room.openings.filter((o) => o.id !== id) } : s.room,
          }))
        },

        loadDesign: (room, furniture, opts) => {
          set({
            room,
            furniture,
            selectedId: null,
            phase: 'editor',
            viewOnly: !!opts?.viewOnly,
            past: [],
            future: [],
          })
          recompute()
        },

        setViewOnly: (viewOnly) => set({ viewOnly }),

        resetAll: () => {
          set({
            phase: 'onboarding',
            room: null,
            furniture: [],
            selectedId: null,
            hoveredId: null,
            designStyle: null,
            viewOnly: false,
            past: [],
            future: [],
            analysis: EMPTY_ANALYSIS,
          })
        },

        clearFurniture: () => {
          pushHistory()
          set({ furniture: [], selectedId: null })
          recompute()
        },

        addFurniture: (kind, position) => {
          const room = get().room
          if (!room) return ''
          pushHistory()
          const base = createFurniture(kind)
          base.position = position
            ? clampToRoom({ ...base, position }, room)
            : placeItem(room, get().furniture, base)
          // Match the active style if one is applied.
          const style = get().designStyle
          if (style) {
            const mat = styleMaterialFor(kind, STYLE_BY_ID[style])
            if (mat) base.material = mat
          }
          set((s) => ({ furniture: [...s.furniture, base], selectedId: base.id }))
          recompute()
          return base.id
        },

        addItem: (item) => {
          const room = get().room
          if (!room) return ''
          pushHistory()
          const placed = { ...item, position: clampToRoom(item, room) }
          set((s) => ({ furniture: [...s.furniture, placed], selectedId: placed.id }))
          recompute()
          return placed.id
        },

        updateFurniture: (id, patch) => {
          pushHistory()
          set((s) => ({
            furniture: s.furniture.map((f) => (f.id === id ? { ...f, ...patch } : f)),
          }))
          set((s) => ({
            furniture: s.furniture.map((f) =>
              f.id === id && s.room ? { ...f, position: clampToRoom(f, s.room) } : f,
            ),
          }))
          recompute()
        },

        patchFurniture: (id, patch) => {
          // Live edit (no history push) — for sliders / continuous controls.
          set((s) => ({
            furniture: s.furniture.map((f) =>
              f.id === id ? { ...f, ...patch, size: { ...f.size, ...patch.size } } : f,
            ),
          }))
          set((s) => ({
            furniture: s.furniture.map((f) =>
              f.id === id && s.room ? { ...f, position: clampToRoom(f, s.room) } : f,
            ),
          }))
          recompute()
        },

        moveFurniture: (id, position) => {
          const { room, gridSnap } = get()
          if (!room) return
          set((s) => ({
            furniture: s.furniture.map((f) => {
              if (f.id !== id || f.locked) return f
              let pos = gridSnap ? { x: snap(position.x), z: snap(position.z) } : position
              pos = clampToRoom({ ...f, position: pos }, room)
              return { ...f, position: pos }
            }),
          }))
          recompute()
        },

        rotateFurniture: (id, deltaRad) => {
          pushHistory()
          set((s) => ({
            furniture: s.furniture.map((f) =>
              f.id === id && !f.locked
                ? { ...f, rotation: f.rotation + deltaRad, position: clampToRoom({ ...f, rotation: f.rotation + deltaRad }, s.room!) }
                : f,
            ),
          }))
          recompute()
        },

        nudgeFurniture: (id, dx, dz) => {
          const { room } = get()
          if (!room) return
          pushHistory()
          set((s) => ({
            furniture: s.furniture.map((f) => {
              if (f.id !== id || f.locked) return f
              const pos = clampToRoom(
                { ...f, position: { x: f.position.x + dx, z: f.position.z + dz } },
                room,
              )
              return { ...f, position: pos }
            }),
          }))
          recompute()
        },

        setMaterial: (id, material) => {
          pushHistory()
          set((s) => ({
            furniture: s.furniture.map((f) => (f.id === id ? { ...f, material } : f)),
          }))
        },

        removeFurniture: (id) => {
          pushHistory()
          set((s) => ({
            furniture: s.furniture.filter((f) => f.id !== id),
            selectedId: s.selectedId === id ? null : s.selectedId,
          }))
          recompute()
        },

        duplicateFurniture: (id) => {
          const { room, furniture } = get()
          const src = furniture.find((f) => f.id === id)
          if (!src || !room) return null
          pushHistory()
          const copy: FurnitureItem = {
            ...src,
            id: uid('f'),
            position: { ...src.position },
            size: { ...src.size },
            params: { ...src.params },
            locked: false,
          }
          copy.position = placeItem(room, furniture, copy)
          set((s) => ({ furniture: [...s.furniture, copy], selectedId: copy.id }))
          recompute()
          return copy.id
        },

        toggleLock: (id) => {
          set((s) => ({
            furniture: s.furniture.map((f) =>
              f.id === id ? { ...f, locked: !f.locked } : f,
            ),
          }))
        },

        select: (id) => set({ selectedId: id }),
        hover: (id) => set({ hoveredId: id }),
        setView: (view) => set({ view }),
        setRenderStyle: (renderStyle) => set({ renderStyle }),
        setUnit: (unit) => set({ unit }),
        toggleGridSnap: () => set((s) => ({ gridSnap: !s.gridSnap })),
        toggleWallSnap: () => set((s) => ({ snapToWalls: !s.snapToWalls })),
        toggleDimensions: () => set((s) => ({ showDimensions: !s.showDimensions })),

        applyStyle: (style) => {
          if (!get().room) return
          pushHistory()
          const preset = STYLE_BY_ID[style]
          set((s) => ({
            designStyle: style,
            room: { ...s.room!, wallColor: preset.wallColor, floorMaterial: preset.floorMaterial },
            furniture: s.furniture.map((f) => {
              const mat = styleMaterialFor(f.kind, preset)
              return mat ? { ...f, material: mat } : f
            }),
          }))
          recompute()
        },

        beginInteraction: () => pushHistory(),

        undo: () => {
          const { past } = get()
          if (past.length === 0) return
          const previous = past[past.length - 1]
          set((s) => ({
            past: s.past.slice(0, -1),
            future: [snapshot(), ...s.future].slice(0, 50),
            room: previous.room,
            furniture: previous.furniture,
            selectedId: previous.selectedId,
          }))
          recompute()
        },

        redo: () => {
          const { future } = get()
          if (future.length === 0) return
          const next = future[0]
          set((s) => ({
            future: s.future.slice(1),
            past: [...s.past, snapshot()].slice(-50),
            room: next.room,
            furniture: next.furniture,
            selectedId: next.selectedId,
          }))
          recompute()
        },

        _recompute: recompute,
      }
    },
    {
      name: 'ai-interior-planner',
      partialize: (s) => ({
        phase: s.phase,
        room: s.room,
        furniture: s.furniture,
        unit: s.unit,
        designStyle: s.designStyle,
        gridSnap: s.gridSnap,
        snapToWalls: s.snapToWalls,
        showDimensions: s.showDimensions,
      }),
      onRehydrateStorage: () => (state) => {
        // Recompute derived analysis after loading a saved design.
        state?._recompute()
      },
    },
  ),
)

/**
 * When opening a shared view link we must NOT overwrite the viewer's own saved
 * design. Swap to a no-op storage while viewing; restore real storage on edit.
 */
const noopStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} }
export const pausePersistence = () =>
  useDesignStore.persist.setOptions({ storage: createJSONStorage(() => noopStorage) })
export const resumePersistence = () =>
  useDesignStore.persist.setOptions({ storage: createJSONStorage(() => localStorage) })

/** Helpers used by panels for selection-derived data. */
export const useSelectedItem = (): FurnitureItem | null => {
  const id = useDesignStore((s) => s.selectedId)
  const furniture = useDesignStore((s) => s.furniture)
  return furniture.find((f) => f.id === id) ?? null
}

export const useCanUndo = () => useDesignStore((s) => s.past.length > 0)
export const useCanRedo = () => useDesignStore((s) => s.future.length > 0)

/** Convenience: default room (meters) used by the manual creator. */
export const makeDefaultRoom = (): Room => ({
  name: 'My Room',
  width: round(4.2, 3),
  length: round(5.0, 3),
  height: 2.7,
  wallThickness: 0.12,
  shape: 'rectangle',
  openings: [
    { id: uid('o'), type: 'door', wall: 'south', offset: 0.9, width: 0.9, height: 2.1, sill: 0 },
    { id: uid('o'), type: 'window', wall: 'north', offset: 2.1, width: 1.4, height: 1.2, sill: 0.9 },
  ],
  floorMaterial: 'oak',
  wallColor: '#e9e7e2',
})

export { clamp }
