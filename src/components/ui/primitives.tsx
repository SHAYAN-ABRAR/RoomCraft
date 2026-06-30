import { motion } from 'framer-motion'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ Button */
type ButtonProps = {
  variant?: 'primary' | 'glass' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>

export function Button({ variant = 'glass', size = 'md', className, children, ...rest }: ButtonProps) {
  const variants = {
    primary:
      'text-white bg-gradient-to-b from-[#8b6dff] to-[#6a45ff] shadow-[0_6px_20px_-6px_rgba(124,92,255,.8)] hover:brightness-110',
    glass: 'text-ink glass hover:bg-white/10',
    ghost: 'text-ink-soft hover:text-ink hover:bg-white/5',
    danger: 'text-[#ffb4b4] bg-[#fb6f6f]/10 hover:bg-[#fb6f6f]/20 border border-[#fb6f6f]/25',
  }
  const sizes = { sm: 'h-8 px-3 text-xs', md: 'h-10 px-4 text-sm', lg: 'h-12 px-6 text-base' }
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...(rest as object)}
    >
      {children}
    </motion.button>
  )
}

/* -------------------------------------------------------------- IconButton */
export function IconButton({
  active,
  className,
  children,
  ...rest
}: { active?: boolean; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ y: -1 }}
      className={cn(
        'grid h-9 w-9 place-items-center rounded-lg transition-colors',
        active ? 'bg-[var(--color-accent)]/20 text-white ring-1 ring-[var(--color-accent)]/50' : 'text-ink-soft hover:bg-white/8 hover:text-ink',
        className,
      )}
      {...(rest as object)}
    >
      {children}
    </motion.button>
  )
}

/* ------------------------------------------------------------------ Panel */
export function Panel({
  className,
  children,
  strong,
}: {
  className?: string
  children: ReactNode
  strong?: boolean
}) {
  return (
    <div className={cn('rounded-2xl', strong ? 'glass-strong' : 'glass', className)}>{children}</div>
  )
}

/* -------------------------------------------------------------- Segmented */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label?: string; icon?: ReactNode; title?: string }[]
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={cn('relative flex items-center gap-0.5 rounded-xl bg-black/30 p-1', className)}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            title={o.title ?? o.label}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative z-10 inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
              active ? 'text-white' : 'text-ink-faint hover:text-ink',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${options.map((x) => x.value).join('')}`}
                className="absolute inset-0 -z-10 rounded-lg bg-white/10 ring-1 ring-white/10"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            {o.icon}
            {o.label && <span>{o.label}</span>}
          </button>
        )
      })}
    </div>
  )
}

/* ----------------------------------------------------------------- Slider */
export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none
        [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none
        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md
        [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-110"
      style={{ background: `linear-gradient(90deg, var(--color-accent) ${pct}%, rgba(255,255,255,.1) ${pct}%)` }}
    />
  )
}

/* ----------------------------------------------------------------- Score bar */
export function ScoreBar({ label, value, hint }: { label: string; value: number; hint?: string }) {
  const color = value >= 70 ? 'var(--color-free)' : value >= 40 ? 'var(--color-warn)' : 'var(--color-collision)'
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="text-ink-soft">{label}</span>
        <span className="font-mono font-medium" style={{ color }}>
          {value}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
      {hint && <p className="mt-1 text-[10px] text-ink-faint">{hint}</p>}
    </div>
  )
}

/* -------------------------------------------------------------- Section label */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
      {children}
    </p>
  )
}
