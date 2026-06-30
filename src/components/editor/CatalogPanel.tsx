import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Archive,
  Armchair,
  BedDouble,
  BookOpen,
  Box,
  Coffee,
  DoorClosed,
  Frame,
  Home,
  Lamp,
  type LucideIcon,
  Palette,
  Plus,
  Refrigerator,
  Sofa,
  Sprout,
  Table,
  Table2,
  Tv,
} from 'lucide-react'
import { CATALOG, CATEGORIES, type FurnitureCategory } from '@/data/catalog'
import { STYLE_PRESETS } from '@/data/styles'
import { useDesignStore } from '@/store/useDesignStore'
import { SectionLabel } from '@/components/ui/primitives'
import { RoomPanel } from './RoomPanel'

const TABS = [
  { id: 'add' as const, label: 'Furniture', icon: Plus },
  { id: 'style' as const, label: 'Styles', icon: Palette },
  { id: 'room' as const, label: 'Room', icon: Home },
]

const ICONS: Record<string, LucideIcon> = {
  BedDouble, DoorClosed, Sofa, Armchair, Table, Table2, Coffee, BookOpen,
  Tv, Box, Archive, Refrigerator, Frame, Sprout, Lamp,
}

export function CatalogPanel() {
  const addFurniture = useDesignStore((s) => s.addFurniture)
  const applyStyle = useDesignStore((s) => s.applyStyle)
  const activeStyle = useDesignStore((s) => s.designStyle)
  const [tab, setTab] = useState<'add' | 'style' | 'room'>('add')
  const [cat, setCat] = useState<FurnitureCategory>('Bedroom')

  return (
    <motion.aside
      initial={{ x: -24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28, delay: 0.05 }}
      className="glass-strong pointer-events-auto absolute bottom-3 left-3 top-[4.75rem] z-20 flex w-72 flex-col rounded-2xl"
    >
      {/* Tabs */}
      <div className="flex gap-1 p-2">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium transition-colors ${
                tab === t.id ? 'text-white' : 'text-ink-faint hover:text-ink'
              }`}
            >
              {tab === t.id && (
                <motion.span layoutId="cat-tab" className="absolute inset-0 -z-10 rounded-xl bg-white/10 ring-1 ring-white/10" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
              )}
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'add' && (
        <>
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-2 pb-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  cat === c ? 'bg-[var(--color-accent)]/20 text-white ring-1 ring-[var(--color-accent)]/40' : 'text-ink-faint hover:bg-white/5 hover:text-ink'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 overflow-y-auto p-2">
            {CATALOG.filter((c) => c.category === cat).map((entry, i) => {
              const Icon = ICONS[entry.icon] ?? Box
              return (
                <motion.button
                  key={entry.kind}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => addFurniture(entry.kind)}
                  className="group flex flex-col items-start gap-2 rounded-xl border border-white/8 bg-white/[0.03] p-3 text-left transition-colors hover:border-[var(--color-accent)]/40 hover:bg-white/[0.06]"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-white/10 to-white/0 text-ink-soft transition-colors group-hover:text-[var(--color-accent-soft)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink">{entry.label}</p>
                    <p className="mt-0.5 line-clamp-1 text-[10px] text-ink-faint">{entry.blurb}</p>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </>
      )}

      {tab === 'style' && (
        <div className="overflow-y-auto p-3">
          <SectionLabel>One-click makeover</SectionLabel>
          <p className="mb-3 mt-1 px-1 text-[11px] text-ink-faint">
            Restyles walls, floor & every piece of furniture instantly.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {STYLE_PRESETS.map((style, i) => (
              <motion.button
                key={style.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => applyStyle(style.id)}
                className={`overflow-hidden rounded-xl border text-left transition-colors ${
                  activeStyle === style.id ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/50' : 'border-white/8 hover:border-white/20'
                }`}
              >
                <div className="h-12 w-full" style={{ background: style.preview }} />
                <div className="p-2">
                  <p className="text-xs font-semibold text-ink">{style.label}</p>
                  <p className="mt-0.5 line-clamp-1 text-[10px] text-ink-faint">{style.description}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {tab === 'room' && <RoomPanel />}
    </motion.aside>
  )
}
