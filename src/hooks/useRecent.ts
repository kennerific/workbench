import type { RecentEntry } from '../types/app'
import { RECENT_KEY } from '../utils/recent'
import { useLocalStorage } from './useLocalStorage'

const EMPTY: RecentEntry[] = []

/** Recently opened apps, newest first. Written by recordRecent. */
export function useRecent(): RecentEntry[] {
  return useLocalStorage<RecentEntry[]>(RECENT_KEY, EMPTY)[0]
}
