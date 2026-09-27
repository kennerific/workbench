import type {
  ClassKey,
  End,
  EndBehaviorStats,
  EndClass,
  Ends,
  GraphPrompt,
  Mode,
  Poly,
  Tally,
} from '../types/endBehavior'
import { shuffled } from './rng'

export const END_KEYS = {
  mode: 'end-behavior:mode',
  stats: 'end-behavior:stats',
} as const

export const MAX_DEGREE = 5
/** The grid spans -AXIS to AXIS on both axes. */
export const AXIS = 6
/** Intercepts the player can place on the grid. */
export const ROOT_RANGE = 5
/** Random curves keep their roots inside this, so both ends stay visible. */
const RANDOM_RANGE = 4
/** Tallest turning point after scaling, in grid units. */
const PEAK = 4
const SAMPLES = 480

export const CLASS_KEYS: readonly ClassKey[] = ['positive-even', 'negative-even', 'positive-odd', 'negative-odd']

const DEGREES: Record<EndClass['parity'], readonly number[]> = { even: [2, 4], odd: [1, 3, 5] }

export function degree(poly: Poly): number {
  return poly.roots.reduce((sum, root) => sum + (root.bounce ? 2 : 1), 0)
}

export function classOf(poly: Poly): EndClass {
  return { sign: poly.sign, parity: degree(poly) % 2 === 0 ? 'even' : 'odd' }
}

export function classKey(cls: EndClass): ClassKey {
  return `${cls.sign === 1 ? 'positive' : 'negative'}-${cls.parity}`
}

export function parseClassKey(key: ClassKey): EndClass {
  const [sign, parity] = key.split('-') as ['positive' | 'negative', EndClass['parity']]
  return { sign: sign === 'positive' ? 1 : -1, parity }
}

export function describeClass(cls: EndClass): string {
  return classKey(cls).replace('-', ' ')
}

/** The right end follows the sign; the left end mirrors it only for odd degree. */
export function endsOf(cls: EndClass): Ends {
  const right: End = cls.sign === 1 ? 'up' : 'down'
  const flipped: End = right === 'up' ? 'down' : 'up'
  return { left: cls.parity === 'even' ? right : flipped, right }
}

export function evaluate(poly: Poly, x: number): number {
  return poly.roots.reduce<number>((y, root) => y * (x - root.x) ** (root.bounce ? 2 : 1), poly.sign)
}

/* Turning points sit between the outer roots, so that span sets the
   scale. Trimmed where it leaves the grid. */
export function curvePoints(poly: Poly): [number, number][] {
  if (poly.roots.length === 0) throw new Error('curvePoints needs at least one root')
  const xs = poly.roots.map((root) => root.x)
  const lo = Math.min(...xs) - 1
  const hi = Math.max(...xs) + 1
  let peak = 0
  for (let i = 0; i <= SAMPLES; i++) peak = Math.max(peak, Math.abs(evaluate(poly, lo + ((hi - lo) * i) / SAMPLES)))
  const scale = PEAK / peak

  const all: [number, number][] = []
  for (let i = 0; i <= SAMPLES; i++) {
    const x = -AXIS + (2 * AXIS * i) / SAMPLES
    all.push([x, evaluate(poly, x) * scale])
  }

  const inside = (p: [number, number]) => Math.abs(p[1]) < AXIS
  const first = all.findIndex(inside)
  const last = all.findLastIndex(inside)
  const points = all.slice(first, last + 1)
  if (first > 0) points.unshift(edgePoint(all[first], all[first - 1]))
  if (last < all.length - 1) points.push(edgePoint(all[last], all[last + 1]))
  return points
}

/** Where the segment from a (inside) to b (outside) meets the top or bottom edge. */
function edgePoint(a: [number, number], b: [number, number]): [number, number] {
  const edge = Math.sign(b[1]) * AXIS
  const t = (edge - a[1]) / (b[1] - a[1])
  return [a[0] + (b[0] - a[0]) * t, edge]
}

/** Empty, then crossing, then bouncing, then empty again. Null when a new root would pass the cap. */
export function toggleRoot(poly: Poly, x: number): Poly | null {
  const existing = poly.roots.find((root) => root.x === x)
  const others = poly.roots.filter((root) => root.x !== x)
  const room = MAX_DEGREE - degree(poly)
  if (!existing) {
    if (room < 1) return null
    return { ...poly, roots: sortRoots([...others, { x, bounce: false }]) }
  }
  if (!existing.bounce && room >= 1) return { ...poly, roots: sortRoots([...others, { x, bounce: true }]) }
  return { ...poly, roots: others }
}

function sortRoots(roots: Poly['roots']): Poly['roots'] {
  return [...roots].sort((a, b) => a.x - b.x)
}

