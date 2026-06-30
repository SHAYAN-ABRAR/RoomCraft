import { MATERIALS } from '@/data/materials'
import type { MaterialKind } from '@/lib/types'

/** Props for a <meshPhysicalMaterial> derived from a material kind. */
export function pbrProps(material: MaterialKind, colorOverride?: string) {
  const m = MATERIALS[material]
  const isGlass = material === 'glass'
  return {
    color: colorOverride ?? m.color,
    roughness: m.roughness,
    metalness: m.metalness,
    clearcoat: m.clearcoat ?? 0,
    clearcoatRoughness: 0.25,
    transmission: m.transmission ?? 0,
    transparent: isGlass || (m.opacity ?? 1) < 1,
    opacity: m.opacity ?? 1,
    ior: isGlass ? 1.45 : 1.5,
    thickness: isGlass ? 0.08 : 0,
    envMapIntensity: 1,
  } as const
}
