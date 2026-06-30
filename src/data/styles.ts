import type { DesignStyle, FurnitureKind, MaterialKind } from '@/lib/types'

export interface StylePreset {
  id: DesignStyle
  label: string
  description: string
  wallColor: string
  floorMaterial: MaterialKind
  /** CSS gradient preview for the style chip. */
  preview: string
  palette: {
    wood: MaterialKind
    upholstery: MaterialKind
    panel: MaterialKind
    accent: string
  }
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'modern',
    label: 'Modern',
    description: 'Clean lines, warm wood, soft greys',
    wallColor: '#e9e7e2',
    floorMaterial: 'oak',
    preview: 'linear-gradient(135deg,#e9e7e2,#c69c6d)',
    palette: { wood: 'oak', upholstery: 'fabricGrey', panel: 'whiteMatte', accent: '#7c5cff' },
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'White-on-white restraint',
    wallColor: '#f4f4f2',
    floorMaterial: 'whiteMatte',
    preview: 'linear-gradient(135deg,#ffffff,#e2e4e6)',
    palette: { wood: 'oak', upholstery: 'fabricGrey', panel: 'whiteGloss', accent: '#111114' },
  },
  {
    id: 'luxury',
    label: 'Luxury',
    description: 'Walnut, marble & brass',
    wallColor: '#221d1a',
    floorMaterial: 'marble',
    preview: 'linear-gradient(135deg,#3a2c22,#caa869)',
    palette: { wood: 'walnut', upholstery: 'leatherBrown', panel: 'walnut', accent: '#caa869' },
  },
  {
    id: 'industrial',
    label: 'Industrial',
    description: 'Concrete, steel & leather',
    wallColor: '#4b4d52',
    floorMaterial: 'blackMatte',
    preview: 'linear-gradient(135deg,#5a5d63,#2a2b2f)',
    palette: { wood: 'walnut', upholstery: 'leatherBrown', panel: 'blackMatte', accent: '#d98b4a' },
  },
  {
    id: 'japandi',
    label: 'Japandi',
    description: 'Calm oak & muted tones',
    wallColor: '#ddd6c9',
    floorMaterial: 'oak',
    preview: 'linear-gradient(135deg,#ddd6c9,#a98c63)',
    palette: { wood: 'oak', upholstery: 'fabricBeige', panel: 'oak', accent: '#7a6a52' },
  },
  {
    id: 'scandinavian',
    label: 'Scandinavian',
    description: 'Bright, airy, light wood',
    wallColor: '#f3f1ec',
    floorMaterial: 'oak',
    preview: 'linear-gradient(135deg,#f3f1ec,#d9c3a0)',
    palette: { wood: 'oak', upholstery: 'fabricGrey', panel: 'whiteMatte', accent: '#5b9dff' },
  },
  {
    id: 'bohemian',
    label: 'Bohemian',
    description: 'Warm, earthy & layered',
    wallColor: '#cbb8a0',
    floorMaterial: 'walnut',
    preview: 'linear-gradient(135deg,#cbb8a0,#8a5e3f)',
    palette: { wood: 'walnut', upholstery: 'fabricBeige', panel: 'walnut', accent: '#c2683f' },
  },
  {
    id: 'classic',
    label: 'Classic',
    description: 'Timeless wood & cream',
    wallColor: '#e7ddcb',
    floorMaterial: 'walnut',
    preview: 'linear-gradient(135deg,#e7ddcb,#5b3a25)',
    palette: { wood: 'walnut', upholstery: 'fabricBeige', panel: 'whiteMatte', accent: '#9a7b4f' },
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Moody black & walnut',
    wallColor: '#1c1d22',
    floorMaterial: 'blackMatte',
    preview: 'linear-gradient(135deg,#33343c,#0e0f13)',
    palette: { wood: 'walnut', upholstery: 'blackMatte', panel: 'blackMatte', accent: '#7c5cff' },
  },
  {
    id: 'bright',
    label: 'Bright',
    description: 'Crisp white & cool blue',
    wallColor: '#fbfbfd',
    floorMaterial: 'whiteMatte',
    preview: 'linear-gradient(135deg,#ffffff,#bcd3e0)',
    palette: { wood: 'oak', upholstery: 'fabricGrey', panel: 'whiteGloss', accent: '#5b8cff' },
  },
]

export const STYLE_BY_ID: Record<DesignStyle, StylePreset> = Object.fromEntries(
  STYLE_PRESETS.map((s) => [s.id, s]),
) as Record<DesignStyle, StylePreset>

const UPHOLSTERED = new Set<FurnitureKind>(['sofa', 'armchair', 'bed'])
const PANELS = new Set<FurnitureKind>(['wardrobe', 'cabinet', 'dresser'])
const WOOD = new Set<FurnitureKind>([
  'desk',
  'table',
  'diningTable',
  'coffeeTable',
  'chair',
  'bookshelf',
  'tvUnit',
  'nightstand',
  'dressingTable',
])

/** Pick the right material for a furniture kind under a given style. */
export function styleMaterialFor(
  kind: FurnitureKind,
  style: StylePreset,
): MaterialKind | null {
  if (UPHOLSTERED.has(kind)) return style.palette.upholstery
  if (PANELS.has(kind)) return style.palette.panel
  if (WOOD.has(kind)) return style.palette.wood
  return null // decor (rug/plant/lamp) keeps its own material
}
