const DAY_MS = 86_400_000
const EPOCH = Date.UTC(2026, 0, 1)

/** The player's local calendar date as YYYY-MM-DD. */
export function dateKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/* Whole days from 2026-01-01 to the local calendar date. The local y/m/d is
   read first and the subtraction done in UTC, so neither the time of day nor
   a daylight-saving shift can move a date onto a neighbouring number. */
export function dayNumber(date = new Date()): number {
  return Math.round((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - EPOCH) / DAY_MS)
}

/** Today's slot in a list of the given length, the same for everyone on the same local date. */
export function dailyIndex(length: number, date = new Date()): number {
  return ((dayNumber(date) % length) + length) % length
}

/** Milliseconds until local midnight, for "next puzzle in" countdowns. */
export function msUntilNextDay(now = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return next.getTime() - now.getTime()
}