/** A random curve whose class is uniform across the four, degree 1 to 5. */
export function randomPoly(random: () => number = Math.random): Poly {
  const cls = parseClassKey(CLASS_KEYS[Math.floor(random() * CLASS_KEYS.length)])
  const options = DEGREES[cls.parity]
  const deg = options[Math.floor(random() * options.length)]
  const bounces = Math.floor(random() * (Math.floor(deg / 2) + 1))
  const crossings = deg - 2 * bounces
  const range = Array.from({ length: 2 * RANDOM_RANGE + 1 }, (_, i) => i - RANDOM_RANGE)
  const xs = shuffled(range, random).slice(0, bounces + crossings)
  return { sign: cls.sign, roots: sortRoots(xs.map((x, i) => ({ x, bounce: i < bounces }))) }
}

export function randomPrompt(random: () => number = Math.random): GraphPrompt {
  const poly = randomPoly(random)
  return { target: classOf(poly), intercepts: poly.roots.map((root) => root.x) }
}

export function formatNumber(n: number): string {
  return n < 0 ? `−${-n}` : String(n)
}

export function formatList(items: readonly string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

export function promptText(prompt: GraphPrompt): string {
  const xs = formatList(prompt.intercepts.map(formatNumber))
  const noun = prompt.intercepts.length === 1 ? 'an x-intercept' : 'x-intercepts'
  return `Graph a ${describeClass(prompt.target)} polynomial with ${noun} at ${xs}.`
}

/** Everything wrong with a built curve, in plain words. Empty means correct. */
export function gradeGraph(prompt: GraphPrompt, built: Poly): string[] {
  const placed = built.roots.map((root) => root.x)
  const missing = prompt.intercepts.filter((x) => !placed.includes(x))
  const extra = placed.filter((x) => !prompt.intercepts.includes(x))
  const problems: string[] = []
  if (missing.length) problems.push(`Missing ${plural(missing.length, 'intercept')} at ${formatList(missing.map(formatNumber))}.`)
  if (extra.length) problems.push(`No intercept belongs at ${formatList(extra.map(formatNumber))}.`)
  if (built.sign !== prompt.target.sign) {
    problems.push(`The leading coefficient should be ${prompt.target.sign === 1 ? 'positive' : 'negative'}.`)
  }
  const deg = degree(built)
  if (deg % 2 !== (prompt.target.parity === 'even' ? 0 : 1)) {
    problems.push(`Degree ${deg} is ${deg % 2 === 0 ? 'even' : 'odd'}. Turn a crossing into a bounce, or back.`)
  }
  return problems
}

function plural(n: number, word: string): string {
  return n === 1 ? word : `${word}s`
}

const EMPTY_TALLY: Tally = { answered: 0, correct: 0 }

export const EMPTY_END_STATS: EndBehaviorStats = {
  modes: { identify: EMPTY_TALLY, graph: EMPTY_TALLY },
  classes: {
    'positive-even': EMPTY_TALLY,
    'negative-even': EMPTY_TALLY,
    'positive-odd': EMPTY_TALLY,
    'negative-odd': EMPTY_TALLY,
  },
  streak: 0,
  best: 0,
}

function bump(tally: Tally, correct: boolean): Tally {
  return { answered: tally.answered + 1, correct: tally.correct + (correct ? 1 : 0) }
}

export function recordAnswer(stats: EndBehaviorStats, mode: Mode, key: ClassKey, correct: boolean): EndBehaviorStats {
  const streak = correct ? stats.streak + 1 : 0
  return {
    modes: { ...stats.modes, [mode]: bump(stats.modes[mode], correct) },
    classes: { ...stats.classes, [key]: bump(stats.classes[key], correct) },
    streak,
    best: Math.max(stats.best, streak),
  }
}

export function accuracy(tally: Tally): number {
  return tally.answered ? Math.round((tally.correct / tally.answered) * 100) : 0
}

/** Factored form, e.g. f(x) = −(x + 3)(x − 1)². */
export function formatPoly(poly: Poly): string {
  const factors = poly.roots.map((root) => {
    const base = root.x === 0 ? 'x' : `(x ${root.x < 0 ? '+' : '−'} ${Math.abs(root.x)})`
    return root.bounce ? `${base}²` : base
  })
  const body = factors.join('')
  return `f(x) = ${poly.sign === -1 ? `−${factors.length === 1 && poly.roots[0].x === 0 ? body : body}` : body}`
}

/** One correct build: all crossings, with the first bounced when parity needs it. */
export function modelAnswer(prompt: GraphPrompt): Poly {
  const needsBounce = prompt.intercepts.length % 2 !== (prompt.target.parity === 'even' ? 0 : 1)
  return {
    sign: prompt.target.sign,
    roots: prompt.intercepts.map((x, i) => ({ x, bounce: needsBounce && i === 0 })),
  }
}
