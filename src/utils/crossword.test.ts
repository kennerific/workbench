import { describe, expect, it } from 'vitest'
import type { CrosswordPuzzle } from '../types/crossword'
import {
  EMPTY_CROSSWORD_STATS,
  afterType,
  arrowMove,
  backspace,
  clickCell,
  clueProblems,
  deriveEntries,
  emptyLetters,
  gridProblems,
  isSolved,
  jumpEntry,
  numberCells,
  recordSolve,
  startCursor,
  wrongCells,
} from './crossword'

/* Grid logic only cares where the black cells are, so the fixture spells the
   alphabet rather than real words:

     # A B C #        1  2  3        across 1 4 6 7 8
     D E F G H     4  .  .  .  5     down   1 2 3 4 5
     I J K L M     6  .  .  .  .
     N O P Q R     7  .  .  .  .
     # S T U #        8  .  .                        */
const fixture: CrosswordPuzzle = {
  id: 'fixture',
  title: 'Fixture',
  solution: ['#ABC#', 'DEFGH', 'IJKLM', 'NOPQR', '#STU#'],
  clues: {
    across: { 1: 'a1', 4: 'a4', 6: 'a6', 7: 'a7', 8: 'a8' },
    down: { 1: 'd1', 2: 'd2', 3: 'd3', 4: 'd4', 5: 'd5' },
  },
}
const entries = deriveEntries(fixture)

function filled(cells: number[]): string[] {
  const letters = emptyLetters()
  for (const i of cells) letters[i] = 'X'
  return letters
}

describe('grid numbering', () => {
  it('numbers cells that start a word, in reading order', () => {
    const numbers = numberCells(fixture)
    expect(numbers.flatMap((n, i) => (n === null ? [] : [[i, n]]))).toEqual([
      [1, 1], [2, 2], [3, 3], [5, 4], [9, 5], [10, 6], [15, 7], [21, 8],
    ])
  })

  it('derives every entry with its answer and clue', () => {
    expect(entries.map((e) => `${e.number}${e.direction[0]} ${e.answer} ${e.clue}`)).toEqual([
      '1a ABC a1', '4a DEFGH a4', '6a IJKLM a6', '7a NOPQR a7', '8a STU a8',
      '1d AEJOS d1', '2d BFKPT d2', '3d CGLQU d3', '4d DIN d4', '5d HMR d5',
    ])
  })

  it('reports clues and slots that do not line up', () => {
    expect(clueProblems(fixture)).toEqual([])
    const broken = { ...fixture, clues: { across: { ...fixture.clues.across, 2: 'extra' }, down: { 1: 'd1' } } }
    expect(clueProblems(broken)).toEqual([
      '2 down (BFKPT) has no clue.',
      '3 down (CGLQU) has no clue.',
      '4 down (DIN) has no clue.',
      '5 down (HMR) has no clue.',
      'Clue 2 across has no answer in the grid.',
    ])
    expect(gridProblems({ ...fixture, solution: ['#abc#', 'DEFGH', 'IJKLM', 'NOPQR', '#STU'] })).toEqual([
      'Row 1 must be 5 capital letters or #.',
      'Row 5 must be 5 capital letters or #.',
    ])
  })
})

