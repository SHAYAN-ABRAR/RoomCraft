import type { FurnitureItem, Room, Unit } from './types'
import { formatArea, formatLength } from './units'

function download(filename: string, data: string | Blob, type = 'text/plain') {
  const blob = typeof data === 'string' ? new Blob([data], { type }) : data
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Snapshot the live WebGL canvas to a PNG. */
export function exportPNG() {
  const canvas = document.querySelector('canvas')
  if (!canvas) return
  canvas.toBlob((blob) => {
    if (blob) download(`room-${Date.now()}.png`, blob, 'image/png')
  }, 'image/png')
}

/** Save the full design as a portable JSON project file. */
export function exportJSON(room: Room, furniture: FurnitureItem[]) {
  const data = JSON.stringify({ version: 1, room, furniture }, null, 2)
  download(`design-${Date.now()}.json`, data, 'application/json')
}

/** Bill of materials / shopping list as CSV. */
export function exportBOM(furniture: FurnitureItem[], unit: Unit) {
  const rows = [
    ['Item', 'Qty', 'Width', 'Height', 'Depth', 'Material', 'Footprint'],
    ...Object.values(
      furniture.reduce<Record<string, { item: FurnitureItem; qty: number }>>((acc, f) => {
        const key = `${f.name}|${f.size.w}|${f.size.h}|${f.size.d}|${f.material}`
        if (acc[key]) acc[key].qty += 1
        else acc[key] = { item: f, qty: 1 }
        return acc
      }, {}),
    ).map(({ item, qty }) => [
      item.name,
      String(qty),
      formatLength(item.size.w, unit),
      formatLength(item.size.h, unit),
      formatLength(item.size.d, unit),
      item.material,
      formatArea(item.size.w * item.size.d, unit),
    ]),
  ]
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
  download(`bill-of-materials-${Date.now()}.csv`, csv, 'text/csv')
}
