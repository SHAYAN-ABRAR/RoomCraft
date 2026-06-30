/* ----------------------------------------------------------------------------
   Core domain types. All spatial values are stored internally in METERS.
   Display conversion happens at the UI edge via lib/units.ts.
---------------------------------------------------------------------------- */

export type Unit = 'mm' | 'cm' | 'm' | 'in' | 'ft'

export type WallSide = 'north' | 'south' | 'east' | 'west'

/** A point on the floor plane (X across, Z deep). Y is always "up". */
export interface Vec2 {
  x: number
  z: number
}

export type OpeningType = 'door' | 'window'

export interface Opening {
  id: string
  type: OpeningType
  wall: WallSide
  /** Distance (m) from the wall's start corner to the opening center. */
  offset: number
  width: number
  height: number
  /** Height (m) of the sill above the floor (0 for doors). */
  sill: number
}

export type RoomShape = 'rectangle' | 'l-shape'

export interface Room {
  name: string
  /** Interior width along X (m). */
  width: number
  /** Interior length/depth along Z (m). */
  length: number
  /** Ceiling height (m). */
  height: number
  wallThickness: number
  shape: RoomShape
  openings: Opening[]
  floorMaterial: MaterialKind
  wallColor: string
}

export type FurnitureKind =
  | 'bed'
  | 'wardrobe'
  | 'sofa'
  | 'armchair'
  | 'desk'
  | 'table'
  | 'coffeeTable'
  | 'diningTable'
  | 'chair'
  | 'bookshelf'
  | 'tvUnit'
  | 'nightstand'
  | 'dresser'
  | 'dressingTable'
  | 'cabinet'
  | 'rug'
  | 'plant'
  | 'lamp'

export type MaterialKind =
  | 'oak'
  | 'walnut'
  | 'whiteMatte'
  | 'whiteGloss'
  | 'blackMatte'
  | 'fabricGrey'
  | 'fabricBeige'
  | 'leatherBrown'
  | 'metal'
  | 'marble'
  | 'glass'

/** Local-space dimensions of a furniture item, in meters. */
export interface Dimensions {
  /** Width along local X (m). */
  w: number
  /** Height along local Y (m). */
  h: number
  /** Depth along local Z (m). */
  d: number
}

export interface FurnitureItem {
  id: string
  kind: FurnitureKind
  name: string
  /** Center position on the floor plane (m). */
  position: Vec2
  /** Bottom of the item above the floor (m). Usually 0. */
  elevation: number
  /** Yaw rotation around Y, in radians. */
  rotation: number
  size: Dimensions
  material: MaterialKind
  /** Optional accent color (handles, legs, LED, etc.). */
  accent?: string
  locked: boolean
  /** Free-form parametric knobs consumed by the 3D builder. */
  params: Record<string, number | string | boolean>
}

export type ViewMode = 'orbit' | 'top' | 'firstPerson' | 'plan2d'
export type RenderStyle = 'realistic' | 'wireframe' | 'section'

export type DesignStyle =
  | 'modern'
  | 'minimal'
  | 'luxury'
  | 'industrial'
  | 'japandi'
  | 'scandinavian'
  | 'bohemian'
  | 'classic'
  | 'dark'
  | 'bright'

/** Result of grid-based occupancy analysis. */
export interface SpaceAnalysis {
  floorArea: number
  occupiedArea: number
  freeArea: number
  coveragePct: number
  freePct: number
  /** Side (m) of the largest open square — a proxy for walking clearance. */
  walkway: number
  itemCount: number
  storageVolume: number
  collisions: string[]
  scores: {
    comfort: number
    storage: number
    accessibility: number
  }
}
