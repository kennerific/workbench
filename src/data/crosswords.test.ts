import { describe, expect, it } from 'vitest'
import { clueProblems, deriveEntries, gridProblems } from '../utils/crossword'
import { CROSSWORDS } from './crosswords'

/* The answer each printed clue should lead to. If a grid is edited, this is
   what proves the clues still point at the right words. */
const EXPECTED: Record<string, string[]> = {
  'board-meeting': ['1a BET', '4a BOARD', '6a ANGER', '7a DELAY', '8a SET', '1d BONES', '2d EAGLE', '3d TREAT', '4d BAD', '5d DRY'],
  stairwell: ['1a ERR', '4a ROOF', '6a ALBUM', '8a LOSE', '9a TEN', '1d ERA', '2d ROLL', '3d ROBOT', '5d FUSE', '7d MEN'],
  arches: ['1a ARCH', '5a SPARE', '6a EATER', '7a TRIED', '8a STOP', '1d APART', '2d RATIO', '3d CREEP', '4d HERD', '5d SETS'],
  'movie-night': ['1a RAM', '4a HOLES', '6a ABIDE', '7a MOVIE', '8a TEA', '1d ROBOT', '2d ALIVE', '3d MEDIA', '4d HAM', '5d SEE'],
}

describe('built-in crosswords', () => {
  it('has at least three, with unique ids', () => {
    expect(CROSSWORDS.length).toBeGreaterThanOrEqual(3)
    expect(new Set(CROSSWORDS.map((p) => p.id)).size).toBe(CROSSWORDS.length)
  })

  it.each(CROSSWORDS.map((p) => [p.id, p] as const))('%s has a valid grid and exactly one clue per answer', (_, puzzle) => {
    expect(gridProblems(puzzle)).toEqual([])
    expect(clueProblems(puzzle)).toEqual([])
  })

  it.each(CROSSWORDS.map((p) => [p.id, p] as const))('%s maps every clue to its intended answer', (id, puzzle) => {
    const actual = deriveEntries(puzzle).map((e) => `${e.number}${e.direction[0]} ${e.answer}`)
    expect(actual).toEqual(EXPECTED[id])
  })
})
