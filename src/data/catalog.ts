import type {
  Dimensions,
  FurnitureItem,
  FurnitureKind,
  MaterialKind,
  Vec2,
} from '@/lib/types'
import { uid } from '@/lib/utils'

export type FurnitureCategory =
  | 'Bedroom'
  | 'Seating'
  | 'Tables'
  | 'Storage'
  | 'Office'
  | 'Decor'

export interface CatalogEntry {
  kind: FurnitureKind
  label: string
  category: FurnitureCategory
  /** lucide-react icon name (resolved in the UI). */
  icon: string
  size: Dimensions
  material: MaterialKind
  accent?: string
  params: Record<string, number | string | boolean>
  /** Short tagline shown in the catalog card. */
  blurb: string
}

/** The procedural furniture library. Dimensions are in meters. */
export const CATALOG: CatalogEntry[] = [
  {
    kind: 'bed',
    label: 'King Bed',
    category: 'Bedroom',
    icon: 'BedDouble',
    size: { w: 1.8, h: 1.1, d: 2.1 },
    material: 'fabricGrey',
    accent: '#3a3d46',
    params: { headboard: 1.0, mattress: 0.32, legs: 0.12 },
    blurb: 'Upholstered frame with headboard',
  },
  {
    kind: 'wardrobe',
    label: 'Wardrobe',
    category: 'Storage',
    icon: 'DoorClosed',
    size: { w: 1.4, h: 2.1, d: 0.62 },
    material: 'whiteMatte',
    accent: '#c7ccd3',
    params: { doors: 3, handles: true, plinth: 0.08 },
    blurb: 'Hinged-door closet with handles',
  },
  {
    kind: 'sofa',
    label: 'Luxury Sofa',
    category: 'Seating',
    icon: 'Sofa',
    size: { w: 2.2, h: 0.82, d: 0.95 },
    material: 'fabricBeige',
    accent: '#9c8a6c',
    params: { seats: 3, cushions: true, legs: 0.1 },
    blurb: 'Three-seater with deep cushions',
  },
  {
    kind: 'armchair',
    label: 'Armchair',
    category: 'Seating',
    icon: 'Armchair',
    size: { w: 0.85, h: 0.85, d: 0.88 },
    material: 'leatherBrown',
    params: { cushions: true, legs: 0.1 },
    blurb: 'Single accent chair',
  },
  {
    kind: 'desk',
    label: 'Floating Desk',
    category: 'Office',
    icon: 'Table',
    size: { w: 1.4, h: 0.75, d: 0.7 },
    material: 'oak',
    accent: '#2b2c31',
    params: { drawers: 2, panel: true },
    blurb: 'Work desk with drawers',
  },
  {
    kind: 'diningTable',
    label: 'Dining Table',
    category: 'Tables',
    icon: 'Table2',
    size: { w: 1.7, h: 0.75, d: 0.95 },
    material: 'walnut',
    params: { thickness: 0.05, legType: 'block' },
    blurb: 'Seats six',
  },
  {
    kind: 'coffeeTable',
    label: 'Coffee Table',
    category: 'Tables',
    icon: 'Coffee',
    size: { w: 1.1, h: 0.42, d: 0.6 },
    material: 'walnut',
    accent: '#b7bcc2',
    params: { shelf: true },
    blurb: 'Low table with shelf',
  },
  {
    kind: 'chair',
    label: 'Dining Chair',
    category: 'Seating',
    icon: 'Armchair',
    size: { w: 0.46, h: 0.92, d: 0.5 },
    material: 'oak',
    accent: '#3a3d46',
    params: { back: 0.45 },
    blurb: 'Wooden chair',
  },
  {
    kind: 'bookshelf',
    label: 'Bookshelf',
    category: 'Storage',
    icon: 'BookOpen',
    size: { w: 0.95, h: 1.85, d: 0.32 },
    material: 'oak',
    params: { shelves: 5, back: true },
    blurb: 'Open shelving unit',
  },
  {
    kind: 'tvUnit',
    label: 'TV Cabinet',
    category: 'Storage',
    icon: 'Tv',
    size: { w: 1.8, h: 0.45, d: 0.42 },
    material: 'walnut',
    accent: '#c7ccd3',
    params: { drawers: 2, led: true },
    blurb: 'Media console with LED',
  },
  {
    kind: 'nightstand',
    label: 'Nightstand',
    category: 'Bedroom',
    icon: 'Box',
    size: { w: 0.48, h: 0.52, d: 0.42 },
    material: 'oak',
    accent: '#c7ccd3',
    params: { drawers: 2 },
    blurb: 'Bedside drawers',
  },
  {
    kind: 'dresser',
    label: 'Dresser',
    category: 'Storage',
    icon: 'Archive',
    size: { w: 1.1, h: 0.82, d: 0.5 },
    material: 'whiteMatte',
    accent: '#c7ccd3',
    params: { drawers: 6 },
    blurb: 'Wide chest of drawers',
  },
  {
    kind: 'dressingTable',
    label: 'Dressing Table',
    category: 'Bedroom',
    icon: 'Frame',
    size: { w: 1.0, h: 1.5, d: 0.45 },
    material: 'whiteMatte',
    accent: '#c7ccd3',
    params: { drawers: 3, mirror: true },
    blurb: 'Vanity with mirror & drawers',
  },
  {
    kind: 'cabinet',
    label: 'Cabinet',
    category: 'Storage',
    icon: 'Refrigerator',
    size: { w: 0.9, h: 0.95, d: 0.45 },
    material: 'whiteGloss',
    accent: '#c7ccd3',
    params: { doors: 2, handles: true },
    blurb: 'Two-door cabinet',
  },
  {
    kind: 'rug',
    label: 'Area Rug',
    category: 'Decor',
    icon: 'Frame',
    size: { w: 2.0, h: 0.02, d: 2.8 },
    material: 'fabricGrey',
    params: {},
    blurb: 'Soft floor rug',
  },
  {
    kind: 'plant',
    label: 'Plant',
    category: 'Decor',
    icon: 'Sprout',
    size: { w: 0.5, h: 1.35, d: 0.5 },
    material: 'blackMatte',
    accent: '#3f7d4f',
    params: {},
    blurb: 'Potted greenery',
  },
  {
    kind: 'lamp',
    label: 'Floor Lamp',
    category: 'Decor',
    icon: 'Lamp',
    size: { w: 0.4, h: 1.6, d: 0.4 },
    material: 'metal',
    accent: '#ffd9a0',
    params: { warm: true },
    blurb: 'Ambient floor light',
  },
]

export const CATALOG_BY_KIND: Record<FurnitureKind, CatalogEntry> =
  Object.fromEntries(CATALOG.map((c) => [c.kind, c])) as Record<
    FurnitureKind,
    CatalogEntry
  >

export const CATEGORIES: FurnitureCategory[] = [
  'Bedroom',
  'Seating',
  'Tables',
  'Storage',
  'Office',
  'Decor',
]

/** Build a fresh furniture item from a catalog kind. */
export function createFurniture(
  kind: FurnitureKind,
  overrides: Partial<FurnitureItem> & { position?: Vec2 } = {},
): FurnitureItem {
  const entry = CATALOG_BY_KIND[kind]
  const base: FurnitureItem = {
    id: uid('f'),
    kind,
    name: entry.label,
    position: { x: 0, z: 0 },
    elevation: 0,
    rotation: 0,
    size: { ...entry.size },
    material: entry.material,
    accent: entry.accent,
    locked: false,
    params: { ...entry.params },
  }
  return {
    ...base,
    ...overrides,
    size: { ...base.size, ...overrides.size },
    params: { ...base.params, ...overrides.params },
  }
}
