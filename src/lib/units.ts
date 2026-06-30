import type { Unit } from './types'

/** Meters per 1 unit. */
const TO_M: Record<Unit, number> = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  in: 0.0254,
  ft: 0.3048,
}

export const UNIT_LABELS: Record<Unit, string> = {
  mm: 'mm',
  cm: 'cm',
  m: 'm',
  in: 'in',
  ft: 'ft',
}

export const ALL_UNITS: Unit[] = ['ft', 'in', 'm', 'cm', 'mm']

export const toMeters = (value: number, unit: Unit): number => value * TO_M[unit]
export const fromMeters = (meters: number, unit: Unit): number => meters / TO_M[unit]

/**
 * Parse flexible human input into METERS.
 * Accepts: 10'6", 10' 6", 10ft 6in, 3.5m, 325cm, 410mm, 24in, or a bare
 * number interpreted with `defaultUnit`.
 * Returns null if nothing parseable was found.
 */
export function parseDimension(raw: string, defaultUnit: Unit): number | null {
  const s = raw.trim().toLowerCase()
  if (!s) return null

  // Feet & inches:  10'6"  |  10' 6"  |  10ft6in  |  10 ft 6 in
  const ftIn = s.match(
    /^(\d+(?:\.\d+)?)\s*(?:'|ft|feet)\s*(?:(\d+(?:\.\d+)?)\s*(?:"|in|inch|inches)?)?$/,
  )
  if (ftIn) {
    const feet = parseFloat(ftIn[1])
    const inches = ftIn[2] ? parseFloat(ftIn[2]) : 0
    return feet * TO_M.ft + inches * TO_M.in
  }

  // Inches only: 24"  |  24in
  const inOnly = s.match(/^(\d+(?:\.\d+)?)\s*(?:"|in|inch|inches)$/)
  if (inOnly) return parseFloat(inOnly[1]) * TO_M.in

  // value + unit suffix
  const withUnit = s.match(/^(\d+(?:\.\d+)?)\s*(mm|cm|m|in|ft)$/)
  if (withUnit) return parseFloat(withUnit[1]) * TO_M[withUnit[2] as Unit]

  // bare number -> default unit
  const bare = s.match(/^(\d+(?:\.\d+)?)$/)
  if (bare) return parseFloat(bare[1]) * TO_M[defaultUnit]

  return null
}

/** Format a length in meters for display in the given unit. */
export function formatLength(
  meters: number,
  unit: Unit,
  opts: { precision?: number; withUnit?: boolean } = {},
): string {
  const { precision, withUnit = true } = opts

  if (unit === 'ft') {
    // Show as feet + inches: 10' 6"
    const totalInches = meters / TO_M.in
    let feet = Math.floor(totalInches / 12)
    let inches = Math.round(totalInches - feet * 12)
    if (inches === 12) {
      feet += 1
      inches = 0
    }
    return inches === 0 ? `${feet}'` : `${feet}' ${inches}"`
  }

  const value = fromMeters(meters, unit)
  const p =
    precision ?? (unit === 'm' ? 2 : unit === 'cm' ? 1 : unit === 'in' ? 1 : 0)
  const str = value.toFixed(p)
  return withUnit ? `${str} ${UNIT_LABELS[unit]}` : str
}

/** Format an area (m²) for display. */
export function formatArea(squareMeters: number, unit: Unit): string {
  if (unit === 'ft' || unit === 'in') {
    const sqft = squareMeters / (TO_M.ft * TO_M.ft)
    return `${sqft.toFixed(1)} sq ft`
  }
  if (unit === 'mm' || unit === 'cm') {
    const sqcm = squareMeters / (TO_M.cm * TO_M.cm)
    return `${Math.round(sqcm).toLocaleString()} cm²`
  }
  return `${squareMeters.toFixed(2)} m²`
}

/** Format a volume (m³) for display. */
export function formatVolume(cubicMeters: number, unit: Unit): string {
  if (unit === 'ft' || unit === 'in') {
    const cuft = cubicMeters / (TO_M.ft * TO_M.ft * TO_M.ft)
    return `${cuft.toFixed(1)} cu ft`
  }
  return `${cubicMeters.toFixed(2)} m³`
}
