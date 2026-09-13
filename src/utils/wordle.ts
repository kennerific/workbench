import type { GameStatus, LetterState, ScoredGuess, WordleMode, WordleStats } from '../types/wordle'

export type { LetterState, ScoredGuess } from '../types/wordle'

export const WORD_LENGTH = 5
export const MAX_GUESSES = 6

export const WORDLE_KEYS = {
  mode: 'wordle:mode',
  settings: 'wordle:settings',
  daily: 'wordle:daily',
  unlimited: 'wordle:unlimited',
  stats: (mode: WordleMode) => `wordle:stats:${mode}`,
} as const

/* Two passes so repeated letters score like the original game: exact matches
   claim their letters first, then each remaining guess letter can only be
   "present" while unclaimed copies of it are left in the answer. */
export function evaluateGuess(guess: string, answer: string): LetterState[] {
  const states: LetterState[] = Array.from({ length: guess.length }, () => 'absent')
  const unclaimed = new Map<string, number>()

  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answer[i]) states[i] = 'correct'
    else unclaimed.set(answer[i], (unclaimed.get(answer[i]) ?? 0) + 1)
  }

  for (let i = 0; i < guess.length; i++) {
    if (states[i] === 'correct') continue
    const left = unclaimed.get(guess[i]) ?? 0
    if (left > 0) {
      states[i] = 'present'
      unclaimed.set(guess[i], left - 1)
    }
  }

  return states
}

export function scoreGuesses(guesses: readonly string[], answer: string): ScoredGuess[] {
  return guesses.map((guess) => ({ guess, states: evaluateGuess(guess, answer) }))
}

export function isSolved(states: readonly LetterState[]): boolean {
  return states.every((state) => state === 'correct')
}

export function gameStatus(rows: readonly ScoredGuess[]): GameStatus {
  if (rows.some((row) => isSolved(row.states))) return 'won'
  return rows.length >= MAX_GUESSES ? 'lost' : 'playing'
}

const RANK: Record<LetterState, number> = { absent: 0, present: 1, correct: 2 }

/** Best known state per letter for colouring the keyboard. A key only ever upgrades. */
export function mergeKeyStates(rows: readonly ScoredGuess[]): Record<string, LetterState> {
  const keys: Record<string, LetterState> = {}
  for (const { guess, states } of rows) {
    for (let i = 0; i < guess.length; i++) {
      const current = keys[guess[i]]
      if (!current || RANK[states[i]] > RANK[current]) keys[guess[i]] = states[i]
    }
  }
  return keys
}

/* Hard mode: every revealed green stays in place and every revealed letter is
   used again, as many times as it has been confirmed in a single row. */
export function hardModeViolation(guess: string, rows: readonly ScoredGuess[]): string | null {
  for (const row of rows) {
    for (let i = 0; i < row.guess.length; i++) {
      if (row.states[i] === 'correct' && guess[i] !== row.guess[i]) {
        return `Letter ${i + 1} must be ${row.guess[i]}`
      }
    }
  }

  const required = new Map<string, number>()
  for (const row of rows) {
    const counts = new Map<string, number>()
    row.guess.split('').forEach((letter, i) => {
      if (row.states[i] !== 'absent') counts.set(letter, (counts.get(letter) ?? 0) + 1)
    })
    counts.forEach((n, letter) => required.set(letter, Math.max(required.get(letter) ?? 0, n)))
  }

  for (const [letter, n] of required) {
    const used = guess.split('').filter((l) => l === letter).length
    if (used < n) return n > 1 ? `Guess must contain ${letter} ${n} times` : `Guess must contain ${letter}`
  }
  return null
}

const EMOJI: Record<LetterState, string> = { correct: '🟩', present: '🟨', absent: '⬛' }

/** The spoiler-free emoji grid people paste into chats. */
export function shareGrid(rows: readonly ScoredGuess[], title: string, won: boolean, hard: boolean): string {
  const score = won ? rows.length : 'X'
  const header = `${title} ${score}/${MAX_GUESSES}${hard ? '*' : ''}`
  return [header, '', ...rows.map((row) => row.states.map((s) => EMOJI[s]).join(''))].join('\n')
}

export const EMPTY_STATS: WordleStats = {
  played: 0,
  wins: 0,
  currentStreak: 0,
  bestStreak: 0,
  distribution: [0, 0, 0, 0, 0, 0],
}

/* Daily streaks need a result on consecutive days; unlimited streaks only
   need consecutive wins. A second daily result for the same day is ignored. */
export function recordResult(stats: WordleStats, won: boolean, guesses: number, day?: number): WordleStats {
  if (day !== undefined && stats.lastDay === day) return stats
  const continues = day === undefined || stats.lastDay === day - 1
  const currentStreak = won ? (continues ? stats.currentStreak + 1 : 1) : 0
  const distribution = [...stats.distribution]
  if (won) distribution[guesses - 1] += 1
  return {
    played: stats.played + 1,
    wins: stats.wins + (won ? 1 : 0),
    currentStreak,
    bestStreak: Math.max(stats.bestStreak, currentStreak),
    distribution,
    lastDay: day ?? stats.lastDay,
  }
}

/** The streak to display. A daily streak lapses once a whole day passes without a result. */
export function visibleStreak(stats: WordleStats, today?: number): number {
  if (today === undefined || stats.lastDay === undefined) return stats.currentStreak
  return today - stats.lastDay > 1 ? 0 : stats.currentStreak
}

export function winRate(stats: WordleStats): number {
  return stats.played ? Math.round((stats.wins / stats.played) * 100) : 0
}
