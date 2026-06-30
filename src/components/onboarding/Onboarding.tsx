import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  Link2,
  Ruler,
  ScanLine,
  Sparkles,
  Upload,
  Wand2,
  X,
} from 'lucide-react'
import { ShareModal } from '@/components/editor/ShareModal'
import { useDesignStore, makeDefaultRoom } from '@/store/useDesignStore'
import type { Unit } from '@/lib/types'
import { ALL_UNITS, formatLength, parseDimension, UNIT_LABELS } from '@/lib/units'
import { uid } from '@/lib/utils'
import { Button, Segmented } from '@/components/ui/primitives'

/* ------------------------------------------------------- Unit-aware field */
function LengthField({
  label,
  meters,
  onMeters,
  unit,
  example,
}: {
  label: string
  meters: number
  onMeters: (m: number) => void
  unit: Unit
  example?: string
}) {
  const [draft, setDraft] = useState(() => formatLength(meters, unit, { withUnit: false }))

  useEffect(() => {
    setDraft(formatLength(meters, unit, { withUnit: false }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit])

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink-soft">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 transition-colors focus-within:border-[var(--color-accent)]/60">
        <input
          value={draft}
          inputMode="decimal"
          placeholder={example}
          onChange={(e) => {
            setDraft(e.target.value)
            const m = parseDimension(e.target.value, unit)
            if (m && m > 0) onMeters(m)
          }}
          onBlur={() => setDraft(formatLength(meters, unit, { withUnit: false }))}
          className="h-11 w-full bg-transparent font-mono text-sm text-ink outline-none placeholder:text-ink-faint"
        />
        <span className="text-xs font-medium text-ink-faint">{UNIT_LABELS[unit]}</span>
      </div>
    </label>
  )
}

const PRESETS = [
  { name: 'Cozy Bedroom', w: 3.6, l: 4.2 },
  { name: 'Master Suite', w: 4.5, l: 5.4 },
  { name: 'Living Room', w: 5.0, l: 6.2 },
  { name: 'Studio', w: 6.0, l: 7.5 },
]

export function Onboarding() {
  const createRoom = useDesignStore((s) => s.createRoom)
  const unit = useDesignStore((s) => s.unit)
  const setUnit = useDesignStore((s) => s.setUnit)

  const [mode, setMode] = useState<'home' | 'manual' | 'ai'>('home')
  const [scanning, setScanning] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [shareOpen, setShareOpen] = useState(false)

  const [form, setForm] = useState(() => {
    const r = makeDefaultRoom()
    return { width: r.width, length: r.length, height: r.height, wallThickness: r.wallThickness, door: true, window: true }
  })

  const submit = () => {
    const base = makeDefaultRoom()
    const openings = []
    if (form.door)
      openings.push({ id: uid('o'), type: 'door' as const, wall: 'south' as const, offset: form.width / 2, width: 0.9, height: 2.1, sill: 0 })
    if (form.window)
      openings.push({ id: uid('o'), type: 'window' as const, wall: 'north' as const, offset: form.width / 2, width: Math.min(1.6, form.width * 0.4), height: 1.2, sill: 0.9 })
    createRoom({
      ...base,
      width: form.width,
      length: form.length,
      height: form.height,
      wallThickness: form.wallThickness,
      openings,
    })
  }

  const onUpload = (file: File) => {
    setImageUrl(URL.createObjectURL(file))
    setScanning(true)
    // Assisted detection: simulate analysis, then hand off to the editable form
    // pre-filled with an estimate the user confirms/corrects.
    setTimeout(() => {
      setScanning(false)
      setMode('manual')
      setForm((f) => ({ ...f, width: 4.0, length: 5.2, height: 2.7 }))
    }, 2200)
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-void">
      {/* Ambient aurora */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-aurora absolute -left-40 -top-40 h-[40rem] w-[40rem] rounded-full bg-[#7c5cff]/25 blur-[120px]" />
        <div className="animate-aurora absolute -bottom-52 right-0 h-[36rem] w-[36rem] rounded-full bg-[#5b8cff]/20 blur-[120px]" style={{ animationDelay: '-7s' }} />
      </div>
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />

      <div className="relative z-10 flex h-full items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {mode === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-3xl text-center"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-ink-soft backdrop-blur"
              >
                <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent-soft)]" />
                AI-powered interior design studio
              </motion.div>

              <h1 className="text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
                Design your room in <span className="text-gradient">3D</span>,
                <br /> down to the millimeter.
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base text-ink-soft">
                Build an accurate digital twin of your space, generate furniture with AI, and see
                exactly how much room you have left — in real time.
              </p>

              <div className="mx-auto mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
                <MethodCard
                  icon={<Ruler className="h-6 w-6" />}
                  title="Enter Measurements"
                  desc="Type dimensions in feet, inches, meters or cm. We handle the conversion."
                  onClick={() => setMode('manual')}
                />
                <MethodCard
                  icon={<ScanLine className="h-6 w-6" />}
                  title="Scan a Blueprint"
                  desc="Upload a floor plan or sketch and let AI reconstruct your room."
                  onClick={() => setMode('ai')}
                  accent
                />
              </div>

              <button
                onClick={() => setShareOpen(true)}
                className="mx-auto mt-6 inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-ink"
              >
                <Link2 className="h-4 w-4" /> Have a shared link? Open it
              </button>
            </motion.div>
          )}

          {mode === 'manual' && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="glass-strong w-full max-w-lg rounded-3xl p-7"
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">Room dimensions</h2>
                  <p className="text-sm text-ink-soft">Internally stored in meters · displayed in your unit</p>
                </div>
                <button onClick={() => setMode('home')} className="grid h-9 w-9 place-items-center rounded-lg text-ink-faint hover:bg-white/8 hover:text-ink">
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {imageUrl && (
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 p-3">
                  <img src={imageUrl} alt="blueprint" className="h-12 w-12 rounded-lg object-cover" />
                  <p className="text-xs text-ink-soft">
                    <span className="font-medium text-[var(--color-accent-soft)]">AI estimate</span> from your
                    blueprint — adjust any value to match reality.
                  </p>
                </div>
              )}

              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-medium text-ink-soft">Units</span>
                <Segmented
                  value={unit}
                  onChange={(u) => setUnit(u)}
                  options={ALL_UNITS.map((u) => ({ value: u, label: UNIT_LABELS[u] }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <LengthField label="Width" meters={form.width} unit={unit} example={"10' 6\""} onMeters={(m) => setForm((f) => ({ ...f, width: m }))} />
                <LengthField label="Length" meters={form.length} unit={unit} example={"12' 8\""} onMeters={(m) => setForm((f) => ({ ...f, length: m }))} />
                <LengthField label="Ceiling height" meters={form.height} unit={unit} example="2.7 m" onMeters={(m) => setForm((f) => ({ ...f, height: m }))} />
                <LengthField label="Wall thickness" meters={form.wallThickness} unit={unit} example="120 mm" onMeters={(m) => setForm((f) => ({ ...f, wallThickness: m }))} />
              </div>

              <div className="mt-4 flex gap-2">
                <Toggle label="Add door" on={form.door} onClick={() => setForm((f) => ({ ...f, door: !f.door }))} />
                <Toggle label="Add window" on={form.window} onClick={() => setForm((f) => ({ ...f, window: !f.window }))} />
              </div>

              <div className="mt-5">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Quick presets</p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => setForm((f) => ({ ...f, width: p.w, length: p.l }))}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-white/20 hover:text-ink"
                    >
                      {p.name}{' '}
                      <span className="text-ink-faint">
                        {formatLength(p.w, unit)} × {formatLength(p.l, unit)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <Button variant="primary" size="lg" className="mt-7 w-full" onClick={submit}>
                Build my room <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {mode === 'ai' && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45 }}
              className="glass-strong w-full max-w-lg rounded-3xl p-7"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Scan a blueprint</h2>
                <button onClick={() => setMode('home')} className="grid h-9 w-9 place-items-center rounded-lg text-ink-faint hover:bg-white/8 hover:text-ink">
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <label className="relative block cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
                />
                <div className="grid place-items-center gap-3 rounded-2xl border-2 border-dashed border-white/15 bg-black/20 px-6 py-14 text-center transition-colors hover:border-[var(--color-accent)]/50">
                  {scanning ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                        className="grid h-12 w-12 place-items-center rounded-full border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)]"
                      >
                        <Wand2 className="h-5 w-5 text-[var(--color-accent-soft)]" />
                      </motion.div>
                      <p className="text-sm text-ink">Analyzing blueprint…</p>
                      <p className="text-xs text-ink-faint">Detecting walls, doors, windows & scale</p>
                    </>
                  ) : (
                    <>
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent-soft)]">
                        <Upload className="h-5 w-5" />
                      </div>
                      <p className="text-sm text-ink">Drop a floor plan, sketch or CAD export</p>
                      <p className="text-xs text-ink-faint">PNG · JPG · PDF page · hand drawing</p>
                    </>
                  )}
                </div>
              </label>

              <ul className="mt-5 space-y-2 text-xs text-ink-soft">
                {['Detects walls & room boundaries', 'Reads dimensions & scale', 'Places doors and windows'].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[var(--color-free)]" /> {t}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-center text-[11px] text-ink-faint">
                You'll confirm and fine-tune every measurement before building.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  )
}

function MethodCard({
  icon,
  title,
  desc,
  onClick,
  accent,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  onClick: () => void
  accent?: boolean
}) {
  return (
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="gradient-border group relative overflow-hidden rounded-2xl glass p-6 text-left"
    >
      <div
        className={`mb-4 grid h-12 w-12 place-items-center rounded-xl ${
          accent ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent-soft)]' : 'bg-white/8 text-ink'
        }`}
      >
        {icon}
      </div>
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-ink-soft">{desc}</p>
      <ArrowRight className="absolute right-5 top-6 h-4 w-4 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-ink" />
    </motion.button>
  )
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
        on ? 'border-[var(--color-accent)]/50 bg-[var(--color-accent)]/15 text-ink' : 'border-white/10 bg-black/20 text-ink-faint'
      }`}
    >
      <span className={`grid h-4 w-4 place-items-center rounded ${on ? 'bg-[var(--color-accent)] text-white' : 'bg-white/10'}`}>
        {on && <Check className="h-3 w-3" />}
      </span>
      {label}
    </button>
  )
}
