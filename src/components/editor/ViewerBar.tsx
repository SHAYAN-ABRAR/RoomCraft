import { useState } from 'react'
import { motion } from 'framer-motion'
import { Boxes, Check, Copy, Eye, Map, Orbit, PenLine, PersonStanding, Square } from 'lucide-react'
import { useDesignStore, resumePersistence } from '@/store/useDesignStore'
import type { ViewMode } from '@/lib/types'
import { buildViewLink, clearShareHash } from '@/lib/share'
import { Button, IconButton, Segmented } from '@/components/ui/primitives'

export function ViewerBar() {
  const view = useDesignStore((s) => s.view)
  const setView = useDesignStore((s) => s.setView)
  const setViewOnly = useDesignStore((s) => s.setViewOnly)
  const room = useDesignStore((s) => s.room)
  const furniture = useDesignStore((s) => s.furniture)
  const [copied, setCopied] = useState(false)

  const viewOptions: { value: ViewMode; icon: React.ReactNode; title: string }[] = [
    { value: 'orbit', icon: <Orbit className="h-4 w-4" />, title: '3D orbit' },
    { value: 'top', icon: <Square className="h-4 w-4" />, title: 'Top-down' },
    { value: 'plan2d', icon: <Map className="h-4 w-4" />, title: '2D plan' },
    { value: 'firstPerson', icon: <PersonStanding className="h-4 w-4" />, title: 'Walkthrough' },
  ]

  const copy = async () => {
    if (!room) return
    try {
      await navigator.clipboard.writeText(buildViewLink(room, furniture))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* ignore */
    }
  }

  const editCopy = () => {
    resumePersistence()
    clearShareHash()
    setViewOnly(false)
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="pointer-events-auto absolute inset-x-3 top-3 z-30 flex items-center justify-between gap-3"
    >
      <div className="glass flex h-12 items-center gap-3 rounded-2xl px-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#8b6dff] to-[#5b8cff] text-white">
          <Boxes className="h-4.5 w-4.5" />
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold leading-none">{room?.name ?? 'Shared Room'}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--color-accent-soft)]">
            <Eye className="h-3 w-3" /> View only · {furniture.length} items
          </p>
        </div>
      </div>

      <div className="glass flex h-12 items-center rounded-2xl px-2">
        <Segmented value={view} onChange={setView} options={viewOptions} />
      </div>

      <div className="glass flex h-12 items-center gap-1.5 rounded-2xl px-2">
        <IconButton onClick={copy} title="Copy view link">
          {copied ? <Check className="h-4 w-4 text-[var(--color-free)]" /> : <Copy className="h-4 w-4" />}
        </IconButton>
        <Button variant="primary" size="sm" onClick={editCopy} title="Open this design in the editor">
          <PenLine className="h-3.5 w-3.5" /> Edit a copy
        </Button>
      </div>
    </motion.header>
  )
}
