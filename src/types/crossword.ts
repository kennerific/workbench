export type Direction = 'across' | 'down'

export interface CrosswordPuzzle {
  id: string
  title: string
  author?: string
  /** Five rows of five characters: A to Z, or # for a black cell. */
  solution: string[]
  /** Clues keyed by the number printed in the grid. */
  clues: {
    across: Record<string, string>
    down: Record<string, string>
  }
}

/** One answer slot, derived from the grid so it can never disagree with it. */
export interface Entry {
  number: number
  direction: Direction
  /** Cell indices, row * size + column, in reading order. */
  cells: number[]
  answer: string
  clue: string
}

export interface Cursor {
  index: number
  direction: Direction
}

export interface CrosswordProgress {
  /** One letter per cell, empty string for blank or black. */
  letters: string[]
  revealed: number[]
  /** Cells marked wrong by the last check, cleared as they are retyped. */
  wrong: number[]
  seconds: number
  solved: boolean
  /** Any check or reveal was used. */
  helped: boolean
}

export interface CrosswordStats {
  solved: number
  /** Solved without checks or reveals. */
  clean: number
  /** Fastest solve per puzzle id, in seconds. */
  best: Record<string, number>
}
