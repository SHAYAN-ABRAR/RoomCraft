import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Boxes,
  Download,
  FileJson,
  Grid3x3,
  Image as ImageIcon,
  Magnet,
  Map,
  Orbit,
  PersonStanding,
  Plus,
  Redo2,
  Ruler,
  ScrollText,
  Share2,
  Sparkles,
  Square,
  Undo2,
} from 'lucide-react'
import { useCanRedo, useCanUndo, useDesignStore } from '@/store/useDesignStore'
import type { RenderStyle, Unit, ViewMode } from '@/lib/types'
import { ALL_UNITS, UNIT_LABELS } from '@/lib/units'
import { exportBOM, exportJSON, exportPNG } from '@/lib/export'
import { IconButton, Segmented } from '@/components/ui/primitives'
import { ShareModal } from './ShareModal'

export function TopBar() {
  const view = useDesignStore((s) => s.view)
  const setView = useDesignStore((s) => s.setView)
  const renderStyle = useDesignStore((s) => s.renderStyle)
  const setRenderStyle = useDesignStore((s) => s.setRenderStyle)
  const unit = useDesignStore((s) => s.unit)
  const setUnit = useDesignStore((s) => s.setUnit)
  const gridSnap = useDesignStore((s) => s.gridSnap)
  const toggleGridSnap = useDesignStore((s) => s.toggleGridSnap)
  const showDims = useDesignStore((s) => s.showDimensions)
  const toggleDims = useDesignStore((s) => s.toggleDimensions)
  const undo = useDesignStore((s) => s.undo)
  const redo = useDesignStore((s) => s.redo)
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()
  const resetAll = useDesignStore((s) => s.resetAll)
  const room = useDesignStore((s) => s.room)
  const furniture = useDesignStore((s) => s.furniture)

  const [exportOpen, setExportOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const viewOptions: { value: ViewMode; icon: React.ReactNode; title: string }[] = [
    { value: 'orbit', icon: <Orbit className="h-4 w-4" />, title: '3D orbit' },
    { value: 'top', icon: <Square className="h-4 w-4" />, title: 'Top-down' },
    { value: 'plan2d', icon: <Map className="h-4 w-4" />, title: '2D plan' },
    { value: 'firstPerson', icon: <PersonStanding className="h-4 w-4" />, title: 'Walkthrough' },
  ]

  const renderOptions: { value: RenderStyle; icon: React.ReactNode; title: string }[] = [
    { value: 'realistic', icon: <Sparkles className="h-4 w-4" />, title: 'Realistic' },
    { value: 'wireframe', icon: <Grid3x3 className="h-4 w-4" />, title: 'Wireframe' },
  ]

  return (
    <>
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="pointer-events-auto absolute inset-x-3 top-3 z-30 flex items-center justify-between gap-3"
    >
      {/* Brand + room */}
      <div className="glass flex h-12 items-center gap-3 rounded-2xl px-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#8b6dff] to-[#5b8cff] text-white">
          <Boxes className="h-4.5 w-4.5" />
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold leading-none">{room?.name ?? 'My Room'}</p>
          <p className="mt-0.5 text-[10px] text-ink-faint">{furniture.length} items · saved locally</p>
        </div>
      </div>

      {/* Center cluster */}
      <div className="glass flex h-12 items-center gap-1.5 rounded-2xl px-2">
        <IconButton onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          <Undo2 className="h-4 w-4" />
        </IconButton>
        <IconButton onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
          <Redo2 className="h-4 w-4" />
        </IconButton>
        <div className="mx-1 h-6 w-px bg-white/10" />
        <Segmented value={view} onChange={setView} options={viewOptions} />
        <div className="mx-1 h-6 w-px bg-white/10" />
        <Segmented value={renderStyle} onChange={setRenderStyle} options={renderOptions} />
      </div>

      {/* Right cluster */}
      <div className="glass flex h-12 items-center gap-1.5 rounded-2xl px-2">
        <IconButton active={gridSnap} onClick={toggleGridSnap} title="Snap to grid (G)">
          <Magnet className="h-4 w-4" />
        </IconButton>
        <IconButton active={showDims} onClick={toggleDims} title="Toggle dimensions">
          <Ruler className="h-4 w-4" />
        </IconButton>
        <div className="hidden md:flex">
          <Segmented
            value={unit}
            onChange={(u: Unit) => setUnit(u)}
            options={ALL_UNITS.map((u) => ({ value: u, label: UNIT_LABELS[u] }))}
          />
        </div>
        <div className="mx-1 h-6 w-px bg-white/10" />

        <IconButton onClick={() => setShareOpen(true)} title="Share / open a link">
          <Share2 className="h-4 w-4" />
        </IconButton>

        <div className="relative">
          <IconButton active={exportOpen} onClick={() => setExportOpen((v) => !v)} title="Export">
            <Download className="h-4 w-4" />
          </IconButton>
          <AnimatePresence>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  className="glass-strong absolute right-0 top-11 z-20 w-52 overflow-hidden rounded-xl p-1.5"
                >
                  <MenuItem icon={<ImageIcon className="h-4 w-4" />} label="Snapshot (PNG)" onClick={() => { exportPNG(); setExportOpen(false) }} />
                  <MenuItem icon={<FileJson className="h-4 w-4" />} label="Project (JSON)" onClick={() => { room && exportJSON(room, furniture); setExportOpen(false) }} />
                  <MenuItem icon={<ScrollText className="h-4 w-4" />} label="Bill of Materials" onClick={() => { exportBOM(furniture, unit); setExportOpen(false) }} />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => { if (confirm('Start a new room? Your current design stays saved until you build a new one.')) resetAll() }}
          className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/8 px-3 text-xs font-medium text-ink transition-colors hover:bg-white/12"
          title="New room"
        >
          <Plus className="h-3.5 w-3.5" /> New
        </button>
      </div>
    </motion.header>
    <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </>
  )
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-soft transition-colors hover:bg-white/8 hover:text-ink"
    >
      {icon}
      {label}
    </button>
  )
}
