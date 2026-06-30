import LZString from 'lz-string'
import type { FurnitureItem, Room } from './types'

interface DesignPayload {
  v: number
  room: Room
  furniture: FurnitureItem[]
}

/** Compress a design into a URL-safe code. */
export function encodeDesign(room: Room, furniture: FurnitureItem[]): string {
  const payload: DesignPayload = { v: 1, room, furniture }
  return LZString.compressToEncodedURIComponent(JSON.stringify(payload))
}

/** Decode a share code OR a full share URL back into a design. */
export function decodeDesign(input: string): { room: Room; furniture: FurnitureItem[] } | null {
  try {
    let code = input.trim()
    const marker = code.indexOf('#v=')
    if (marker >= 0) code = code.slice(marker + 3)
    // strip any trailing params/fragments
    code = code.split('&')[0].split('#')[0].trim()
    if (!code) return null
    const json = LZString.decompressFromEncodedURIComponent(code)
    if (!json) return null
    const data = JSON.parse(json) as DesignPayload
    if (!data?.room || !Array.isArray(data.furniture)) return null
    return { room: data.room, furniture: data.furniture }
  } catch {
    return null
  }
}

/** Build a full view-only share link for the current design. */
export function buildViewLink(room: Room, furniture: FurnitureItem[]): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#v=${encodeDesign(room, furniture)}`
}

/** Read a share code from the current URL hash, if present. */
export function readShareCodeFromUrl(): string | null {
  const h = window.location.hash
  return h.startsWith('#v=') ? h.slice(3) : null
}

/** Remove the share fragment from the address bar without reloading. */
export function clearShareHash() {
  history.replaceState(null, '', window.location.pathname + window.location.search)
}
