import { useCallback, useMemo, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Copy, Lock, RotateCw, Trash2, Unlock } from 'lucide-react'
import * as THREE from 'three'
import type { FurnitureItem } from '@/lib/types'
import { useDesignStore } from '@/store/useDesignStore'
import { distanceToNearestWall } from '@/lib/geometry'
import { formatLength } from '@/lib/units'
import { clamp } from '@/lib/utils'
import { FurnitureModel } from './FurnitureModel'

type ResizeAxis = 'w' | 'd' | 'h'
const MIN_SIZE = 0.2
const MAX_SIZE = 6

export function Furniture3D({ item }: { item: FurnitureItem }) {
  const select = useDesignStore((s) => s.select)
  const hover = useDesignStore((s) => s.hover)
  const move = useDesignStore((s) => s.moveFurniture)
  const patch = useDesignStore((s) => s.patchFurniture)
  const gridSnap = useDesignStore((s) => s.gridSnap)
  const begin = useDesignStore((s) => s.beginInteraction)
  const duplicate = useDesignStore((s) => s.duplicateFurniture)
  const remove = useDesignStore((s) => s.removeFurniture)
  const rotate90 = useDesignStore((s) => s.rotateFurniture)
  const toggleLock = useDesignStore((s) => s.toggleLock)
  const selected = useDesignStore((s) => s.selectedId === item.id)
  const hovered = useDesignStore((s) => s.hoveredId === item.id)
  const viewOnly = useDesignStore((s) => s.viewOnly)
  const unit = useDesignStore((s) => s.unit)
  const showDims = useDesignStore((s) => s.showDimensions)
  const room = useDesignStore((s) => s.room)
  const colliding = useDesignStore((s) => s.analysis.collisions.includes(item.id))

  const { camera, gl, controls } = useThree() as unknown as {
    camera: THREE.Camera
    gl: THREE.WebGLRenderer
    controls: { enabled: boolean } | null
  }

  const floor = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])
  const ray = useMemo(() => new THREE.Raycaster(), [])
  const grab = useRef<{ dx: number; dz: number } | null>(null)
  const rotating = useRef(false)
  const resizing = useRef<{
    axis: ResizeAxis
    anchor: { x: number; z: number }
    dir: { x: number; z: number }
    startProj: number
    startLen: number
  } | null>(null)

  const toFloor = useCallback(
    (clientX: number, clientY: number) => {
      const rect = gl.domElement.getBoundingClientRect()
      const ndc = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      )
      ray.setFromCamera(ndc, camera)
      const hit = new THREE.Vector3()
      ray.ray.intersectPlane(floor, hit)
      return hit
    },
    [camera, gl, ray, floor],
  )

  const onMove = useCallback(
    (e: PointerEvent) => {
      if (!grab.current) return
      const hit = toFloor(e.clientX, e.clientY)
      move(item.id, { x: hit.x + grab.current.dx, z: hit.z + grab.current.dz })
    },
    [toFloor, move, item.id],
  )

  const onUp = useCallback(() => {
    grab.current = null
    if (controls) controls.enabled = true
    document.body.style.cursor = ''
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }, [controls, onMove])

  const onDown = useCallback(
    (e: { stopPropagation: () => void; nativeEvent: PointerEvent }) => {
      if (viewOnly) return
      select(item.id)
      if (item.locked) return
      e.stopPropagation()
      begin()
      const hit = toFloor(e.nativeEvent.clientX, e.nativeEvent.clientY)
      grab.current = { dx: item.position.x - hit.x, dz: item.position.z - hit.z }
      if (controls) controls.enabled = false
      document.body.style.cursor = 'grabbing'
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [viewOnly, select, begin, toFloor, item.id, item.locked, item.position.x, item.position.z, controls, onMove, onUp],
  )

  const onRotMove = useCallback(
    (e: PointerEvent) => {
      if (!rotating.current) return
      const hit = toFloor(e.clientX, e.clientY)
      let angle = Math.atan2(hit.x - item.position.x, hit.z - item.position.z)
      if (gridSnap) angle = Math.round(angle / (Math.PI / 12)) * (Math.PI / 12)
      patch(item.id, { rotation: angle })
    },
    [toFloor, patch, item.id, item.position.x, item.position.z, gridSnap],
  )

  const onRotUp = useCallback(() => {
    rotating.current = false
    if (controls) controls.enabled = true
    document.body.style.cursor = ''
    window.removeEventListener('pointermove', onRotMove)
    window.removeEventListener('pointerup', onRotUp)
  }, [controls, onRotMove])

  const onRotDown = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      select(item.id)
      begin()
      rotating.current = true
      if (controls) controls.enabled = false
      document.body.style.cursor = 'grabbing'
      window.addEventListener('pointermove', onRotMove)
      window.addEventListener('pointerup', onRotUp)
    },
    [select, begin, item.id, controls, onRotMove, onRotUp],
  )

  // Raycast onto a vertical plane through the item, facing the camera (for height).
  const toVertical = useCallback(
    (clientX: number, clientY: number) => {
      const rect = gl.domElement.getBoundingClientRect()
      const ndc = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      )
      ray.setFromCamera(ndc, camera)
      const cur = useDesignStore.getState().furniture.find((f) => f.id === item.id)
      const cx = cur ? cur.position.x : item.position.x
      const cz = cur ? cur.position.z : item.position.z
      const camDir = new THREE.Vector3()
      camera.getWorldDirection(camDir)
      camDir.y = 0
      if (camDir.lengthSq() < 1e-6) camDir.set(0, 0, 1)
      camDir.normalize()
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(camDir, new THREE.Vector3(cx, 0, cz))
      const hit = new THREE.Vector3()
      return ray.ray.intersectPlane(plane, hit) ? hit : null
    },
    [camera, gl, ray, item.id, item.position.x, item.position.z],
  )

  const onResizeMove = useCallback(
    (e: PointerEvent) => {
      const r = resizing.current
      if (!r) return
      const cur = useDesignStore.getState().furniture.find((f) => f.id === item.id)
      if (!cur) return
      if (r.axis === 'h') {
        const hit = toVertical(e.clientX, e.clientY)
        if (!hit) return
        const h = clamp(r.startLen + (hit.y - r.startProj), MIN_SIZE, 4)
        patch(item.id, { size: { ...cur.size, h } })
        return
      }
      const hit = toFloor(e.clientX, e.clientY)
      const proj = (hit.x - r.anchor.x) * r.dir.x + (hit.z - r.anchor.z) * r.dir.z
      const len = clamp(r.startLen + (proj - r.startProj), MIN_SIZE, MAX_SIZE)
      const position = { x: r.anchor.x + r.dir.x * (len / 2), z: r.anchor.z + r.dir.z * (len / 2) }
      const size = r.axis === 'w' ? { ...cur.size, w: len } : { ...cur.size, d: len }
      patch(item.id, { size, position })
    },
    [toFloor, toVertical, patch, item.id],
  )

  const onResizeUp = useCallback(() => {
    resizing.current = null
    if (controls) controls.enabled = true
    document.body.style.cursor = ''
    window.removeEventListener('pointermove', onResizeMove)
    window.removeEventListener('pointerup', onResizeUp)
  }, [controls, onResizeMove])

  const onResizeDown = useCallback(
    (e: { stopPropagation: () => void; nativeEvent: PointerEvent }, axis: ResizeAxis, sign: 1 | -1) => {
      e.stopPropagation()
      select(item.id)
      begin()
      const c = Math.cos(item.rotation)
      const s = Math.sin(item.rotation)
      const ex = { x: c, z: s }
      const ez = { x: -s, z: c }
      let anchor = { x: item.position.x, z: item.position.z }
      let dir = ex
      let startLen = item.size.w
      if (axis === 'w') {
        const hw = item.size.w / 2
        anchor = sign > 0 ? { x: item.position.x - ex.x * hw, z: item.position.z - ex.z * hw } : { x: item.position.x + ex.x * hw, z: item.position.z + ex.z * hw }
        dir = sign > 0 ? ex : { x: -ex.x, z: -ex.z }
        startLen = item.size.w
      } else if (axis === 'd') {
        const hd = item.size.d / 2
        anchor = sign > 0 ? { x: item.position.x - ez.x * hd, z: item.position.z - ez.z * hd } : { x: item.position.x + ez.x * hd, z: item.position.z + ez.z * hd }
        dir = sign > 0 ? ez : { x: -ez.x, z: -ez.z }
        startLen = item.size.d
      } else {
        startLen = item.size.h
      }

      // Record the grab point so resizing is relative (no jump on grab).
      let startProj = 0
      if (axis === 'h') {
        const hit = toVertical(e.nativeEvent.clientX, e.nativeEvent.clientY)
        startProj = hit ? hit.y : item.size.h
      } else {
        const hit = toFloor(e.nativeEvent.clientX, e.nativeEvent.clientY)
        startProj = (hit.x - anchor.x) * dir.x + (hit.z - anchor.z) * dir.z
      }

      resizing.current = { axis, anchor, dir, startProj, startLen }
      if (controls) controls.enabled = false
      document.body.style.cursor = 'grabbing'
      window.addEventListener('pointermove', onResizeMove)
      window.addEventListener('pointerup', onResizeUp)
    },
    [select, begin, item.id, item.rotation, item.position.x, item.position.z, item.size.w, item.size.d, item.size.h, controls, toFloor, toVertical, onResizeMove, onResizeUp],
  )

  const wallGap = room ? distanceToNearestWall(item, room) : 0
  const ringR = Math.max(item.size.w, item.size.d) / 2 + 0.24
  const markerColor = colliding ? '#fb6f6f' : selected ? '#7c5cff' : '#5b9dff'
  const markerOpacity = colliding ? 0.34 : selected ? 0.26 : hovered ? 0.2 : 0.12

  return (
    <group
      position={[item.position.x, item.elevation, item.position.z]}
      rotation={[0, item.rotation, 0]}
      onPointerDown={onDown}
      onPointerOver={(e) => {
        if (viewOnly) return
        e.stopPropagation()
        hover(item.id)
        if (!grab.current) document.body.style.cursor = 'grab'
      }}
      onPointerOut={() => {
        hover(null)
        if (!grab.current) document.body.style.cursor = ''
      }}
    >
      <FurnitureModel item={item} />

      {/* Footprint marker: blue = furniture, red = collision, accent = selected */}
      {item.kind !== 'rug' && !viewOnly && (
        <>
          <mesh position={[0, 0.013, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[item.size.w, item.size.d]} />
            <meshBasicMaterial color={markerColor} transparent opacity={markerOpacity} depthWrite={false} />
          </mesh>
          {selected && (
            <mesh position={[0, 0.011, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[item.size.w + 0.05, item.size.d + 0.05]} />
              <meshBasicMaterial color={markerColor} transparent opacity={0.55} depthWrite={false} />
            </mesh>
          )}
        </>
      )}

      {/* Rotation handle */}
      {selected && !item.locked && (
        <group>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[ringR, ringR + 0.03, 56]} />
            <meshBasicMaterial color="#7c5cff" transparent opacity={0.4} side={2} depthWrite={false} />
          </mesh>
          <mesh
            position={[0, 0.07, item.size.d / 2 + 0.24]}
            onPointerDown={onRotDown}
            onPointerOver={(e) => {
              e.stopPropagation()
              if (!grab.current && !rotating.current) document.body.style.cursor = 'grab'
            }}
          >
            <sphereGeometry args={[0.075, 20, 20]} />
            <meshStandardMaterial color="#b6a6ff" emissive="#7c5cff" emissiveIntensity={1.5} toneMapped={false} />
          </mesh>

          {/* Resize handles: width (±X), depth (±Z), height (top) */}
          {(
            [
              { axis: 'w', sign: 1, pos: [item.size.w / 2, item.size.h * 0.5, 0] },
              { axis: 'w', sign: -1, pos: [-item.size.w / 2, item.size.h * 0.5, 0] },
              { axis: 'd', sign: 1, pos: [0, item.size.h * 0.5, item.size.d / 2] },
              { axis: 'd', sign: -1, pos: [0, item.size.h * 0.5, -item.size.d / 2] },
              { axis: 'h', sign: 1, pos: [0, item.size.h + 0.04, 0] },
            ] as const
          ).map((hd, i) => (
            <group key={i} position={hd.pos as [number, number, number]}>
              {/* Large invisible grab zone for comfortable targeting */}
              <mesh
                onPointerDown={(e) => onResizeDown(e, hd.axis, hd.sign)}
                onPointerOver={(e) => {
                  e.stopPropagation()
                  if (!resizing.current && !grab.current && !rotating.current)
                    document.body.style.cursor = hd.axis === 'w' ? 'ew-resize' : 'ns-resize'
                }}
                onPointerOut={() => {
                  if (!resizing.current) document.body.style.cursor = ''
                }}
              >
                <sphereGeometry args={[0.16, 12, 12]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>
              {/* Visible knob */}
              <mesh>
                <boxGeometry args={[0.1, 0.1, 0.1]} />
                <meshStandardMaterial color="#eaf1ff" emissive="#5b9dff" emissiveIntensity={0.85} toneMapped={false} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* Floating action toolbar (always available when selected) */}
      {selected && (
        <Html position={[0, item.size.h + 0.5, 0]} center zIndexRange={[40, 0]}>
          <div
            className="flex items-center gap-0.5 rounded-xl border border-white/15 bg-black/80 p-1 shadow-xl backdrop-blur-md"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              title="Duplicate"
              onClick={() => duplicate(item.id)}
              className="grid h-7 w-7 place-items-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              title="Rotate 90°"
              onClick={() => rotate90(item.id, Math.PI / 2)}
              className="grid h-7 w-7 place-items-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
            <button
              title={item.locked ? 'Unlock' : 'Lock'}
              onClick={() => toggleLock(item.id)}
              className="grid h-7 w-7 place-items-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            >
              {item.locked ? <Lock className="h-3.5 w-3.5 text-[#fbbf24]" /> : <Unlock className="h-3.5 w-3.5" />}
            </button>
            <div className="mx-0.5 h-4 w-px bg-white/15" />
            <button
              title="Delete"
              onClick={() => remove(item.id)}
              className="grid h-7 w-7 place-items-center rounded-lg text-[#fb6f6f] transition-colors hover:bg-[#fb6f6f]/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </Html>
      )}

      {/* Live dimension chip */}
      {selected && showDims && (
        <Html position={[0, item.size.h + 0.28, 0]} center distanceFactor={6} zIndexRange={[20, 0]}>
          <div className="pointer-events-none select-none whitespace-nowrap rounded-lg border border-white/15 bg-black/70 px-2.5 py-1 font-mono text-[11px] leading-tight text-white shadow-lg backdrop-blur-md">
            <span className="text-white">{formatLength(item.size.w, unit)}</span>
            <span className="text-white/40"> × </span>
            <span className="text-white">{formatLength(item.size.d, unit)}</span>
            <span className="text-white/40"> × </span>
            <span className="text-white">{formatLength(item.size.h, unit)}</span>
            {wallGap > 0.02 && (
              <span className="text-[var(--color-accent-soft)]"> · wall {formatLength(wallGap, unit)}</span>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}
