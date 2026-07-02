import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, Bot, Sparkles, Wifi, WifiOff, X } from 'lucide-react'
import { useDesignStore } from '@/store/useDesignStore'
import { AI_MODEL_LABEL, chatWithAI, probeAI } from '@/ai/ollama'
import { executeActions } from '@/ai/execute'

interface Msg {
  role: 'user' | 'ai'
  text: string
  source?: 'model' | 'offline'
}

const SUGGESTIONS = [
  'Make the room Scandinavian',
  'Generate a walnut wardrobe 2m wide',
  'Add a king bed and two nightstands',
  'Change everything to oak',
  'Furnish a luxury bedroom',
]

function buildContext(): string {
  const s = useDesignStore.getState()
  const r = s.room
  if (!r) return ''
  const items = s.furniture.length
    ? s.furniture.map((f) => f.name).join(', ')
    : 'empty room'
  return `Room is ${r.width.toFixed(2)}m wide × ${r.length.toFixed(2)}m long, ceiling ${r.height}m. In the room: ${items}. Free floor: ${s.analysis.freePct}%.`
}

export function AIChat() {
  const [open, setOpen] = useState(false)
  const [online, setOnline] = useState<boolean | null>(null)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'ai', text: "Hi! I'm your design assistant. Tell me what to add, move, restyle or resize — e.g. \"Generate a modern white wardrobe\".", source: 'offline' },
  ])
  const unit = useDesignStore((s) => s.unit)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Probe the AI backend once on open. Generous timeout: serverless cold
  // starts in production can take a few seconds.
  useEffect(() => {
    if (!open || online !== null) return
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 5000)
    probeAI(ctrl.signal)
      .then(setOnline)
      .finally(() => clearTimeout(t))
    return () => ctrl.abort()
  }, [open, online])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || busy) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: trimmed }])
    setBusy(true)
    try {
      const result = await chatWithAI(trimmed, buildContext(), unit)
      if (result.actions.length) executeActions(result.actions)
      setMessages((m) => [...m, { role: 'ai', text: result.reply, source: result.fromModel ? 'model' : 'offline' }])
      if (result.fromModel) setOnline(true)
    } catch {
      setMessages((m) => [...m, { role: 'ai', text: 'Something went wrong applying that — try rephrasing.', source: 'offline' }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex flex-col items-center">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="glass-strong pointer-events-auto mb-3 flex h-[60vh] max-h-[520px] w-[min(92vw,460px)] flex-col overflow-hidden rounded-3xl"
          >
            {/* header */}
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#8b6dff] to-[#5b8cff] text-white">
                  <Bot className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-none">Design Assistant</p>
                  <p className="mt-1 flex items-center gap-1 text-[10px] text-ink-faint">
                    {online === false ? (
                      <><WifiOff className="h-3 w-3" /> Offline mode · built-in understanding</>
                    ) : online ? (
                      <><Wifi className="h-3 w-3 text-[var(--color-free)]" /> {AI_MODEL_LABEL}</>
                    ) : (
                      <>Connecting…</>
                    )}
                  </p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-faint hover:bg-white/8 hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-gradient-to-b from-[#8b6dff] to-[#6a45ff] text-white'
                        : 'border border-white/8 bg-white/[0.04] text-ink-soft'
                    }`}
                  >
                    {m.text}
                  </div>
                </motion.div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="flex gap-1 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-ink-faint"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* suggestions */}
            {messages.length <= 2 && (
              <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
                {SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    onClick={() => send(sug)}
                    className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-[var(--color-accent)]/40 hover:text-ink"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}

            {/* input */}
            <div className="flex items-end gap-2 border-t border-white/8 p-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send(input)
                  }
                }}
                rows={1}
                placeholder="Ask me to design your room…"
                className="max-h-24 flex-1 resize-none rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-[var(--color-accent)]/50"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => send(input)}
                disabled={!input.trim() || busy}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-b from-[#8b6dff] to-[#6a45ff] text-white transition-opacity disabled:opacity-40"
              >
                <ArrowUp className="h-4.5 w-4.5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* launcher */}
      <motion.button
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-gradient-to-b from-[#8b6dff] to-[#6a45ff] px-5 py-3 text-sm font-medium text-white shadow-[0_10px_40px_-8px_rgba(124,92,255,.7)]"
      >
        <Sparkles className="h-4 w-4" />
        {open ? 'Close assistant' : 'Ask AI to design'}
      </motion.button>
    </div>
  )
}
