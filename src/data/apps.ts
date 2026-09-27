import { ChartSpline, Compass, Grid3x3, LayoutGrid, Spade, Type } from 'lucide-react'
import type { AppEntry, AppTag, InternalApp } from '../types/app'

/* The one list of everything the hub offers. The launcher, search, global
   stats and per-route accent all read from here, so adding a tool starts with
   an entry in this array. */
export const APPS: readonly AppEntry[] = [
  {
    id: 'wordle',
    name: 'Wordle',
    description: 'Guess the five-letter word in six tries. One shared word a day, or unlimited rounds.',
    tags: ['Word', 'Daily'],
    accent: 'green',
    icon: Type,
    status: 'live',
    route: '/wordle',
  },
  {
    id: 'connections',
    name: 'Connections',
    description: 'Sort sixteen words into four hidden groups before you make four mistakes.',
    tags: ['Word', 'Puzzle', 'Daily'],
    accent: 'violet',
    icon: LayoutGrid,
    status: 'live',
    route: '/connections',
  },
  {
    id: 'blackjack',
    name: 'Blackjack',
    description: 'Beat a dealer who stands on 17. Split, double down, and keep your chips between visits.',
    tags: ['Casino'],
    accent: 'vermillion',
    icon: Spade,
    status: 'live',
    route: '/blackjack',
  },
  {
    id: 'crossword',
    name: 'Mini Crossword',
    description: 'Fill a 5x5 grid against the clock, with checks and reveals for when you get stuck.',
    tags: ['Word', 'Puzzle', 'Daily'],
    accent: 'cobalt',
    icon: Grid3x3,
    status: 'live',
    route: '/crossword',
  },
  {
    id: 'end-behavior',
    name: 'End Behavior',
    description: 'Classify polynomial graphs by where their ends go, then build your own on a grid.',
    tags: ['Study'],
    accent: 'teal',
    icon: ChartSpline,
    status: 'live',
    route: '/end-behavior',
  },
  {
    id: 'chartroom',
    name: 'Chartroom',
    description: 'Learn and drill 64 physical geography features on a real chart.',
    tags: ['Study'],
    accent: 'magenta',
    icon: Compass,
    status: 'external',
    href: 'https://kennerific.github.io/chartroom/',
  },
]

export const TAGS: readonly AppTag[] = ['Word', 'Puzzle', 'Daily', 'Casino', 'Study']

export function isInternal(app: AppEntry): app is InternalApp {
  return app.status !== 'external'
}

export function findApp(id: string): AppEntry | undefined {
  return APPS.find((app) => app.id === id)
}

/** The hosted app whose route owns this pathname, if any. */
export function appForPath(pathname: string): InternalApp | undefined {
  const segment = pathname.split('/').filter(Boolean)[0]
  if (!segment) return undefined
  return APPS.filter(isInternal).find((app) => app.route === `/${segment}`)
}
