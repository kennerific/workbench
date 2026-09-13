import type {
  ConnectionsPuzzle,
  ConnectionsState,
  ConnectionsStats,
  GroupLevel,
  SubmitOutcome,
} from '../types/connections'

export const GROUP_SIZE = 4
export const GROUP_COUNT = 4
export const MAX_MISTAKES = 4
export const MAX_CUSTOM_PUZZLES = 10

export const CONNECTIONS_KEYS = {
  stats: 'connections:stats',
  custom: 'connections:custom',
  current: 'connections:current',
  progress: (id: string) => `connections:progress:${id}`,
} as const

export function normalizeWord(word: string): string {
  return word.trim().toUpperCase()
}

/* Every reason a value is not a playable puzzle, phrased for someone pasting
   JSON by hand. An empty list means the puzzle is valid. */
export function puzzleProblems(value: unknown): string[] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return ['The puzzle must be a JSON object.']
  const puzzle = value as Record<string, unknown>
  const problems: string[] = []

  if (typeof puzzle.id !== 'string' || !puzzle.id.trim()) problems.push('Add an "id" string.')
  if (typeof puzzle.title !== 'string' || !puzzle.title.trim()) problems.push('Add a "title" string.')
  if (!Array.isArray(puzzle.groups) || puzzle.groups.length !== GROUP_COUNT) {
    problems.push(`"groups" must be a list of exactly ${GROUP_COUNT} groups.`)
    return problems
  }

  const levels = new Set<number>()
  const seen = new Set<string>()
  puzzle.groups.forEach((raw, i) => {
    const n = i + 1
    if (typeof raw !== 'object' || raw === null) {
      problems.push(`Group ${n} must be an object.`)
      return
    }
    const group = raw as Record<string, unknown>
    if (typeof group.label !== 'string' || !group.label.trim()) problems.push(`Group ${n} needs a "label".`)
    if (typeof group.level !== 'number' || ![0, 1, 2, 3].includes(group.level)) {
      problems.push(`Group ${n} needs a "level" of 0, 1, 2 or 3.`)
    } else if (levels.has(group.level)) {
      problems.push(`Level ${group.level} is used by more than one group.`)
    } else {
      levels.add(group.level)
    }
    if (
      !Array.isArray(group.words) ||
      group.words.length !== GROUP_SIZE ||
      group.words.some((word) => typeof word !== 'string' || !word.trim())
    ) {
      problems.push(`Group ${n} needs exactly ${GROUP_SIZE} words.`)
      return
    }
    for (const word of group.words as string[]) {
      const key = normalizeWord(word)
      if (seen.has(key)) problems.push(`"${key}" appears more than once.`)
      seen.add(key)
    }
  })

  return problems
}

export function isPuzzle(value: unknown): value is ConnectionsPuzzle {
  return puzzleProblems(value).length === 0
}

/** Upper-case every word and order groups from easiest to trickiest. */
export function normalizePuzzle(puzzle: ConnectionsPuzzle): ConnectionsPuzzle {
  return {
    ...puzzle,
    id: puzzle.id.trim(),
    title: puzzle.title.trim(),
    groups: [...puzzle.groups]
      .sort((a, b) => a.level - b.level)
      .map((group) => ({ label: group.label.trim(), level: group.level as GroupLevel, words: group.words.map(normalizeWord) })),
  }
}

export function allWords(puzzle: ConnectionsPuzzle): string[] {
  return puzzle.groups.flatMap((group) => group.words)
}

function selectionKey(words: readonly string[]): string {
  return [...words].sort().join('|')
}

export function evaluateSelection(
  puzzle: ConnectionsPuzzle,
  selection: readonly string[],
  previous: readonly (readonly string[])[],
): SubmitOutcome {
  if (selection.length !== GROUP_SIZE) return { kind: 'incomplete' }
  const key = selectionKey(selection)
  if (previous.some((guess) => selectionKey(guess) === key)) return { kind: 'duplicate' }

  let best = 0
  for (let i = 0; i < puzzle.groups.length; i++) {
    const hits = puzzle.groups[i].words.filter((word) => selection.includes(word)).length
    if (hits === GROUP_SIZE) return { kind: 'correct', group: i }
    best = Math.max(best, hits)
  }
  return best === GROUP_SIZE - 1 ? { kind: 'one-away' } : { kind: 'wrong' }
}

export function createState(puzzle: ConnectionsPuzzle, order: string[]): ConnectionsState {
  return {
    puzzleId: puzzle.id,
    order,
    selected: [],
    solved: [],
    revealed: [],
    guesses: [],
    mistakes: 0,
    status: 'playing',
    outcome: null,
  }
}

export type ConnectionsAction =
  | { type: 'toggle'; word: string }
  | { type: 'deselect' }
  /** The caller shuffles, so the reducer stays pure. */
  | { type: 'shuffle'; order: string[] }
  | { type: 'submit' }

export function reduceConnections(
  state: ConnectionsState,
  action: ConnectionsAction,
  puzzle: ConnectionsPuzzle,
): ConnectionsState {
  if (state.status !== 'playing') return state

  switch (action.type) {
    case 'toggle': {
      if (!state.order.includes(action.word)) return state
      if (state.selected.includes(action.word)) {
        return { ...state, selected: state.selected.filter((word) => word !== action.word), outcome: null }
      }
      if (state.selected.length >= GROUP_SIZE) return state
      return { ...state, selected: [...state.selected, action.word], outcome: null }
    }

    case 'deselect':
      return state.selected.length ? { ...state, selected: [], outcome: null } : state

    case 'shuffle': {
      const same = action.order.length === state.order.length && action.order.every((word) => state.order.includes(word))
      return same ? { ...state, order: action.order } : state
    }

    case 'submit': {
      const outcome = evaluateSelection(puzzle, state.selected, state.guesses)
      if (outcome.kind === 'incomplete') return state
      // Repeating a guess costs nothing; the new outcome object still lets the UI react.
      if (outcome.kind === 'duplicate') return { ...state, outcome }

      const guesses = [...state.guesses, state.selected]

      if (outcome.kind === 'correct') {
        const words = puzzle.groups[outcome.group].words
        const solved = [...state.solved, outcome.group]
        return {
          ...state,
          guesses,
          solved,
          order: state.order.filter((word) => !words.includes(word)),
          selected: [],
          outcome,
          status: solved.length === puzzle.groups.length ? 'won' : 'playing',
        }
      }

      const mistakes = state.mistakes + 1
      if (mistakes >= MAX_MISTAKES) {
        const revealed = puzzle.groups
          .map((_, i) => i)
          .filter((i) => !state.solved.includes(i))
          .sort((a, b) => puzzle.groups[a].level - puzzle.groups[b].level)
        return { ...state, guesses, mistakes, selected: [], order: [], revealed, outcome, status: 'lost' }
      }
      // The selection stays, so a near miss can be adjusted by one word.
      return { ...state, guesses, mistakes, outcome }
    }
  }
}

export const EMPTY_CONNECTIONS_STATS: ConnectionsStats = {
  played: 0,
  solved: 0,
  perfect: 0,
  currentStreak: 0,
  bestStreak: 0,
}

export function recordConnections(stats: ConnectionsStats, won: boolean, mistakes: number): ConnectionsStats {
  const currentStreak = won ? stats.currentStreak + 1 : 0
  return {
    played: stats.played + 1,
    solved: stats.solved + (won ? 1 : 0),
    perfect: stats.perfect + (won && mistakes === 0 ? 1 : 0),
    currentStreak,
    bestStreak: Math.max(stats.bestStreak, currentStreak),
  }
}
