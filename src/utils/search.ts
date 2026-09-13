import type { AppEntry, AppTag } from '../types/app'

/** Every whitespace-separated term must appear in the name, description or tags. */
export function matchesQuery(app: AppEntry, query: string): boolean {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return true
  const haystack = [app.name, app.description, ...app.tags].join(' ').toLowerCase()
  return terms.every((term) => haystack.includes(term))
}

/** Filter by query and tag, then pin favourites first without reordering either group. */
export function filterApps(
  apps: readonly AppEntry[],
  query: string,
  tag: AppTag | null,
  favorites: readonly string[] = [],
): AppEntry[] {
  const matches = apps.filter((app) => (!tag || app.tags.includes(tag)) && matchesQuery(app, query))
  const pinned = new Set(favorites)
  return [...matches.filter((app) => pinned.has(app.id)), ...matches.filter((app) => !pinned.has(app.id))]
}
