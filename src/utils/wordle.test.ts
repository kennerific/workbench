import { describe, expect, it } from 'vitest'
import {
  EMPTY_STATS,
  evaluateGuess,
  gameStatus,
  hardModeViolation,
  isSolved,
  mergeKeyStates,
  recordResult,
  scoreGuesses,
  shareGrid,
  visibleStreak,
  winRate,
  type ScoredGuess,
} from './wordle'

function scored(guess: string, answer: string): ScoredGuess {
  return { guess, states: evaluateGuess(guess, answer) }
}

describe('evaluateGuess', () => {
  it('marks an exact match all correct', () => {
    expect(isSolved(evaluateGuess('CRANE', 'CRANE'))).toBe(true)
  })

  it('does not over-count a letter the answer has once', () => {
    // One E in CRANE, already claimed by the green in the last slot.
    expect(evaluateGuess('EERIE', 'CRANE')).toEqual(['absent', 'absent', 'present', 'absent', 'correct'])
  })

  it('lets a second copy be present when the answer has two', () => {
    // ABBEY has two Bs: one is green in slot 3, the other makes the final B yellow.
    expect(evaluateGuess('KEBAB', 'ABBEY')).toEqual(['absent', 'present', 'correct', 'present', 'present'])
  })

  it('gives green priority over an earlier yellow', () => {
    // One L in PLANT: the green in slot 2 claims it, so the L in slot 1 is grey.
    expect(evaluateGuess('LLAMA', 'PLANT')).toEqual(['absent', 'correct', 'correct', 'absent', 'absent'])
  })
})

describe('mergeKeyStates', () => {
  it('only ever upgrades a key', () => {
    const keys = mergeKeyStates([scored('TRACE', 'CRANE'), scored('CATER', 'CRANE')])
    expect(keys.C).toBe('correct')
    expect(keys.T).toBe('absent')
    expect(keys.R).toBe('correct')
  })
})

describe('hardModeViolation', () => {
  it('requires revealed greens to stay put', () => {
    expect(hardModeViolation('CRAMP', [scored('CRATE', 'CRANE')])).toBe('Letter 5 must be E')
  })

  it('requires revealed yellows to be reused', () => {
    expect(hardModeViolation('BLOOM', [scored('NASTY', 'CRANE')])).toBe('Guess must contain N')
  })

  it('accepts a guess that honours every hint', () => {
    expect(hardModeViolation('CRANE', [scored('NASTY', 'CRANE'), scored('CRATE', 'CRANE')])).toBeNull()
  })

  it('counts confirmed duplicates', () => {
    // KEBAB against ABBEY confirms two Bs, an E and an A.
    expect(hardModeViolation('ABBEY', [scored('KEBAB', 'ABBEY')])).toBeNull()
    expect(hardModeViolation('BEBOP', [scored('KEBAB', 'ABBEY')])).toBe('Guess must contain A')
    expect(hardModeViolation('BEGAN', [scored('KEBAB', 'ABBEY')])).toBe('Letter 3 must be B')
  })
})

describe('gameStatus', () => {
  it('is won as soon as a row is solved', () => {
    expect(gameStatus(scoreGuesses(['TRACE', 'CRANE'], 'CRANE'))).toBe('won')
  })

  it('is lost after six misses and playing before that', () => {
    const misses = ['TRACE', 'SLOTH', 'PUDGY', 'BLIMP', 'FIGHT']
    expect(gameStatus(scoreGuesses(misses, 'CRANE'))).toBe('playing')
    expect(gameStatus(scoreGuesses([...misses, 'WOUND'], 'CRANE'))).toBe('lost')
  })
})

describe('shareGrid', () => {
  it('prints a score line and one emoji row per guess', () => {
    const text = shareGrid([scored('TRACE', 'CRANE'), scored('CRANE', 'CRANE')], 'Workbench Wordle 255', true, false)
    expect(text).toBe('Workbench Wordle 255 2/6\n\n⬛🟩🟩🟨🟩\n🟩🟩🟩🟩🟩')
  })

  it('marks a loss with X and hard mode with an asterisk', () => {
    const rows = scoreGuesses(['TRACE', 'SLOTH', 'PUDGY', 'BLIMP', 'FIGHT', 'WOUND'], 'CRANE')
    expect(shareGrid(rows, 'W', false, true).split('\n')[0]).toBe('W X/6*')
  })
})

describe('stats', () => {
  it('builds a daily streak on consecutive days and restarts after a gap', () => {
    let stats = recordResult(EMPTY_STATS, true, 3, 10)
    stats = recordResult(stats, true, 4, 11)
    expect(stats.currentStreak).toBe(2)
    expect(stats.distribution).toEqual([0, 0, 1, 1, 0, 0])

    stats = recordResult(stats, true, 2, 13)
    expect(stats.currentStreak).toBe(1)
    expect(stats.bestStreak).toBe(2)
    expect(stats.played).toBe(3)
  })

  it('ignores a second result for the same day', () => {
    const once = recordResult(EMPTY_STATS, true, 3, 10)
    expect(recordResult(once, false, 6, 10)).toBe(once)
  })

  it('resets the streak on a loss and keeps the distribution for wins only', () => {
    let stats = recordResult(EMPTY_STATS, true, 5)
    stats = recordResult(stats, false, 6)
    expect(stats.currentStreak).toBe(0)
    expect(stats.bestStreak).toBe(1)
    expect(stats.distribution).toEqual([0, 0, 0, 0, 1, 0])
    expect(winRate(stats)).toBe(50)
  })

  it('shows a daily streak as lapsed after a missed day', () => {
    const stats = recordResult(EMPTY_STATS, true, 3, 10)
    expect(visibleStreak(stats, 11)).toBe(1)
    expect(visibleStreak(stats, 12)).toBe(0)
    expect(visibleStreak(stats)).toBe(1)
  })
})
