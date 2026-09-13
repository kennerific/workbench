import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { APPS, TAGS } from '../data/apps'
import { useFavorites } from '../hooks/useFavorites'
import { useRecent } from '../hooks/useRecent'
import type { AppTag } from '../types/app'
import { filterApps } from '../utils/search'
import { Button } from '../components/common/Button'
import { PageHeader } from '../components/common/PageHeader'
import { AppGrid } from '../components/hub/AppGrid'
import { RecentStrip } from '../components/hub/RecentStrip'
import { TagFilter } from '../components/hub/TagFilter'

export function HubPage() {
  const [params, setParams] = useSearchParams()
  const recent = useRecent()
  const { favorites, toggleFavorite } = useFavorites()

  const query = params.get('q') ?? ''
  const tagParam = params.get('tag')
  const tag = TAGS.find((t) => t === tagParam) ?? null
  const filtering = query.trim() !== '' || tag !== null

  const apps = useMemo(() => filterApps(APPS, query, tag, favorites), [query, tag, favorites])

  function setTag(next: AppTag | null) {
    setParams(
      (prev) => {
        const updated = new URLSearchParams(prev)
        if (next) updated.set('tag', next)
        else updated.delete('tag')
        return updated
      },
      { replace: true },
    )
  }

  return (
    <>
      <PageHeader
        title="Games and tools"
        note="Daily puzzles, word games and a card table. Streaks, stats and chip balances are saved in this browser."
      >
        <TagFilter value={tag} onChange={setTag} />
      </PageHeader>

      {!filtering && <RecentStrip entries={recent} />}

      <p className="wb-visually-hidden" aria-live="polite">
        {filtering ? `${apps.length} ${apps.length === 1 ? 'result' : 'results'}` : ''}
      </p>

      {apps.length > 0 ? (
        <AppGrid apps={apps} favorites={favorites} onToggleFavorite={toggleFavorite} />
      ) : (
        <div className="flex flex-col items-start gap-s3 border border-line bg-surface px-s4 py-s6 text-fg-2">
          <h2 className="text-md text-fg">Nothing matches {query.trim() ? `“${query.trim()}”` : 'that tag'}</h2>
          <p>Try another word, or clear the search and tag.</p>
          <Button onClick={() => setParams({}, { replace: true })}>Clear search</Button>
        </div>
      )}
    </>
  )
}
