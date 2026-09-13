import { describe, expect, it } from 'vitest'
import { formatClock, relativeTime } from './time'

describe('relativeTime', () => {
  const now = 1_000_000_000_000
  it('buckets by minute, hour and day', () => {
    expect(relativeTime(now - 10_000, now)).toBe('just now')
    expect(relativeTime(now - 5 * 60_000, now)).toBe('5m ago')
    expect(relativeTime(now - 3 * 3_600_000, now)).toBe('3h ago')
    expect(relativeTime(now - 2 * 86_400_000, now)).toBe('2d ago')
  })

  it('never reports the future', () => {
    expect(relativeTime(now + 60_000, now)).toBe('just now')
  })
})

describe('formatClock', () => {
  it('pads seconds and adds hours when needed', () => {
    expect(formatClock(7)).toBe('0:07')
    expect(formatClock(125)).toBe('2:05')
    expect(formatClock(3725)).toBe('1:02:05')
  })
})
