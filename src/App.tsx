import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { pausePersistence, useDesignStore } from '@/store/useDesignStore'
import { useKeyboard } from '@/hooks/useKeyboard'
import { decodeDesign, readShareCodeFromUrl } from '@/lib/share'
import { Onboarding } from '@/components/onboarding/Onboarding'
import { Scene } from '@/components/scene/Scene'
import { TopBar } from '@/components/editor/TopBar'
import { CatalogPanel } from '@/components/editor/CatalogPanel'
import { RightSidebar } from '@/components/editor/RightSidebar'
import { AIChat } from '@/components/editor/AIChat'
import { ViewerBar } from '@/components/editor/ViewerBar'

export default function App() {
  const phase = useDesignStore((s) => s.phase)
  const room = useDesignStore((s) => s.room)
  const viewOnly = useDesignStore((s) => s.viewOnly)
  const loadDesign = useDesignStore((s) => s.loadDesign)
  useKeyboard()

  // A share link (#v=...) opens the design in read-only viewer mode without
  // overwriting whatever the visitor already had saved locally.
  useEffect(() => {
    const code = readShareCodeFromUrl()
    if (!code) return
    const d = decodeDesign(code)
    if (!d) return
    pausePersistence()
    loadDesign(d.room, d.furniture, { viewOnly: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const inEditor = phase === 'editor' && room

  return (
    <div className="relative h-full w-full overflow-hidden">
      <AnimatePresence mode="wait">
        {!inEditor ? (
          <motion.div key="onboarding" exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="absolute inset-0">
            <Onboarding />
          </motion.div>
        ) : (
          <motion.div
            key="editor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-void"
          >
            <div className="absolute inset-0">
              <Scene />
            </div>
            {viewOnly ? (
              <ViewerBar />
            ) : (
              <>
                <TopBar />
                <CatalogPanel />
                <RightSidebar />
                <AIChat />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
