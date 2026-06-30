import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, Download, FolderOpen, Link2, X } from 'lucide-react'
import { useDesignStore, resumePersistence } from '@/store/useDesignStore'
import { buildViewLink, decodeDesign } from '@/lib/share'
import { exportJSON } from '@/lib/export'
import { Button } from '@/components/ui/primitives'

export function ShareModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const room = useDesignStore((s) => s.room)
  const furniture = useDesignStore((s) => s.furniture)
  const loadDesign = useDesignStore((s) => s.loadDesign)

  const [copied, setCopied] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  const link = useMemo(
    () => (room && open ? buildViewLink(room, furniture) : ''),
    [room, furniture, open],
  )

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setError('Could not copy — select the text and copy manually.')
    }
  }

  const openShared = () => {
    const d = decodeDesign(input)
    if (!d) {
      setError('That link or code is not valid.')
      return
    }
    resumePersistence()
    loadDesign(d.room, d.furniture, { viewOnly: false })
    setInput('')
    setError('')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="glass-strong relative z-10 w-full max-w-md rounded-3xl p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <Link2 className="h-5 w-5 text-[var(--color-accent-soft)]" /> Share & Open
              </h2>
              <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-ink-faint hover:bg-white/8 hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Share current design */}
            {room && (
              <div className="mb-5">
                <p className="mb-1 text-sm font-medium text-ink">View-only link</p>
                <p className="mb-3 text-xs text-ink-faint">
                  Anyone with this link can orbit your design in 3D on any device — but can't edit it.
                </p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={link}
                    onFocus={(e) => e.currentTarget.select()}
                    className="min-w-0 flex-1 truncate rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 font-mono text-xs text-ink-soft outline-none"
                  />
                  <Button variant={copied ? 'primary' : 'glass'} onClick={copy} className="shrink-0">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <button
                  onClick={() => room && exportJSON(room, furniture)}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink-faint transition-colors hover:text-ink"
                >
                  <Download className="h-3.5 w-3.5" /> or download a .json backup
                </button>
              </div>
            )}

            {room && <div className="my-5 h-px bg-white/8" />}

            {/* Open a shared design */}
            <div>
              <p className="mb-1 text-sm font-medium text-ink">Open a shared design</p>
              <p className="mb-3 text-xs text-ink-faint">Paste a share link (or code) to load it here and edit it.</p>
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  setError('')
                }}
                rows={2}
                placeholder="https://…#v=…"
                className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 font-mono text-xs text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-[var(--color-accent)]/50"
              />
              {error && <p className="mt-2 text-xs text-[var(--color-collision)]">{error}</p>}
              <Button variant="primary" className="mt-3 w-full" onClick={openShared} disabled={!input.trim()}>
                <FolderOpen className="h-4 w-4" /> Open design
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
