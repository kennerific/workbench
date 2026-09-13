import { ANSWERS } from '../data/wordle-answers'
import { randomItem, seededShuffle } from './rng'

// Changing this reshuffles every future daily word, so leave it alone.
const DAILY_SEED = 20260101

let dailyOrder: string[] | null = null

/** The shared answer for a day number. The answer list is walked in a fixed, seeded order. */
export function dailyAnswer(day: number): string {
  dailyOrder ??= seededShuffle(ANSWERS, DAILY_SEED)
  const n = dailyOrder.length
  return dailyOrder[((day % n) + n) % n]
}

export function randomAnswer(exclude?: string): string {
  let word = randomItem(ANSWERS)
  while (word === exclude && ANSWERS.length > 1) word = randomItem(ANSWERS)
  return word
}

let guessSet: Promise<Set<string>> | null = null

/** The full guess dictionary, split into its own chunk and fetched once. */
export function loadGuessSet(): Promise<Set<string>> {
  guessSet ??= import('../data/wordle-guesses').then((module) => new Set(module.GUESSES))
  return guessSet
}
