import type { ReactNode } from 'react'
import { cx } from '../../utils/cx'

export interface StatItem {
  label: string
  value: ReactNode
}

/** A hairline grid of mono readouts. The value reads first; the label sits under it. */
export function Stats({ items, className }: { items: StatItem[]; className?: string }) {
  return (
    <dl
      className={cx(
        'grid grid-cols-[repeat(auto-fit,minmax(5.5rem,1fr))] gap-px border border-line-2 bg-line-2',
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="flex flex-col-reverse bg-surface px-s4 py-s3">
          <dt className="mt-0.5 font-mono text-[9.5px] tracking-[.13em] text-fg-3 uppercase">{item.label}</dt>
          <dd className="font-mono text-lg leading-[1.1] font-medium tabular-nums">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
