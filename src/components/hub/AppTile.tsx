import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { ArrowRight, ArrowUpRight, Star } from 'lucide-react'
import type { AppEntry } from '../../types/app'
import { Badge } from '../common/Badge'

interface AppTileProps {
  app: AppEntry
  favorite: boolean
  onToggleFavorite: () => void
  meta: string | null
}

/* A launcher tile carries its own app's accent, so the grid reads as a family
   of instruments. The title link is stretched over the whole tile; the
   favourite button sits above it so both stay real, separate controls. */
export function AppTile({ app, favorite, onToggleFavorite, meta }: AppTileProps) {
  const Icon = app.icon
  const external = app.status === 'external'
  const style = { '--tile-accent': `var(--accent-${app.accent})` } as CSSProperties
  const linkClass = "text-fg outline-none after:absolute after:inset-0 after:content-['']"

  return (
    <article
      style={style}
      className="group relative flex w-full flex-col gap-s2 border border-t-[3px] border-fg border-t-(--tile-accent) bg-surface p-s4 transition-[background-color,translate] duration-(--dur-1) ease-wb hover:-translate-y-0.5 hover:bg-surface-2 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent"
    >
      <div className="flex items-start gap-s3">
        <span className="flex size-9 flex-none items-center justify-center border border-line text-(--tile-accent)">
          <Icon className="size-5" aria-hidden />
        </span>
        <h3 className="min-w-0 flex-1 self-center text-md">
          {external ? (
            <a href={app.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
              {app.name}
              <span className="wb-visually-hidden"> (opens in a new tab)</span>
            </a>
          ) : (
            <Link to={app.route} className={linkClass}>
              {app.name}
            </Link>
          )}
        </h3>
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-pressed={favorite}
          aria-label={favorite ? `Remove ${app.name} from favorites` : `Add ${app.name} to favorites`}
          title={favorite ? 'Remove from favorites' : 'Add to favorites'}
          className="relative z-10 -m-s1 flex size-8 flex-none items-center justify-center text-fg-3 hover:bg-surface-3 hover:text-fg aria-pressed:text-(--tile-accent)"
        >
          <Star className="size-4" fill={favorite ? 'currentColor' : 'none'} aria-hidden />
        </button>
      </div>

      <p className="text-base text-fg-2">{app.description}</p>

      <div className="flex flex-wrap gap-s1">
        {app.tags.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </div>

      <div className="mt-auto flex items-center gap-s2 pt-s2 font-mono text-xs text-fg-3">
        <span className="truncate">{meta ?? (external ? 'Separate site' : 'Not played yet')}</span>
        <span aria-hidden className="ml-auto flex items-center gap-s1 text-fg-2 group-hover:text-fg">
          {external ? 'Open' : 'Play'}
          {external ? <ArrowUpRight className="size-3.5" /> : <ArrowRight className="size-3.5" />}
        </span>
      </div>
    </article>
  )
}
