import type { RecentEntry } from '../types/app'
import { getStored, setStored } from './storage'

export const RECENT_KEY = 'recent'
const KEEP = 8

/** Move an app to the front of the recently played list. */
export function recordRecent(id: string, now = Date.now()): void {
  const list = getStored<RecentEntry[]>(RECENT_KEY, [])
  setStored(RECENT_KEY, [{ id, at: now }, ...list.filter((entry) => entry.id !== id)].slice(0, KEEP))
}
