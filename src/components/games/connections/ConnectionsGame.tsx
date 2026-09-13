import { useCallback, useMemo, useRef, useState } from 'react'
import { ChartColumn, LayoutList } from 'lucide-react'
import { PUZZLES } from '../../../data/connections'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { prefersReducedMotion } from '../../../hooks/useReducedMotion'
import { useToast } from '../../../hooks/useToast'
import type { ConnectionsAction } from '../../../utils/connections'
import type { ConnectionsPuzzle, ConnectionsState, ConnectionsStats } from '../../../types/connections'
import {
  CONNECTIONS_KEYS,
  EMPTY_CONNECTIONS_STATS,
  GROUP_SIZE,
  MAX_CUSTOM_PUZZLES,
  allWords,
  createState,
  normalizePuzzle,
  recordConnections,
  reduceConnections,
} from '../../../utils/connections'
import { dailyIndex } from '../../../utils/daily'
import { randomItem, shuffled } from '../../../utils/rng'
import { getStored, removeStored } from '../../../utils/storage'
import { Button } from '../../common/Button'
import { Note } from '../../common/Note'
import { PageHeader } from '../../common/PageHeader'
import { ConnectionsStatsModal } from './ConnectionsStatsModal'
import { Controls } from './Controls'
import { Grid } from './Grid'
import { GuessesRemaining } from './GuessesRemaining'
import { PuzzleLoader } from './PuzzleLoader'
import { PuzzlePicker } from './PuzzlePicker'

const NO_CUSTOM: ConnectionsPuzzle[] = []
const BUILT_IN_IDS: ReadonlySet<string> = new Set(PUZZLES.map((puzzle) => puzzle.id))

export function ConnectionsGame() {
  const toast = useToast()
  const [custom, setCustom] = useLocalStorage<ConnectionsPuzzle[]>(CONNECTIONS_KEYS.custom, NO_CUSTOM)
  const [currentId, setCurrentId] = useLocalStorage<string | null>(CONNECTIONS_KEYS.current, null)
  const [stats, setStats] = useLocalStorage<ConnectionsStats>(CONNECTIONS_KEYS.stats, EMPTY_CONNECTIONS_STATS)
  const [dailyId] = useState(() => PUZZLES[dailyIndex(PUZZLES.length)].id)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [loaderOpen, setLoaderOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)

  const puzzles = useMemo(() => [...PUZZLES, ...custom].map(normalizePuzzle), [custom])
  const customIds = useMemo(() => new Set(custom.map((puzzle) => puzzle.id)), [custom])
  const puzzle = puzzles.find((p) => p.id === currentId) ?? puzzles.find((p) => p.id === dailyId) ?? puzzles[0]

  function pick(id: string) {
    setCurrentId(id)
    setPickerOpen(false)
    setStatsOpen(false)
  }

  function pickRandom() {
    pick(randomItem(puzzles.filter((p) => p.id !== puzzle.id)).id)
  }

  // Next puzzle not yet finished, in list order after this one, else a random one.
  function pickNext() {
    const start = puzzles.findIndex((p) => p.id === puzzle.id)
    const rotated = [...puzzles.slice(start + 1), ...puzzles.slice(0, start)]
    const unfinished = rotated.find((p) => {
      const saved = getStored<ConnectionsState | null>(CONNECTIONS_KEYS.progress(p.id), null)
      return !saved || saved.status === 'playing'
    })
    if (unfinished) pick(unfinished.id)
    else pickRandom()
  }

  function addCustom(added: ConnectionsPuzzle) {
    setCustom((prev) => [...prev.filter((p) => p.id !== added.id), added].slice(-MAX_CUSTOM_PUZZLES))
    removeStored(CONNECTIONS_KEYS.progress(added.id))
    pick(added.id)
    toast.show(`Added “${added.title}”`)
  }

  function removeCustom(id: string) {
    setCustom((prev) => prev.filter((p) => p.id !== id))
    removeStored(CONNECTIONS_KEYS.progress(id))
    if (id === currentId) setCurrentId(null)
  }

  return (
    <>
      <PageHeader
        title="Connections"
        note={
          <>
            <strong>{puzzle.title}</strong>
            {puzzle.id === dailyId ? ', today’s puzzle. ' : '. '}
            Find four groups of four that share something.
          </>
        }
      >
        <Button onClick={() => setPickerOpen(true)}>
          <LayoutList className="size-4" aria-hidden />
          Puzzles
        </Button>
        <Button variant="quiet" size="icon" onClick={() => setStatsOpen(true)} aria-label="Statistics" title="Statistics">
          <ChartColumn className="size-4" aria-hidden />
        </Button>
      </PageHeader>

      <ConnectionsBoard
        key={puzzle.id}
        puzzle={puzzle}
        onResult={(won, mistakes) => setStats((prev) => recordConnections(prev, won, mistakes))}
        onShowStats={() => setStatsOpen(true)}
        onNext={pickNext}
      />

      <PuzzlePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        puzzles={puzzles}
        customIds={customIds}
        dailyId={dailyId}
        currentId={puzzle.id}
        onPick={pick}
        onRandom={pickRandom}
        onLoadCustom={() => {
          setPickerOpen(false)
          setLoaderOpen(true)
        }}
        onRemoveCustom={removeCustom}
      />
      <PuzzleLoader open={loaderOpen} onClose={() => setLoaderOpen(false)} onAdd={addCustom} reservedIds={BUILT_IN_IDS} />
      <ConnectionsStatsModal open={statsOpen} onClose={() => setStatsOpen(false)} stats={stats} />
    </>
  )
}

