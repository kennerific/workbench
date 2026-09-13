import type { AppEntry } from '../../types/app'
import { getAppSummary } from '../../utils/summaries'
import { AppTile } from './AppTile'

interface AppGridProps {
  apps: AppEntry[]
  favorites: readonly string[]
  onToggleFavorite: (id: string) => void
}

export function AppGrid({ apps, favorites, onToggleFavorite }: AppGridProps) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-s4 max-sm:grid-cols-1">
      {apps.map((app) => (
        <li key={app.id} className="flex">
          <AppTile
            app={app}
            favorite={favorites.includes(app.id)}
            onToggleFavorite={() => onToggleFavorite(app.id)}
            meta={getAppSummary(app.id)?.meta ?? null}
          />
        </li>
      ))}
    </ul>
  )
}
