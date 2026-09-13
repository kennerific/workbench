export type LetterState = 'correct' | 'present' | 'absent'

export interface ScoredGuess {
  guess: string
  states: LetterState[]
}

export type WordleMode = 'daily' | 'unlimited'

export type GameStatus = 'playing' | 'won' | 'lost'

/** A saved round: the answer and committed guesses. Colours are recomputed on load. */
export interface WordleRecord {
  answer: string
  guesses: string[]
  /** Fixed at the first guess, so toggling the setting mid-round changes nothing. */
  hard: boolean
  /** Day number for a daily round; absent in unlimited mode. */
  day?: number
}

export interface WordleStats {
  played: number
  wins: number
  currentStreak: number
  bestStreak: number
  /** Wins by guess count, index 0 is a first-guess solve. */
  distribution: number[]
  /** Day number of the last recorded daily result. */
  lastDay?: number
}

export interface WordleSettings {
  hard: boolean
  highContrast: boolean
}
