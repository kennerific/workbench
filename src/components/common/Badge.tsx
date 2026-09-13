import type { ReactNode } from 'react'
import { cx } from '../../utils/cx'

type Tone = 'neutral' | 'accent' | 'ok' | 'warn' | 'danger'

const TONES: Record<Tone, string> = {
  neutral: 'border-line-strong text-fg-3',
  accent: 'border-accent-line text-accent',
  ok: 'border-ok text-ok',
  warn: 'border-warn text-warn',
  danger: 'border-danger text-danger',
}

export function Badge({ tone = 'neutral', className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-s1 border px-[5px] py-px font-mono text-[9.5px] leading-normal tracking-[.08em] uppercase',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
