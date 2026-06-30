import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Info,
  Lock,
  RotateCw,
  Trash2,
  Unlock,
  XCircle,
} from 'lucide-react'
import { useDesignStore, useSelectedItem } from '@/store/useDesignStore'
import type { FurnitureItem, Unit } from '@/lib/types'
import { ALL_MATERIALS, MATERIALS } from '@/data/materials'
import { buildInsights, type Insight } from '@/lib/insights'
import { distanceToNearestWall } from '@/lib/geometry'
import { formatArea, formatLength, formatVolume } from '@/lib/units'
import { ScoreBar, SectionLabel, Slider } from '@/components/ui/primitives'

const toneStyles: Record<Insight['tone'], { icon: React.ReactNode; color: string }> = {
  good: { icon: <CheckCircle2 className="h-4 w-4" />, color: 'var(--color-free)' },
  warn: { icon: <AlertTriangle className="h-4 w-4" />, color: 'var(--color-warn)' },
  bad: { icon: <XCircle className="h-4 w-4" />, color: 'var(--color-collision)' },
  info: { icon: <Info className="h-4 w-4" />, color: 'var(--color-furniture)' },
}

export function RightSidebar() {
  const room = useDesignStore((s) => s.room)
  const furniture = useDesignStore((s) => s.furniture)
  const analysis = useDesignStore((s) => s.analysis)
  const unit = useDesignStore((s) => s.unit)
  const selected = useSelectedItem()

  const insights = useMemo(
    () => (room ? buildInsights(room, furniture, analysis, unit) : []),
    [room, furniture, analysis, unit],
  )

  if (!room) return null

  return (
    <motion.aside
      initial={{ x: 24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28, delay: 0.05 }}
      className="glass-strong pointer-events-auto absolute bottom-3 right-3 top-[4.75rem] z-20 flex w-80 flex-col overflow-y-auto rounded-2xl p-4"
    >
      {/* Selected item — shown first so resize / material / delete are always visible */}
      <AnimatePresence>{selected && <Properties key={selected.id} item={selected} />}</AnimatePresence>

      <SectionLabel>Space Intelligence</SectionLabel>

      {/* Free vs occupied */}
      <div className="mt-3 rounded-2xl border border-white/8 bg-black/20 p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-semibold text-[var(--color-free)]">{formatArea(analysis.freeArea, unit)}</p>
            <p className="text-xs text-ink-faint">free floor space · {analysis.freePct}%</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-[var(--color-furniture)]">{formatArea(analysis.occupiedArea, unit)}</p>
            <p className="text-[10px] text-ink-faint">used</p>
          </div>
        </div>
        <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-white/8">
          <motion.div
            className="h-full"
            style={{ background: 'var(--color-furniture)' }}
            animate={{ width: `${analysis.coveragePct}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
          <div className="h-full flex-1" style={{ background: 'var(--color-free)', opacity: 0.55 }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-ink-faint">
          <Legend color="var(--color-free)" label="Free" />
          <Legend color="var(--color-furniture)" label="Furniture" />
          <Legend color="var(--color-collision)" label="Collision" />
          <Legend color="var(--color-wall)" label="Walls" />
        </div>
      </div>

      {/* Quick stats */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Stat label="Total floor" value={formatArea(analysis.floorArea, unit)} />
        <Stat label="Walk clearance" value={formatLength(analysis.walkway, unit)} />
        <Stat label="Storage volume" value={formatVolume(analysis.storageVolume, unit)} />
        <Stat label="Items" value={String(analysis.itemCount)} />
      </div>

      {/* Scores */}
      <div className="mt-4 space-y-3">
        <ScoreBar label="Comfort" value={analysis.scores.comfort} />
        <ScoreBar label="Storage" value={analysis.scores.storage} />
        <ScoreBar label="Accessibility" value={analysis.scores.accessibility} />
      </div>

      {/* Insights */}
      <div className="mt-4">
        <SectionLabel>AI Suggestions</SectionLabel>
        <div className="mt-2 space-y-2">
          <AnimatePresence initial={false}>
            {insights.map((ins, i) => (
              <motion.div
                key={ins.text}
                layout
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-start gap-2.5 rounded-xl border border-white/8 bg-white/[0.03] p-2.5"
              >
                <span className="mt-0.5 shrink-0" style={{ color: toneStyles[ins.tone].color }}>
                  {toneStyles[ins.tone].icon}
                </span>
                <p className="text-xs leading-relaxed text-ink-soft">{ins.text}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

    </motion.aside>
  )
}

function Properties({ item }: { item: FurnitureItem }) {
  const room = useDesignStore((s) => s.room)!
  const unit = useDesignStore((s) => s.unit)
  const patch = useDesignStore((s) => s.patchFurniture)
  const begin = useDesignStore((s) => s.beginInteraction)
  const setMaterial = useDesignStore((s) => s.setMaterial)
  const rotate = useDesignStore((s) => s.rotateFurniture)
  const duplicate = useDesignStore((s) => s.duplicateFurniture)
  const remove = useDesignStore((s) => s.removeFurniture)
  const toggleLock = useDesignStore((s) => s.toggleLock)

  const wallGap = distanceToNearestWall(item, room)
  const deg = Math.round(((item.rotation * 180) / Math.PI) % 360)

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-4 shrink-0 overflow-hidden"
    >
      <div className="rounded-2xl border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/[0.06] p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">{item.name}</p>
          <span className="font-mono text-[10px] text-ink-faint">{formatArea(item.size.w * item.size.d, unit)}</span>
        </div>

        {/* Dimensions */}
        <div className="space-y-3" onPointerDown={() => begin()}>
          <DimRow label="Width" value={item.size.w} unit={unit} onChange={(w) => patch(item.id, { size: { ...item.size, w } })} />
          <DimRow label="Height" value={item.size.h} unit={unit} onChange={(h) => patch(item.id, { size: { ...item.size, h } })} />
          <DimRow label="Depth" value={item.size.d} unit={unit} onChange={(d) => patch(item.id, { size: { ...item.size, d } })} />
          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-ink-soft">Rotation</span>
              <span className="font-mono text-ink-faint">{deg}°</span>
            </div>
            <Slider value={((deg % 360) + 360) % 360} min={0} max={360} step={1} onChange={(v) => patch(item.id, { rotation: (v * Math.PI) / 180 })} />
          </div>
        </div>

        <p className="mt-3 text-[11px] text-ink-faint">Nearest wall · <span className="text-ink-soft">{formatLength(wallGap, unit)}</span></p>

        {/* Materials */}
        <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Material</p>
        <div className="grid grid-cols-6 gap-1.5">
          {ALL_MATERIALS.map((m) => (
            <button
              key={m}
              title={MATERIALS[m].label}
              onClick={() => setMaterial(item.id, m)}
              className={`h-7 w-full rounded-md ring-1 transition-transform hover:scale-110 ${
                item.material === m ? 'ring-2 ring-white' : 'ring-white/15'
              }`}
              style={{ background: MATERIALS[m].swatch }}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-1.5">
          <ActionBtn onClick={() => rotate(item.id, Math.PI / 2)} title="Rotate 90°"><RotateCw className="h-4 w-4" /></ActionBtn>
          <ActionBtn onClick={() => duplicate(item.id)} title="Duplicate (Ctrl+D)"><Copy className="h-4 w-4" /></ActionBtn>
          <ActionBtn onClick={() => toggleLock(item.id)} title={item.locked ? 'Unlock' : 'Lock'}>
            {item.locked ? <Lock className="h-4 w-4 text-[var(--color-warn)]" /> : <Unlock className="h-4 w-4" />}
          </ActionBtn>
          <ActionBtn onClick={() => remove(item.id)} title="Delete" danger><Trash2 className="h-4 w-4" /></ActionBtn>
        </div>
      </div>
    </motion.div>
  )
}

function DimRow({ label, value, unit, onChange }: { label: string; value: number; unit: Unit; onChange: (m: number) => void }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-ink-soft">{label}</span>
        <span className="font-mono text-ink-faint">{formatLength(value, unit)}</span>
      </div>
      <Slider value={value} min={0.2} max={4} step={0.01} onChange={onChange} />
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-2.5">
      <p className="font-mono text-sm font-medium text-ink">{value}</p>
      <p className="mt-0.5 text-[10px] text-ink-faint">{label}</p>
    </div>
  )
}

function ActionBtn({ onClick, title, children, danger }: { onClick: () => void; title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`grid h-9 flex-1 place-items-center rounded-lg transition-colors ${
        danger ? 'bg-[var(--color-collision)]/10 text-[var(--color-collision)] hover:bg-[var(--color-collision)]/20' : 'bg-white/6 text-ink-soft hover:bg-white/12 hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}
