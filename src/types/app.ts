import type { LucideIcon } from 'lucide-react'

/** The accent families solved in tokens.css. */
export type AccentName = 'graphite' | 'magenta' | 'cobalt' | 'teal' | 'green' | 'amber' | 'vermillion' | 'violet'

export type AppTag = 'Word' | 'Puzzle' | 'Casino' | 'Daily' | 'Study'

export type AppStatus = 'live' | 'external' | 'planned'

interface AppBase {
  id: string
  name: string
  description: string
  tags: AppTag[]
  accent: AccentName
  icon: LucideIcon
}

/** Hosted in this site, reached through the router. */
export interface InternalApp extends AppBase {
  status: 'live' | 'planned'
  route: string
}

/** A sibling tool on its own site. */
export interface ExternalApp extends AppBase {
  status: 'external'
  href: string
}

export type AppEntry = InternalApp | ExternalApp

export interface RecentEntry {
  id: string
  at: number
}

export type ThemeChoice = 'system' | 'light' | 'dark'
