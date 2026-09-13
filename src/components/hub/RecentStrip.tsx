import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { findApp, isInternal } from '../../data/apps'
import type { InternalApp, RecentEntry } from '../../types/app'
import { relativeTime } from '../../utils/time'

const SHOW = 4

export function RecentStrip({ entries }: { entries: RecentEntry[] }) {
  const items = entries
    .map((entry) => ({ entry, app: findApp(entry.id) }))
    .filter((item): item is { entry: RecentEntry; app: InternalApp } => !!item.app && isInternal(item.app))
    .slice(0, SHOW)

  if (items.length === 0) return null

  return (
    <section aria-labelledby="recent-heading" className="flex flex-col gap-s2">
      <h2 id="recent-heading" className="wb-eyebrow">
        Jump back in
      </h2>
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-px border border-line bg-line">
        {items.map(({ entry, app }) => (
          <li key={app.id} className="bg-surface">
            <Link
              to={app.route}
              style={{ '--tile-accent': `var(--accent-${app.accent})` } as CSSProperties}
              className="flex items-center gap-s2 px-s3 py-s2 text-fg hover:bg-surface-2"
            >
              <span aria-hidden className="size-2 flex-none bg-(--tile-accent)" />
              <span className="truncate text-base font-semibold">{app.name}</span>
              <span className="ml-auto flex-none font-mono text-xs text-fg-3">{relativeTime(entry.at)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
