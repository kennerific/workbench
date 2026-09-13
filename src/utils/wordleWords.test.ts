import { describe, expect, it } from 'vitest'
import { ANSWERS } from '../data/wordle-answers'
import { GUESSES } from '../data/wordle-guesses'
import { dailyAnswer, loadGuessSet, randomAnswer } from './wordleWords'

describe('word lists', () => {
  it('holds five-letter uppercase answers, every one accepted as a guess', () => {
    const guesses = new Set(GUESSES)
    expect(ANSWERS.length).toBeGreaterThan(1500)
    for (const word of ANSWERS) {
      expect(word).toMatch(/^[A-Z]{5}$/)
      expect(guesses.has(word)).toBe(true)
    }
  })

  it('has no duplicates', () => {
    expect(new Set(ANSWERS).size).toBe(ANSWERS.length)
    expect(new Set(GUESSES).size).toBe(GUESSES.length)
  })
})

describe('answers', () => {
  it('gives the same daily answer for the same day, before and after the epoch', () => {
    expect(dailyAnswer(100)).toBe(dailyAnswer(100))
    expect(ANSWERS).toContain(dailyAnswer(-3))
  })

  it('does not repeat within the first month', () => {
    const month = new Set(Array.from({ length: 30 }, (_, day) => dailyAnswer(day)))
    expect(month.size).toBe(30)
  })

  it('never repeats the excluded word', () => {
    const last = ANSWERS[0]
    for (let i = 0; i < 50; i++) expect(randomAnswer(last)).not.toBe(last)
  })

  it('loads the guess dictionary on demand', async () => {
    const set = await loadGuessSet()
    expect(set.has(ANSWERS[0])).toBe(true)
    expect(set.has('ZZZZZ')).toBe(false)
  })
})
