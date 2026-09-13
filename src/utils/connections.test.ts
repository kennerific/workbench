import { describe, expect, it } from 'vitest'
import { PUZZLES } from '../data/connections'
import type { ConnectionsPuzzle, ConnectionsState } from '../types/connections'
import {
  EMPTY_CONNECTIONS_STATS,
  MAX_MISTAKES,
  allWords,
  createState,
  evaluateSelection,
  normalizePuzzle,
  puzzleProblems,
  recordConnections,
  reduceConnections,
} from './connections'

const puzzle = normalizePuzzle(PUZZLES[0])
const [g0, g1, g2, g3] = puzzle.groups.map((group) => group.words)

function play(state: ConnectionsState, words: string[], p: ConnectionsPuzzle = puzzle): ConnectionsState {
  let next = reduceConnections(state, { type: 'deselect' }, p)
  for (const word of words) next = reduceConnections(next, { type: 'toggle', word }, p)
  return reduceConnections(next, { type: 'submit' }, p)
}

describe('built-in puzzles', () => {
  it('has at least five, all valid, with unique ids', () => {
    expect(PUZZLES.length).toBeGreaterThanOrEqual(5)
    for (const p of PUZZLES) expect(puzzleProblems(p), p.id).toEqual([])
    expect(new Set(PUZZLES.map((p) => p.id)).size).toBe(PUZZLES.length)
  })

  it('stores words already upper case and groups in level order', () => {
    for (const p of PUZZLES) expect(normalizePuzzle(p)).toEqual(p)
  })
})

describe('puzzleProblems', () => {
  it('explains what is wrong with a bad puzzle', () => {
    expect(puzzleProblems(null)).toEqual(['The puzzle must be a JSON object.'])
    expect(puzzleProblems({ id: 'x', title: 'x', groups: [] })).toEqual(['"groups" must be a list of exactly 4 groups.'])

    const duplicate = structuredClone(PUZZLES[0])
    duplicate.groups[1].words[0] = 'navy'
    duplicate.groups[2].level = 0
    // Problems are listed group by group: the repeat is in group 2, the level clash in group 3.
    expect(puzzleProblems(duplicate)).toEqual(['"NAVY" appears more than once.', 'Level 0 is used by more than one group.'])
  })
})

describe('evaluateSelection', () => {
  it('recognises a correct group, one away and wrong', () => {
    expect(evaluateSelection(puzzle, g2, [])).toEqual({ kind: 'correct', group: 2 })
    expect(evaluateSelection(puzzle, [...g0.slice(0, 3), g1[0]], [])).toEqual({ kind: 'one-away' })
    expect(evaluateSelection(puzzle, [g0[0], g0[1], g1[0], g1[1]], [])).toEqual({ kind: 'wrong' })
  })

  it('spots a repeated guess in any order', () => {
    const guess = [g0[0], g0[1], g1[0], g1[1]]
    expect(evaluateSelection(puzzle, [...guess].reverse(), [guess])).toEqual({ kind: 'duplicate' })
  })

  it('needs four words', () => {
    expect(evaluateSelection(puzzle, g0.slice(0, 3), [])).toEqual({ kind: 'incomplete' })
  })
})

describe('reduceConnections', () => {
  const fresh = () => createState(puzzle, allWords(puzzle))

  it('selects at most four words and toggles them off again', () => {
    let state = fresh()
    for (const word of [...g0, g1[0]]) state = reduceConnections(state, { type: 'toggle', word }, puzzle)
    expect(state.selected).toEqual(g0)
    state = reduceConnections(state, { type: 'toggle', word: g0[0] }, puzzle)
    expect(state.selected).toEqual(g0.slice(1))
  })

  it('keeps the selection and counts a mistake when one away', () => {
    const state = play(fresh(), [...g0.slice(0, 3), g1[0]])
    expect(state.outcome).toEqual({ kind: 'one-away' })
    expect(state.mistakes).toBe(1)
    expect(state.selected).toHaveLength(4)
  })

  it('does not charge for a repeated guess', () => {
    const guess = [...g0.slice(0, 3), g1[0]]
    const once = play(fresh(), guess)
    const twice = reduceConnections(once, { type: 'submit' }, puzzle)
    expect(twice.outcome).toEqual({ kind: 'duplicate' })
    expect(twice.mistakes).toBe(1)
  })

  it('removes a solved group from the board', () => {
    const state = play(fresh(), g3)
    expect(state.solved).toEqual([3])
    expect(state.order).toHaveLength(12)
    expect(state.order.some((word) => g3.includes(word))).toBe(false)
  })

  it('wins when every group is found', () => {
    let state = fresh()
    for (const group of [g1, g0, g3, g2]) state = play(state, group)
    expect(state.status).toBe('won')
    expect(state.solved).toEqual([1, 0, 3, 2])
  })

  it('loses on the fourth mistake and reveals the rest easiest first', () => {
    let state = play(fresh(), g2)
    const misses = [
      [g0[0], g1[0], g3[0], g0[1]],
      [g0[0], g1[0], g3[0], g1[1]],
      [g0[0], g1[0], g3[0], g3[1]],
      [g0[1], g1[1], g3[1], g0[2]],
    ]
    for (const miss of misses) state = play(state, miss)
    expect(state.mistakes).toBe(MAX_MISTAKES)
    expect(state.status).toBe('lost')
    expect(state.revealed).toEqual([0, 1, 3])
    expect(state.order).toEqual([])
    // Nothing changes after the game ends.
    expect(reduceConnections(state, { type: 'toggle', word: g0[0] }, puzzle)).toBe(state)
  })

  it('only accepts a shuffle of the words still on the board', () => {
    const state = fresh()
    const reversed = [...state.order].reverse()
    expect(reduceConnections(state, { type: 'shuffle', order: reversed }, puzzle).order).toEqual(reversed)
    expect(reduceConnections(state, { type: 'shuffle', order: reversed.slice(1) }, puzzle)).toBe(state)
  })
})

describe('recordConnections', () => {
  it('tracks solves, perfect games and streaks', () => {
    let stats = recordConnections(EMPTY_CONNECTIONS_STATS, true, 0)
    stats = recordConnections(stats, true, 2)
    expect(stats).toMatchObject({ played: 2, solved: 2, perfect: 1, currentStreak: 2, bestStreak: 2 })
    stats = recordConnections(stats, false, 4)
    expect(stats).toMatchObject({ played: 3, solved: 2, currentStreak: 0, bestStreak: 2 })
  })
})
