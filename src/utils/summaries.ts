import type { StatItem } from '../components/common/Stats'
import type { BlackjackState, BlackjackStats } from '../types/blackjack'
import type { ConnectionsStats } from '../types/connections'
import type { CrosswordStats } from '../types/crossword'
import type { WordleStats } from '../types/wordle'
import { BLACKJACK_KEYS, EMPTY_BLACKJACK_STATS, STARTING_BANK, formatMoney } from './blackjack'
import { CONNECTIONS_KEYS, EMPTY_CONNECTIONS_STATS } from './connections'
import { CROSSWORD_KEYS, EMPTY_CROSSWORD_STATS } from './crossword'
import { dayNumber } from './daily'
import { getStored } from './storage'
import { formatClock } from './time'
import { EMPTY_STATS, WORDLE_KEYS, visibleStreak, winRate } from './wordle'

export interface AppSummary {
  /** Shown in the global stats modal. */
  stats: StatItem[]
  /** One short line for the hub tile, e.g. "Streak 4". */
  meta: string | null
}

type SummaryReader = () => AppSummary | null

/* Each game registers how to read its own saved stats. Readers run at render
   time, so the hub always shows what is in storage right now. */
const readers: Record<string, SummaryReader> = {
  wordle() {
    const daily = getStored<WordleStats>(WORDLE_KEYS.stats('daily'), EMPTY_STATS)
    const unlimited = getStored<WordleStats>(WORDLE_KEYS.stats('unlimited'), EMPTY_STATS)
    if (daily.played + unlimited.played === 0) return null
    const streak = visibleStreak(daily, dayNumber())
    return {
      stats: [
        { label: 'Daily played', value: daily.played },
        { label: 'Daily win %', value: winRate(daily) },
        { label: 'Daily streak', value: streak },
        { label: 'Unlimited wins', value: unlimited.wins },
      ],
      meta: daily.played ? `Streak ${streak} · ${winRate(daily)}% won` : `${unlimited.wins} unlimited wins`,
    }
  },

  connections() {
    const stats = getStored<ConnectionsStats>(CONNECTIONS_KEYS.stats, EMPTY_CONNECTIONS_STATS)
    if (stats.played === 0) return null
    return {
      stats: [
        { label: 'Played', value: stats.played },
        { label: 'Solved', value: stats.solved },
        { label: 'Perfect', value: stats.perfect },
        { label: 'Streak', value: stats.currentStreak },
      ],
      meta: `${stats.solved} of ${stats.played} solved · Streak ${stats.currentStreak}`,
    }
  },

  blackjack() {
    const table = getStored<BlackjackState | null>(BLACKJACK_KEYS.table, null)
    const stats = getStored<BlackjackStats>(BLACKJACK_KEYS.stats, EMPTY_BLACKJACK_STATS)
    if (!table && stats.hands === 0) return null
    const bank = table?.bank ?? STARTING_BANK
    return {
      stats: [
        { label: 'Hands', value: stats.hands },
        { label: 'Won %', value: stats.hands ? Math.round((stats.wins / stats.hands) * 100) : 0 },
        { label: 'Blackjacks', value: stats.blackjacks },
        { label: 'Chips', value: formatMoney(bank) },
      ],
      meta: `${formatMoney(bank)} in chips`,
    }
  },

  crossword() {
    const stats = getStored<CrosswordStats>(CROSSWORD_KEYS.stats, EMPTY_CROSSWORD_STATS)
    if (stats.solved === 0) return null
    const fastest = Math.min(...Object.values(stats.best))
    return {
      stats: [
        { label: 'Solved', value: stats.solved },
        { label: 'No help', value: stats.clean },
        { label: 'Fastest', value: formatClock(fastest) },
      ],
      meta: `${stats.solved} solved · Best ${formatClock(fastest)}`,
    }
  },
}

export function getAppSummary(id: string): AppSummary | null {
  return readers[id]?.() ?? null
}
