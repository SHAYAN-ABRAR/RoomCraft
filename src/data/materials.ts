import type { MaterialKind } from '@/lib/types'

export interface MaterialDef {
  label: string
  color: string
  roughness: number
  metalness: number
  /** Physically-based extras consumed by the 3D renderer. */
  clearcoat?: number
  transmission?: number
  opacity?: number
  /** CSS swatch for the material picker. */
  swatch: string
}

export const MATERIALS: Record<MaterialKind, MaterialDef> = {
  oak: {
    label: 'Oak',
    color: '#c69c6d',
    roughness: 0.62,
    metalness: 0,
    swatch: 'linear-gradient(135deg,#d9b486,#b07e4d)',
  },
  walnut: {
    label: 'Walnut',
    color: '#5b3a25',
    roughness: 0.48,
    metalness: 0,
    clearcoat: 0.25,
    swatch: 'linear-gradient(135deg,#7a4e30,#3f2718)',
  },
  whiteMatte: {
    label: 'White Matte',
    color: '#edeff2',
    roughness: 0.72,
    metalness: 0,
    swatch: 'linear-gradient(135deg,#ffffff,#dfe3e8)',
  },
  whiteGloss: {
    label: 'White Gloss',
    color: '#f7f8fa',
    roughness: 0.16,
    metalness: 0,
    clearcoat: 0.9,
    swatch: 'linear-gradient(135deg,#ffffff,#e8eef5)',
  },
  blackMatte: {
    label: 'Black Matte',
    color: '#1d1e24',
    roughness: 0.58,
    metalness: 0.1,
    swatch: 'linear-gradient(135deg,#33343c,#0e0f13)',
  },
  fabricGrey: {
    label: 'Grey Fabric',
    color: '#8b8e98',
    roughness: 0.96,
    metalness: 0,
    swatch: 'linear-gradient(135deg,#a3a6af,#6f727b)',
  },
  fabricBeige: {
    label: 'Beige Fabric',
    color: '#d6c4a6',
    roughness: 0.95,
    metalness: 0,
    swatch: 'linear-gradient(135deg,#e6d8bf,#c2ac88)',
  },
  leatherBrown: {
    label: 'Brown Leather',
    color: '#6e4a32',
    roughness: 0.42,
    metalness: 0.05,
    clearcoat: 0.4,
    swatch: 'linear-gradient(135deg,#8a5e3f,#4f3322)',
  },
  metal: {
    label: 'Brushed Metal',
    color: '#a2a8af',
    roughness: 0.32,
    metalness: 0.92,
    swatch: 'linear-gradient(135deg,#cfd4d9,#7d838b)',
  },
  marble: {
    label: 'Marble',
    color: '#eeece6',
    roughness: 0.18,
    metalness: 0,
    clearcoat: 0.5,
    swatch: 'linear-gradient(135deg,#f5f3ee,#d8d2c6)',
  },
  glass: {
    label: 'Glass',
    color: '#c4d8e4',
    roughness: 0.05,
    metalness: 0,
    transmission: 0.9,
    opacity: 0.35,
    swatch: 'linear-gradient(135deg,rgba(200,225,240,.8),rgba(150,185,205,.5))',
  },
}

export const ALL_MATERIALS = Object.keys(MATERIALS) as MaterialKind[]
