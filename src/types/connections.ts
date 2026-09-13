/** 0 is the most straightforward group, 3 the trickiest. */
export type GroupLevel = 0 | 1 | 2 | 3

export interface ConnectionsGroup {
  label: string
  level: GroupLevel
  words: string[]
}

export interface ConnectionsPuzzle {
  id: string
  title: string
  author?: string
  groups: ConnectionsGroup[]
}

export type SubmitOutcome =
  | { kind: 'correct'; group: number }
  | { kind: 'one-away' }
  | { kind: 'wrong' }
  | { kind: 'duplicate' }
  | { kind: 'incomplete' }

export type ConnectionsStatus = 'playing' | 'won' | 'lost'

export interface ConnectionsState {
  puzzleId: string
  /** Words still on the board, in display order. */
  order: string[]
  selected: string[]
  /** Group indices in the order they were solved. */
  solved: number[]
  /** Group indices shown after a loss, easiest first. */
  revealed: number[]
  guesses: string[][]
  mistakes: number
  status: ConnectionsStatus
  /** The result of the latest submit, cleared when the selection changes. */
  outcome: SubmitOutcome | null
}

export interface ConnectionsStats {
  played: number
  solved: number
  perfect: number
  currentStreak: number
  bestStreak: number
}