interface BoardProps {
  puzzle: ConnectionsPuzzle
  onResult: (won: boolean, mistakes: number) => void
  onShowStats: () => void
  onNext: () => void
}

const LIFT: Keyframe[] = [{ transform: 'translateY(0)' }, { transform: 'translateY(-8px)' }, { transform: 'translateY(0)' }]
const SHAKE: Keyframe[] = [
  { transform: 'translateX(0)' },
  { transform: 'translateX(-5px)' },
  { transform: 'translateX(5px)' },
  { transform: 'translateX(-3px)' },
  { transform: 'translateX(0)' },
]
const LIFT_STEP_MS = 90
const LIFT_MS = 260

/* One puzzle's board. Keyed by puzzle id so switching puzzles starts from that
   puzzle's own saved progress. */
function ConnectionsBoard({ puzzle, onResult, onShowStats, onNext }: BoardProps) {
  const toast = useToast()
  const [saved, setSaved] = useLocalStorage<ConnectionsState | null>(CONNECTIONS_KEYS.progress(puzzle.id), null)
  const [fresh] = useState(() => createState(puzzle, shuffled(allWords(puzzle))))
  const [busy, setBusy] = useState(false)
  const cards = useRef(new Map<string, HTMLButtonElement>())
  const state = saved?.puzzleId === puzzle.id ? saved : fresh

  const cardRef = useCallback((word: string, element: HTMLButtonElement | null) => {
    if (element) cards.current.set(word, element)
    else cards.current.delete(word)
  }, [])

  function apply(action: ConnectionsAction): ConnectionsState {
    const next = reduceConnections(state, action, puzzle)
    if (next === state) return state
    setSaved(next)
    if (state.status === 'playing' && next.status !== 'playing') onResult(next.status === 'won', next.mistakes)
    return next
  }

  async function submit() {
    if (busy || state.selected.length !== GROUP_SIZE) return
    const selected = state.selected
    const reduced = prefersReducedMotion()

    if (!reduced) {
      setBusy(true)
      selected.forEach((word, i) =>
        cards.current.get(word)?.animate(LIFT, { duration: LIFT_MS, delay: i * LIFT_STEP_MS, easing: 'ease-in-out' }),
      )
      await new Promise((resolve) => window.setTimeout(resolve, LIFT_STEP_MS * (GROUP_SIZE - 1) + LIFT_MS))
      setBusy(false)
    }

    const next = apply({ type: 'submit' })
    const kind = next.outcome?.kind
    if (kind === 'duplicate') toast.show('Already guessed')
    if (kind === 'one-away' && next.status === 'playing') toast.show('One away...')
    if ((kind === 'wrong' || kind === 'one-away') && next.status === 'playing' && !reduced) {
      selected.forEach((word) => cards.current.get(word)?.animate(SHAKE, { duration: 340, easing: 'ease-in-out' }))
    }
    if (next.status === 'won') toast.show(next.mistakes === 0 ? 'Perfect' : 'Solved', { tone: 'ok' })
    if (next.status === 'lost') toast.show('Out of mistakes. Here are the groups.', { duration: 2600 })
    if (next.status !== 'playing') window.setTimeout(onShowStats, reduced ? 300 : 1500)
  }

  return (
    <div className="mx-auto flex w-full max-w-[40rem] flex-col gap-s4">
      <Grid
        puzzle={puzzle}
        state={state}
        busy={busy}
        cardRef={cardRef}
        onToggle={(word) => apply({ type: 'toggle', word })}
      />

      {state.status === 'playing' ? (
        <>
          <GuessesRemaining mistakes={state.mistakes} />
          <Controls
            busy={busy}
            canDeselect={state.selected.length > 0}
            canSubmit={state.selected.length === GROUP_SIZE}
            onShuffle={() => apply({ type: 'shuffle', order: shuffled(state.order) })}
            onDeselect={() => apply({ type: 'deselect' })}
            onSubmit={submit}
          />
        </>
      ) : (
        <Note tone={state.status === 'won' ? 'ok' : 'neutral'}>
          <span className="font-semibold">
            {state.status === 'won'
              ? state.mistakes === 0
                ? 'Perfect. No mistakes.'
                : `Solved with ${state.mistakes} ${state.mistakes === 1 ? 'mistake' : 'mistakes'}.`
              : 'Out of mistakes.'}
          </span>
          <span className="ml-auto flex gap-s2">
            <Button size="sm" onClick={onShowStats}>
              Stats
            </Button>
            <Button size="sm" variant="primary" onClick={onNext}>
              Next puzzle
            </Button>
          </span>
        </Note>
      )}
    </div>
  )
}
