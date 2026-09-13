import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/* Every text and background pair the games introduce, measured in both themes
   from the colours tokens.css actually ships. The Workbench palette script
   already proves the base tokens; this covers how the games combine them. */

type Palette = Record<string, string>

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')

function hexVars(block: string): Palette {
  const vars: Palette = {}
  for (const match of block.matchAll(/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{6})/g)) vars[match[1]] = match[2]
  return vars
}

function blocks(selector: RegExp): Palette {
  const vars: Palette = {}
  for (const match of css.matchAll(new RegExp(`(?:^|\\n|\\})\\s*${selector.source}\\s*\\{([^}]*)\\}`, 'g'))) {
    Object.assign(vars, hexVars(match[1]))
  }
  return vars
}

const light = blocks(/:root/)
const dark = { ...light, ...blocks(/:root\[data-theme="dark"\]/) }

type Rgb = [number, number, number]

function rgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** color-mix(in srgb, a p%, b), which is also what a translucent a looks like over b. */
function mix(a: Rgb, b: Rgb, p: number): Rgb {
  return [0, 1, 2].map((i) => Math.round(a[i] * p + b[i] * (1 - p))) as Rgb
}

function luminance([r, g, b]: Rgb): number {
  const channel = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function ratio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

interface Pair {
  name: string
  fg: string
  bg: string
  /** Mix this share of the bg token over surface first, for soft and tinted grounds. */
  over?: number
  min?: number
}

const ACCENTS = ['green', 'violet', 'vermillion', 'cobalt', 'amber', 'graphite', 'magenta']

const PAIRS: Pair[] = [
  // Shell and shared text
  ...['fg', 'fg-2', 'fg-3'].flatMap((fg) => ['bg', 'surface', 'surface-2'].map((bg) => ({ name: `${fg} on ${bg}`, fg, bg }))),
  { name: 'toast', fg: 'bg', bg: 'fg' },
  { name: 'danger toast', fg: 'danger-on', bg: 'danger' },
  ...ACCENTS.map((a) => ({ name: `${a} primary button`, fg: `accent-${a}-on`, bg: `accent-${a}` })),
  ...ACCENTS.map((a) => ({ name: `${a} as text on surface`, fg: `accent-${a}`, bg: 'surface' })),
  // Notes keep fg text on the soft wash; the status colour itself fails there.
  { name: 'ok note', fg: 'fg', bg: 'ok', over: 0.13 },
  { name: 'warn note', fg: 'fg', bg: 'warn', over: 0.13 },
  { name: 'danger note', fg: 'fg', bg: 'danger', over: 0.13 },

  // Wordle tiles and keys
  { name: 'correct tile', fg: 'ok-on', bg: 'ok' },
  { name: 'present tile', fg: 'warn-on', bg: 'warn' },
  { name: 'absent tile', fg: 'bg', bg: 'fg-3' },
  { name: 'high contrast correct', fg: 'accent-vermillion-on', bg: 'accent-vermillion' },
  { name: 'high contrast present', fg: 'accent-cobalt-on', bg: 'accent-cobalt' },

  // Connections cards and solved groups
  { name: 'selected card', fg: 'bg', bg: 'fg' },
  { name: 'card', fg: 'fg', bg: 'surface-2' },
  ...['amber', 'green', 'cobalt', 'violet'].map((a) => ({ name: `${a} group`, fg: `accent-${a}-on`, bg: `accent-${a}` })),

  // Blackjack cards
  { name: 'red suit', fg: 'danger', bg: 'surface' },

  // Crossword cells, with cobalt as the page accent
  { name: 'cursor cell', fg: 'accent-cobalt-on', bg: 'accent-cobalt' },
  { name: 'word highlight letter', fg: 'fg', bg: 'accent-cobalt', over: 0.16 },
  { name: 'word highlight number', fg: 'fg-2', bg: 'accent-cobalt', over: 0.16 },
  // Letters are at least 1.35rem semibold, so large-text 3:1 applies.
  { name: 'revealed letter in word', fg: 'accent-cobalt', bg: 'accent-cobalt', over: 0.16, min: 3 },
  { name: 'wrong letter in word', fg: 'danger', bg: 'accent-cobalt', over: 0.16, min: 3 },
]

describe.each([
  ['light', light],
  ['dark', dark],
] as const)('%s theme', (_, palette) => {
  it('parsed the tokens', () => {
    expect(Object.keys(palette).length).toBeGreaterThan(30)
  })

  it.each(PAIRS.map((pair) => [pair.name, pair] as const))('%s meets AA', (_name, pair) => {
    const fg = palette[pair.fg]
    const bg = palette[pair.bg]
    expect(fg, pair.fg).toBeDefined()
    expect(bg, pair.bg).toBeDefined()
    const ground = pair.over ? mix(rgb(bg), rgb(palette.surface), pair.over) : rgb(bg)
    expect(ratio(rgb(fg), ground)).toBeGreaterThanOrEqual(pair.min ?? 4.5)
  })
})
