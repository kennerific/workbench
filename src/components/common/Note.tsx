import type { ReactNode } from 'react'
import { cx } from '../../utils/cx'

type Tone = 'neutral' | 'accent' | 'ok' | 'warn' | 'danger'

/* Status colour on its own soft wash measures below AA (4.0:1 for ok in the
   dark theme), so the rule and wash carry the tone and the text stays fg.
   contrast.test.ts holds this. */
const TONES: Record<Tone, string> = {
  neutral: 'border-l-line-strong bg-surface text-fg-2',
  accent: 'border-l-accent bg-accent-soft text-fg',
  ok: 'border-l-ok bg-ok-soft text-fg',
  warn: 'border-l-warn bg-warn-soft text-fg',
  danger: 'border-l-danger bg-danger-soft text-fg',
}

/** An inline status line with a coloured left rule. */
export function Note({ tone = 'neutral', className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <div className={cx('flex flex-wrap items-center gap-x-s3 gap-y-s2 border-l-2 px-s3 py-s2 text-base', TONES[tone], className)}>
      {children}
    </div>
  )
}
