import { AppWindow, DoorOpen, Plus, Trash2 } from 'lucide-react'
import { useDesignStore } from '@/store/useDesignStore'
import type { Opening, Unit, WallSide } from '@/lib/types'
import { formatLength } from '@/lib/units'
import { SectionLabel, Slider } from '@/components/ui/primitives'

const WALLS: WallSide[] = ['north', 'south', 'east', 'west']
const WALL_LABEL: Record<WallSide, string> = { north: 'N', south: 'S', east: 'E', west: 'W' }

function LengthSlider({
  label, value, min, max, unit, onChange, onCommit,
}: {
  label: string
  value: number
  min: number
  max: number
  unit: Unit
  onChange: (m: number) => void
  onCommit: () => void
}) {
  return (
    <div onPointerDown={onCommit}>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-ink-soft">{label}</span>
        <span className="font-mono text-ink-faint">{formatLength(value, unit)}</span>
      </div>
      <Slider value={value} min={min} max={max} step={0.02} onChange={onChange} />
    </div>
  )
}

export function RoomPanel() {
  const room = useDesignStore((s) => s.room)
  const unit = useDesignStore((s) => s.unit)
  const patchRoom = useDesignStore((s) => s.patchRoom)
  const begin = useDesignStore((s) => s.beginInteraction)
  const addOpening = useDesignStore((s) => s.addOpening)
  const updateOpening = useDesignStore((s) => s.updateOpening)
  const removeOpening = useDesignStore((s) => s.removeOpening)

  if (!room) return null

  return (
    <div className="overflow-y-auto p-3">
      <SectionLabel>Dimensions</SectionLabel>
      <div className="mt-3 space-y-3 rounded-2xl border border-white/8 bg-black/20 p-3">
        <LengthSlider label="Width" value={room.width} min={1.5} max={12} unit={unit} onCommit={begin} onChange={(w) => patchRoom({ width: w })} />
        <LengthSlider label="Length" value={room.length} min={1.5} max={12} unit={unit} onCommit={begin} onChange={(l) => patchRoom({ length: l })} />
        <LengthSlider label="Ceiling height" value={room.height} min={2.2} max={4} unit={unit} onCommit={begin} onChange={(h) => patchRoom({ height: h })} />
        <LengthSlider label="Wall thickness" value={room.wallThickness} min={0.05} max={0.4} unit={unit} onCommit={begin} onChange={(t) => patchRoom({ wallThickness: t })} />
      </div>

      <div className="mb-2 mt-5 flex items-center justify-between">
        <SectionLabel>Doors & Windows</SectionLabel>
        <span className="text-[10px] text-ink-faint">{room.openings.length}</span>
      </div>

      <div className="space-y-2">
        {room.openings.map((o) => (
          <OpeningCard key={o.id} opening={o} roomWidth={room.width} roomLength={room.length} unit={unit} onChange={(p) => updateOpening(o.id, p)} onCommit={begin} onRemove={() => removeOpening(o.id)} />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={() => addOpening('door')} className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-ink-soft transition-colors hover:border-[var(--color-accent)]/40 hover:text-ink">
          <Plus className="h-3.5 w-3.5" /> Door
        </button>
        <button onClick={() => addOpening('window')} className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-ink-soft transition-colors hover:border-[var(--color-accent)]/40 hover:text-ink">
          <Plus className="h-3.5 w-3.5" /> Window
        </button>
      </div>
    </div>
  )
}

function OpeningCard({
  opening, roomWidth, roomLength, unit, onChange, onCommit, onRemove,
}: {
  opening: Opening
  roomWidth: number
  roomLength: number
  unit: Unit
  onChange: (patch: Partial<Opening>) => void
  onCommit: () => void
  onRemove: () => void
}) {
  const isDoor = opening.type === 'door'
  const wallLen = opening.wall === 'north' || opening.wall === 'south' ? roomWidth : roomLength

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-medium text-ink">
          {isDoor ? <DoorOpen className="h-4 w-4 text-[var(--color-accent-soft)]" /> : <AppWindow className="h-4 w-4 text-[var(--color-furniture)]" />}
          {isDoor ? 'Door' : 'Window'}
        </span>
        <button onClick={onRemove} className="grid h-6 w-6 place-items-center rounded-md text-ink-faint transition-colors hover:bg-[var(--color-collision)]/15 hover:text-[var(--color-collision)]">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Wall picker */}
      <div className="mb-3 flex gap-1">
        {WALLS.map((w) => (
          <button
            key={w}
            onClick={() => onChange({ wall: w })}
            className={`flex-1 rounded-md py-1.5 text-[11px] font-medium transition-colors ${
              opening.wall === w ? 'bg-[var(--color-accent)]/20 text-white ring-1 ring-[var(--color-accent)]/40' : 'bg-black/20 text-ink-faint hover:text-ink'
            }`}
          >
            {WALL_LABEL[w]}
          </button>
        ))}
      </div>

      <div className="space-y-2.5" onPointerDown={onCommit}>
        <Mini label="Position" value={opening.offset} unit={unit}>
          <Slider value={opening.offset} min={0} max={wallLen} step={0.02} onChange={(v) => onChange({ offset: v })} />
        </Mini>
        <Mini label="Width" value={opening.width} unit={unit}>
          <Slider value={opening.width} min={0.4} max={Math.min(2.6, wallLen)} step={0.02} onChange={(v) => onChange({ width: v })} />
        </Mini>
        <Mini label="Height" value={opening.height} unit={unit}>
          <Slider value={opening.height} min={isDoor ? 1.6 : 0.4} max={isDoor ? 2.4 : 2} step={0.02} onChange={(v) => onChange({ height: v })} />
        </Mini>
        {!isDoor && (
          <Mini label="Sill height" value={opening.sill} unit={unit}>
            <Slider value={opening.sill} min={0} max={1.5} step={0.02} onChange={(v) => onChange({ sill: v })} />
          </Mini>
        )}
      </div>
    </div>
  )
}

function Mini({ label, value, unit, children }: { label: string; value: number; unit: Unit; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px]">
        <span className="text-ink-soft">{label}</span>
        <span className="font-mono text-ink-faint">{formatLength(value, unit)}</span>
      </div>
      {children}
    </div>
  )
}
