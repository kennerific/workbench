import { describe, expect, it } from 'vitest'
import { filterApps, matchesQuery } from './search'
import { APPS } from '../data/apps'

describe('matchesQuery', () => {
  const wordle = APPS.find((app) => app.id === 'wordle')!

  it('matches everything on an empty query', () => {
    expect(matchesQuery(wordle, '   ')).toBe(true)
  })

  it('is case-insensitive and searches tags', () => {
    expect(matchesQuery(wordle, 'WORD')).toBe(true)
    expect(matchesQuery(wordle, 'daily')).toBe(true)
  })

  it('requires every term', () => {
    expect(matchesQuery(wordle, 'word casino')).toBe(false)
  })
})

describe('filterApps', () => {
  it('filters by tag', () => {
    const ids = filterApps(APPS, '', 'Casino').map((app) => app.id)
    expect(ids).toEqual(['blackjack'])
  })

  it('pins favourites first and keeps registry order otherwise', () => {
    const ids = filterApps(APPS, '', null, ['crossword']).map((app) => app.id)
    expect(ids[0]).toBe('crossword')
    const rest = APPS.map((app) => app.id).filter((id) => id !== 'crossword')
    expect(ids.slice(1)).toEqual(rest)
  })
})
