import type { CrosswordProgress, CrosswordPuzzle, CrosswordStats, Cursor, Direction, Entry } from '../types/crossword'

export const SIZE = 5
export const BLOCK = '#'

export const CROSSWORD_KEYS = {
  current: 'crossword:current',
  stats: 'crossword:stats',
  progress: (id: string) => `crossword:progress:${id}`,
} as const

export function rowOf(index: number): number {
  return Math.floor(index / SIZE)
}

export function colOf(index: number): number {
  return index % SIZE
}

export function solutionAt(puzzle: CrosswordPuzzle, index: number): string {
  return puzzle.solution[rowOf(index)][colOf(index)]
}

export function isBlock(puzzle: CrosswordPuzzle, index: number): boolean {
  return solutionAt(puzzle, index) === BLOCK
}

function open(puzzle: CrosswordPuzzle, row: number, col: number): boolean {
  return row >= 0 && row < SIZE && col >= 0 && col < SIZE && puzzle.solution[row][col] !== BLOCK
}

export function gridProblems(puzzle: CrosswordPuzzle): string[] {
  if (puzzle.solution.length !== SIZE) return [`The grid needs ${SIZE} rows.`]
  const problems: string[] = []
  puzzle.solution.forEach((row, r) => {
    if (!new RegExp(`^[A-Z#]{${SIZE}}$`).test(row)) problems.push(`Row ${r + 1} must be ${SIZE} capital letters or #.`)
  })
  return problems
}

/** The printed number for each cell, or null. Numbers run in reading order. */
export function numberCells(puzzle: CrosswordPuzzle): (number | null)[] {
  const numbers: (number | null)[] = []
  let next = 0
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const startsAcross = open(puzzle, r, c) && !open(puzzle, r, c - 1) && open(puzzle, r, c + 1)
      const startsDown = open(puzzle, r, c) && !open(puzzle, r - 1, c) && open(puzzle, r + 1, c)
      numbers.push(startsAcross || startsDown ? ++next : null)
    }
  }
  return numbers
}

/** Every answer slot with its clue. Across entries first, each list in number order. */
export function deriveEntries(puzzle: CrosswordPuzzle): Entry[] {
  const numbers = numberCells(puzzle)
  const across: Entry[] = []
  const down: Entry[] = []

  numbers.forEach((number, index) => {
    if (number === null) return
    const r = rowOf(index)
    const c = colOf(index)
    if (!open(puzzle, r, c - 1) && open(puzzle, r, c + 1)) {
      const cells: number[] = []
      for (let k = c; open(puzzle, r, k); k++) cells.push(r * SIZE + k)
      across.push(entry(puzzle, number, 'across', cells))
    }
    if (!open(puzzle, r - 1, c) && open(puzzle, r + 1, c)) {
      const cells: number[] = []
      for (let k = r; open(puzzle, k, c); k++) cells.push(k * SIZE + c)
      down.push(entry(puzzle, number, 'down', cells))
    }
  })

  return [...across, ...down]
}

function entry(puzzle: CrosswordPuzzle, number: number, direction: Direction, cells: number[]): Entry {
  return {
    number,
    direction,
    cells,
    answer: cells.map((i) => solutionAt(puzzle, i)).join(''),
    clue: puzzle.clues[direction][String(number)] ?? '',
  }
}

/** Clues with no slot and slots with no clue. Empty means the puzzle is consistent. */
export function clueProblems(puzzle: CrosswordPuzzle): string[] {
  const entries = deriveEntries(puzzle)
  const problems: string[] = []
  for (const e of entries) {
    if (!e.clue.trim()) problems.push(`${e.number} ${e.direction} (${e.answer}) has no clue.`)
  }
  for (const direction of ['across', 'down'] as const) {
    for (const key of Object.keys(puzzle.clues[direction])) {
      if (!entries.some((e) => e.direction === direction && String(e.number) === key)) {
        problems.push(`Clue ${key} ${direction} has no answer in the grid.`)
      }
    }
  }
  return problems
}

export function entryFor(entries: readonly Entry[], index: number, direction: Direction): Entry | undefined {
  return entries.find((e) => e.direction === direction && e.cells.includes(index))
}

const other = (direction: Direction): Direction => (direction === 'across' ? 'down' : 'across')

export function startCursor(entries: readonly Entry[]): Cursor {
  const first = entries[0]
  return { index: first.cells[0], direction: first.direction }
}

export function toggleDirection(entries: readonly Entry[], cursor: Cursor): Cursor {
  const flipped = other(cursor.direction)
  return entryFor(entries, cursor.index, flipped) ? { ...cursor, direction: flipped } : cursor
}

/** Clicking the selected cell flips direction; clicking another keeps it when that cell allows. */
export function clickCell(entries: readonly Entry[], cursor: Cursor, index: number): Cursor {
  if (index === cursor.index) return toggleDirection(entries, cursor)
  if (entryFor(entries, index, cursor.direction)) return { index, direction: cursor.direction }
  return { index, direction: other(cursor.direction) }
}

export type ArrowKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'

/* An arrow across the current direction first turns the cursor, as in most
   crossword apps. An arrow along it moves to the next open cell, skipping
   black cells, and stops at the edge. */