describe('cursor movement', () => {
  it('starts on 1 across', () => {
    expect(startCursor(entries)).toEqual({ index: 1, direction: 'across' })
  })

  it('flips direction when the selected cell is clicked again', () => {
    expect(clickCell(entries, { index: 6, direction: 'across' }, 6)).toEqual({ index: 6, direction: 'down' })
    // 4 down has no across partner at the bottom-left cell, so the flip is refused there.
    expect(clickCell(entries, { index: 15, direction: 'down' }, 15)).toEqual({ index: 15, direction: 'across' })
  })

  it('keeps direction on a new cell when the cell allows it', () => {
    expect(clickCell(entries, { index: 1, direction: 'down' }, 10)).toEqual({ index: 10, direction: 'down' })
    expect(clickCell(entries, { index: 1, direction: 'down' }, 12)).toEqual({ index: 12, direction: 'down' })
  })

  it('turns first on a perpendicular arrow, then moves', () => {
    let cursor = arrowMove(fixture, entries, { index: 6, direction: 'across' }, 'ArrowDown')
    expect(cursor).toEqual({ index: 6, direction: 'down' })
    cursor = arrowMove(fixture, entries, cursor, 'ArrowDown')
    expect(cursor).toEqual({ index: 11, direction: 'down' })
  })

  it('stops at the edge and never lands on a black cell', () => {
    expect(arrowMove(fixture, entries, { index: 5, direction: 'across' }, 'ArrowLeft')).toEqual({ index: 5, direction: 'across' })
    expect(arrowMove(fixture, entries, { index: 19, direction: 'down' }, 'ArrowDown')).toEqual({ index: 19, direction: 'down' })
    expect(arrowMove(fixture, entries, { index: 3, direction: 'across' }, 'ArrowRight')).toEqual({ index: 3, direction: 'across' })
  })
})

describe('typing', () => {
  it('moves to the next blank in the word', () => {
    expect(afterType(entries, { index: 5, direction: 'across' }, filled([5]))).toEqual({ index: 6, direction: 'across' })
    expect(afterType(entries, { index: 5, direction: 'across' }, filled([5, 6, 7]))).toEqual({ index: 8, direction: 'across' })
  })

  it('goes back for a skipped blank before leaving the word', () => {
    expect(afterType(entries, { index: 9, direction: 'across' }, filled([5, 6, 8, 9]))).toEqual({ index: 7, direction: 'across' })
  })

  it('jumps to the next word with a blank once the word is full', () => {
    expect(afterType(entries, { index: 9, direction: 'across' }, filled([5, 6, 7, 8, 9]))).toEqual({ index: 10, direction: 'across' })
  })

  it('tabs forward and back through words, wrapping', () => {
    const letters = emptyLetters()
    expect(jumpEntry(entries, { index: 1, direction: 'across' }, letters, 1)).toEqual({ index: 5, direction: 'across' })
    expect(jumpEntry(entries, { index: 1, direction: 'across' }, letters, -1)).toEqual({ index: 9, direction: 'down' })
    // Full words are skipped.
    expect(jumpEntry(entries, { index: 1, direction: 'across' }, filled([5, 6, 7, 8, 9]), 1)).toEqual({ index: 10, direction: 'across' })
  })

  it('clears the current letter, then steps back on an empty cell', () => {
    const first = backspace(entries, { index: 6, direction: 'across' }, filled([5, 6]))
    expect(first.cursor.index).toBe(6)
    expect(first.letters[6]).toBe('')
    const second = backspace(entries, first.cursor, first.letters)
    expect(second.cursor.index).toBe(5)
    expect(second.letters[5]).toBe('')
    // At the start of a word there is nowhere to go.
    expect(backspace(entries, second.cursor, second.letters).cursor.index).toBe(5)
  })
})

describe('checking', () => {
  it('finds wrong letters and recognises a solve', () => {
    const letters = emptyLetters()
    fixture.solution.join('').split('').forEach((ch, i) => {
      if (ch !== '#') letters[i] = ch
    })
    expect(isSolved(fixture, letters)).toBe(true)
    letters[7] = 'Z'
    expect(wrongCells(fixture, letters)).toEqual([7])
    expect(isSolved(fixture, letters)).toBe(false)
  })

  it('keeps the best time per puzzle and counts clean solves', () => {
    let stats = recordSolve(EMPTY_CROSSWORD_STATS, 'a', 90, false)
    stats = recordSolve(stats, 'a', 120, true)
    expect(stats).toEqual({ solved: 2, clean: 1, best: { a: 90 } })
  })
})
