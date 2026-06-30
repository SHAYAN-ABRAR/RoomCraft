import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Short, collision-resistant id. */
export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`
}

export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v))

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Round to n decimals without float noise. */
export const round = (v: number, decimals = 2) => {
  const f = 10 ** decimals
  return Math.round(v * f) / f
}

export const titleCase = (s: string) =>
  s.replace(/(^|\s|-)\w/g, (m) => m.toUpperCase()).replace(/-/g, ' ')
