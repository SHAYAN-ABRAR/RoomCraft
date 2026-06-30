import type { DesignStyle, FurnitureKind, MaterialKind, ViewMode } from '@/lib/types'

export type FurnitureParams = Record<string, number | boolean>

export type AIAction =
  | { type: 'add'; item: FurnitureKind; count?: number; material?: MaterialKind; width?: number; height?: number; depth?: number; params?: FurnitureParams }
  | { type: 'remove'; target: FurnitureKind | 'selected' | 'all' }
  | { type: 'move'; target: FurnitureKind | 'selected'; to: string }
  | { type: 'resize'; target: FurnitureKind | 'selected'; width?: number; height?: number; depth?: number }
  | { type: 'configure'; target: FurnitureKind | 'selected'; params: FurnitureParams }
  | { type: 'material'; target: FurnitureKind | 'selected' | 'all'; material: MaterialKind }
  | { type: 'style'; style: DesignStyle }
  | { type: 'view'; mode: ViewMode }
  | { type: 'clear' }

export interface AIResult {
  reply: string
  actions: AIAction[]
  /** true when the answer came from the Ollama model, false for the local fallback. */
  fromModel: boolean
}
