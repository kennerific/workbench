import type { StatItem } from '../components/common/Stats'

export interface AppSummary {
  /** Shown in the global stats modal. */
  stats: StatItem[]
  /** One short line for the hub tile, e.g. "Streak 4". */
  meta: string | null
}

type SummaryReader = () => AppSummary | null

/* Each game registers how to read its own saved stats. Readers run at render
   time, so the hub always shows what is in storage right now. */
const readers: Record<string, SummaryReader> = {}

export function getAppSummary(id: string): AppSummary | null {
  return readers[id]?.() ?? null
}