export function arrowMove(puzzle: CrosswordPuzzle, entries: readonly Entry[], cursor: Cursor, key: ArrowKey): Cursor {
  const axis: Direction = key === 'ArrowLeft' || key === 'ArrowRight' ? 'across' : 'down'
  if (axis !== cursor.direction && entryFor(entries, cursor.index, axis)) return { ...cursor, direction: axis }

  const dr = key === 'ArrowUp' ? -1 : key === 'ArrowDown' ? 1 : 0
  const dc = key === 'ArrowLeft' ? -1 : key === 'ArrowRight' ? 1 : 0
  let r = rowOf(cursor.index) + dr
  let c = colOf(cursor.index) + dc
  while (r >= 0 && r < SIZE && c >= 0 && c < SIZE) {
    if (open(puzzle, r, c)) {
      const index = r * SIZE + c
      return { index, direction: entryFor(entries, index, cursor.direction) ? cursor.direction : axis }
    }
    r += dr
    c += dc
  }
  return cursor
}

export function firstEmpty(entry: Entry, letters: readonly string[]): number {
  return entry.cells.find((i) => !letters[i]) ?? entry.cells[0]
}

/** Tab and Shift+Tab: the next entry that still has a blank, wrapping, or simply the next entry once the grid is full. */
export function jumpEntry(entries: readonly Entry[], cursor: Cursor, letters: readonly string[], delta: 1 | -1): Cursor {
  const current = entryFor(entries, cursor.index, cursor.direction)
  const at = current ? entries.indexOf(current) : -1
  const anyBlank = entries.some((e) => e.cells.some((i) => !letters[i]))
  for (let step = 1; step <= entries.length; step++) {
    const e = entries[(((at + delta * step) % entries.length) + entries.length) % entries.length]
    if (!anyBlank || e.cells.some((i) => !letters[i])) return { index: firstEmpty(e, letters), direction: e.direction }
  }
  return cursor
}

/* Where the cursor goes after a letter is typed: the next blank later in the
   word, then any blank earlier in it, then the next word with a blank. When
   the whole grid is full it just steps forward within the word. */
export function afterType(entries: readonly Entry[], cursor: Cursor, letters: readonly string[]): Cursor {
  const e = entryFor(entries, cursor.index, cursor.direction)
  if (!e) return cursor
  const pos = e.cells.indexOf(cursor.index)
  const later = e.cells.slice(pos + 1).find((i) => !letters[i])
  if (later !== undefined) return { ...cursor, index: later }
  const earlier = e.cells.slice(0, pos).find((i) => !letters[i])
  if (earlier !== undefined) return { ...cursor, index: earlier }
  const anyBlank = entries.some((x) => x.cells.some((i) => !letters[i]))
  if (anyBlank) return jumpEntry(entries, cursor, letters, 1)
  return pos < e.cells.length - 1 ? { ...cursor, index: e.cells[pos + 1] } : cursor
}

/** Backspace clears the current cell, or steps back and clears the previous one if this cell is already blank. */
export function backspace(
  entries: readonly Entry[],
  cursor: Cursor,
  letters: readonly string[],
): { cursor: Cursor; letters: string[] } {
  const next = [...letters]
  if (next[cursor.index]) {
    next[cursor.index] = ''
    return { cursor, letters: next }
  }
  const e = entryFor(entries, cursor.index, cursor.direction)
  const pos = e ? e.cells.indexOf(cursor.index) : -1
  if (!e || pos <= 0) return { cursor, letters: next }
  const previous = e.cells[pos - 1]
  next[previous] = ''
  return { cursor: { ...cursor, index: previous }, letters: next }
}

export function emptyLetters(): string[] {
  return Array.from({ length: SIZE * SIZE }, () => '')
}

export function openCells(puzzle: CrosswordPuzzle): number[] {
  return Array.from({ length: SIZE * SIZE }, (_, i) => i).filter((i) => !isBlock(puzzle, i))
}

/** Filled cells whose letter does not match the solution. */
export function wrongCells(puzzle: CrosswordPuzzle, letters: readonly string[], cells = openCells(puzzle)): number[] {
  return cells.filter((i) => letters[i] && letters[i] !== solutionAt(puzzle, i))
}

export function isFilled(puzzle: CrosswordPuzzle, letters: readonly string[]): boolean {
  return openCells(puzzle).every((i) => !!letters[i])
}

export function isSolved(puzzle: CrosswordPuzzle, letters: readonly string[]): boolean {
  return openCells(puzzle).every((i) => letters[i] === solutionAt(puzzle, i))
}

export function freshProgress(): CrosswordProgress {
  return { letters: emptyLetters(), revealed: [], wrong: [], seconds: 0, solved: false, helped: false }
}

export const EMPTY_CROSSWORD_STATS: CrosswordStats = { solved: 0, clean: 0, best: {} }

export function recordSolve(stats: CrosswordStats, id: string, seconds: number, helped: boolean): CrosswordStats {
  const best = stats.best[id]
  return {
    solved: stats.solved + 1,
    clean: stats.clean + (helped ? 0 : 1),
    best: { ...stats.best, [id]: best === undefined ? seconds : Math.min(best, seconds) },
  }
}
