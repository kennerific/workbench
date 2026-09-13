import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { ChartColumn } from 'lucide-react'
import type { InternalApp } from '../../types/app'
import { cx } from '../../utils/cx'
import { SearchBar } from '../hub/SearchBar'
import { Button } from './Button'
import { SoundToggle } from './SoundToggle'
import { StatsModal } from './StatsModal'
import { ThemeToggle } from './ThemeToggle'

export function Masthead({ app }: { app?: InternalApp }) {
  const { pathname } = useLocation()
  const [statsOpen, setStatsOpen] = useState(false)
  const onHub = pathname === '/'

  return (
    <header className="sticky top-0 z-20 border-b border-fg bg-surface">
      <div className="mx-auto flex min-h-(--header-h) max-w-shell flex-wrap items-center gap-x-s4 gap-y-s2 px-s5 py-s2 max-sm:px-s4">
        {/* Inside an app the breadcrumb takes the spare width and truncates, so
            the actions stay on the first row of a phone-width masthead. */}
        <nav aria-label="Breadcrumb" className={cx('flex min-w-0 items-center gap-s2', app && 'flex-1')}>
          {/* The square of accent says which tool you are in at a glance. */}
          <Link
            to="/"
            className="flex flex-none items-center gap-s2 text-lg font-semibold tracking-[-.03em] text-fg before:size-[11px] before:flex-none before:bg-accent before:content-['']"
          >
            Workbench
          </Link>
          {app && (
            <>
              <span aria-hidden className="text-fg-3">
                /
              </span>
              <span aria-current="page" className="truncate text-md font-semibold tracking-[-.015em]">
                {app.name}
              </span>
            </>
          )}
        </nav>

        {onHub && (
          <div className="order-last basis-full sm:order-none sm:ml-s2 sm:w-80 sm:basis-auto">
            <SearchBar />
          </div>
        )}

        <div className="ml-auto flex items-center gap-s1">
          <Button variant="quiet" size="icon" onClick={() => setStatsOpen(true)} aria-label="Your stats" title="Your stats">
            <ChartColumn className="size-4" aria-hidden />
          </Button>
          <SoundToggle />
          <ThemeToggle />
        </div>
      </div>
      <StatsModal open={statsOpen} onClose={() => setStatsOpen(false)} />
    </header>
  )
}
