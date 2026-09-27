import { describe, expect, it } from 'vitest'
import type { GraphPrompt, Poly } from '../types/endBehavior'
import {
  AXIS,
  EMPTY_END_STATS,
  MAX_DEGREE,
  classKey,
  classOf,
  curvePoints,
  degree,
  endsOf,
  evaluate,
  formatPoly,
  gradeGraph,
  modelAnswer,
  promptText,
  randomPoly,
  randomPrompt,
  recordAnswer,
  toggleRoot,
} from './endBehavior'
import { mulberry32 } from './rng'

const cross = (x: number) => ({ x, bounce: false })
const bounce = (x: number) => ({ x, bounce: true })

// -(x - 1)(x - 2)(x - 3)
const negCubic: Poly = { sign: -1, roots: [cross(1), cross(2), cross(3)] }

describe('classification', () => {
  it('counts a bounce twice', () => {
    expect(degree({ sign: 1, roots: [cross(0), bounce(2)] })).toBe(3)
  })

  it('reads sign and parity', () => {
    expect(classKey(classOf(negCubic))).toBe('negative-odd')
    expect(classKey(classOf({ sign: 1, roots: [bounce(0)] }))).toBe('positive-even')
  })

  it.each([
    [1, 'even', 'up', 'up'],
    [-1, 'even', 'down', 'down'],
    [1, 'odd', 'down', 'up'],
    [-1, 'odd', 'up', 'down'],
  ] as const)('sign %i %s runs %s on the left, %s on the right', (sign, parity, left, right) => {
    expect(endsOf({ sign, parity })).toEqual({ left, right })
  })

  it('evaluates the factored form', () => {
    expect(evaluate(negCubic, 0)).toBe(6)
    expect(Math.abs(evaluate(negCubic, 2))).toBe(0)
    expect(evaluate({ sign: 1, roots: [bounce(1)] }, 3)).toBe(4)
  })
})

describe('formatPoly', () => {
  it('writes the factored form', () => {
    expect(formatPoly({ sign: -1, roots: [cross(-3), bounce(1)] })).toBe('f(x) = \u2212(x + 3)(x \u2212 1)\u00b2')
    expect(formatPoly({ sign: 1, roots: [bounce(0), cross(2)] })).toBe('f(x) = x\u00b2(x \u2212 2)')
  })
})

describe('toggleRoot', () => {
  const empty: Poly = { sign: 1, roots: [] }

  it('cycles empty, cross, bounce, empty', () => {
    const one = toggleRoot(empty, 2)!
    const two = toggleRoot(one, 2)!
    const three = toggleRoot(two, 2)!
    expect(one.roots).toEqual([cross(2)])
    expect(two.roots).toEqual([bounce(2)])
    expect(three.roots).toEqual([])
  })

  it('keeps roots sorted', () => {
    expect(toggleRoot({ sign: 1, roots: [cross(3)] }, -1)!.roots).toEqual([cross(-1), cross(3)])
  })

  it('refuses a new root past the cap and skips bounce at the cap', () => {
    const full: Poly = { sign: 1, roots: [cross(-2), cross(-1), cross(0), cross(1), cross(2)] }
    expect(degree(full)).toBe(MAX_DEGREE)
    expect(toggleRoot(full, 4)).toBeNull()
    expect(toggleRoot(full, 0)!.roots).toHaveLength(4)
  })
})

describe('gradeGraph', () => {
  const prompt: GraphPrompt = { target: { sign: -1, parity: 'odd' }, intercepts: [1, 3] }

  it('accepts any bounce choice that fixes the parity', () => {
    expect(gradeGraph(prompt, { sign: -1, roots: [bounce(1), cross(3)] })).toEqual([])
    expect(gradeGraph(prompt, { sign: -1, roots: [cross(1), bounce(3)] })).toEqual([])
  })

  it('names every problem', () => {
    const problems = gradeGraph(prompt, { sign: 1, roots: [cross(1), cross(-2)] })
    expect(problems).toEqual([
      'Missing intercept at 3.',
      'No intercept belongs at −2.',
      'The leading coefficient should be negative.',
      'Degree 2 is even. Turn a crossing into a bounce, or back.',
    ])
  })

  it('model answers always pass', () => {
    const random = mulberry32(3)
    for (let i = 0; i < 500; i++) {
      const next = randomPrompt(random)
      expect(gradeGraph(next, modelAnswer(next))).toEqual([])
    }
  })

  it('writes the prompt', () => {
    expect(promptText({ target: { sign: -1, parity: 'odd' }, intercepts: [-3, 2, 1] })).toBe(
      'Graph a negative odd polynomial with x-intercepts at −3, 2 and 1.',
    )
    expect(promptText({ target: { sign: 1, parity: 'even' }, intercepts: [0] })).toBe(
      'Graph a positive even polynomial with an x-intercept at 0.',
    )
  })
})

describe('randomPoly', () => {
  it('stays in range with distinct roots and a matching class', () => {
    const random = mulberry32(7)
    const seen = new Set<string>()
    for (let i = 0; i < 2000; i++) {
      const poly = randomPoly(random)
      const xs = poly.roots.map((root) => root.x)
      const deg = degree(poly)
      expect(deg).toBeGreaterThanOrEqual(1)
      expect(deg).toBeLessThanOrEqual(MAX_DEGREE)
      expect(new Set(xs).size).toBe(xs.length)
      expect(xs.every((x) => Math.abs(x) <= 4)).toBe(true)
      seen.add(`${classKey(classOf(poly))}:${deg}`)
    }
    expect(seen.size).toBe(10)
  })
})

describe('curvePoints', () => {
  it('stays on the grid and heads the right way at each end', () => {
    const random = mulberry32(11)
    for (let i = 0; i < 300; i++) {
      const poly = randomPoly(random)
      const points = curvePoints(poly)
      const ends = endsOf(classOf(poly))
      expect(points.every(([x, y]) => Math.abs(x) <= AXIS + 1e-9 && Math.abs(y) <= AXIS + 1e-9)).toBe(true)
      const [a, b] = [points[0], points[1]]
      const [y, z] = [points[points.length - 2], points[points.length - 1]]
      expect(a[1] > b[1] ? 'up' : 'down').toBe(ends.left)
      expect(z[1] > y[1] ? 'up' : 'down').toBe(ends.right)
    }
  })

  it('throws without roots', () => {
    expect(() => curvePoints({ sign: 1, roots: [] })).toThrow()
  })
})

describe('recordAnswer', () => {
  it('tracks streaks and tallies', () => {
    let stats = recordAnswer(EMPTY_END_STATS, 'identify', 'negative-odd', true)
    stats = recordAnswer(stats, 'graph', 'negative-odd', true)
    stats = recordAnswer(stats, 'graph', 'positive-even', false)
    expect(stats.streak).toBe(0)
    expect(stats.best).toBe(2)
    expect(stats.modes.graph).toEqual({ answered: 2, correct: 1 })
    expect(stats.classes['negative-odd']).toEqual({ answered: 2, correct: 2 })
  })
})
