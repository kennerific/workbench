import { describe, expect, it } from 'vitest'
import { dailyIndex, dateKey, dayNumber, msUntilNextDay } from './daily'
import { mulberry32, seededShuffle } from './rng'

describe('dayNumber', () => {
  it('starts at zero on the epoch', () => {
    expect(dayNumber(new Date(2026, 0, 1, 12))).toBe(0)
    expect(dayNumber(new Date(2026, 0, 2, 0, 1))).toBe(1)
  })

  it('ignores the time of day', () => {
    expect(dayNumber(new Date(2026, 8, 13, 0, 0, 1))).toBe(dayNumber(new Date(2026, 8, 13, 23, 59, 59)))
  })

  it('counts one per day across a daylight-saving change', () => {
    // March and November cover the DST switch in both hemispheres' common zones.
    expect(dayNumber(new Date(2026, 2, 30)) - dayNumber(new Date(2026, 2, 1))).toBe(29)
    expect(dayNumber(new Date(2026, 10, 30)) - dayNumber(new Date(2026, 10, 1))).toBe(29)
  })
})

describe('dailyIndex', () => {
  it('stays inside the list and wraps', () => {
    for (let day = 0; day < 40; day++) {
      const index = dailyIndex(7, new Date(2026, 0, 1 + day))
      expect(index).toBe(day % 7)
    }
  })

  it('handles dates before the epoch', () => {
    expect(dailyIndex(5, new Date(2025, 11, 31))).toBe(4)
  })
})

describe('dateKey and msUntilNextDay', () => {
  it('formats the local date', () => {
    expect(dateKey(new Date(2026, 8, 3, 23, 30))).toBe('2026-09-03')
  })

  it('counts down to local midnight', () => {
    expect(msUntilNextDay(new Date(2026, 8, 3, 23, 0, 0))).toBe(3_600_000)
  })
})

describe('seeded randomness', () => {
  it('is deterministic for a seed', () => {
    expect(seededShuffle([1, 2, 3, 4, 5, 6], 42)).toEqual(seededShuffle([1, 2, 3, 4, 5, 6], 42))
    const a = mulberry32(7)
    const b = mulberry32(7)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('keeps every item', () => {
    expect(seededShuffle([1, 2, 3, 4, 5, 6], 9).sort()).toEqual([1, 2, 3, 4, 5, 6])
  })
})
