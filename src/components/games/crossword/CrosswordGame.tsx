import { useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { CROSSWORDS } from '../../../data/crosswords'
import { useKeyboard } from '../../../hooks/useKeyboard'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { useTicker } from '../../../hooks/useTimer'
import { useToast } from '../../../hooks/useToast'
import type { CrosswordProgress, CrosswordPuzzle, CrosswordStats, Cursor, Direction, Entry } from '../../../types/crossword'
import {
  CROSSWORD_KEYS,
  EMPTY_CROSSWORD_STATS,
  SIZE,
  afterType,
  arrowMove,
  backspace,
  clickCell,
  deriveEntries,
  entryFor,
  firstEmpty,
  freshProgress,
  isBlock,
  isSolved,
  jumpEntry,
  numberCells,
  openCells,
  recordSolve,
  solutionAt,
  startCursor,
  toggleDirection,
  wrongCells,
  type ArrowKey,
} from '../../../utils/crossword'
import { dailyIndex } from '../../../utils/daily'
import { formatClock } from '../../../utils/time'
import { Button } from '../../common/Button'
import { Modal } from '../../common/Modal'
import { Note } from '../../common/Note'
import { PageHeader } from '../../common/PageHeader'
import { Segmented } from '../../common/Segmented'
import { ClueList } from './ClueList'
import { CluePanel } from './CluePanel'
import { Grid } from './Grid'
import { Toolbar } from './Toolbar'

const FRESH = freshProgress()
// Previous and next clue ignore blanks, so they step to the neighbouring clue.
const ALL_FILLED = Array.from({ length: SIZE * SIZE }, () => 'X')
const LIST_TABS = [
  { value: 'across', label: 'Across' },
  { value: 'down', label: 'Down' },
] as const

export function CrosswordGame() {
  const [currentId, setCurrentId] = useLocalStorage<string | null>(CROSSWORD_KEYS.current, null)
  const [stats, setStats] = useLocalStorage<CrosswordStats>(CROSSWORD_KEYS.stats, EMPTY_CROSSWORD_STATS)
  const [dailyId] = useState(() => CROSSWORDS[dailyIndex(CROSSWORDS.length)].id)

  const puzzle = CROSSWORDS.find((p) => p.id === currentId) ?? CROSSWORDS.find((p) => p.id === dailyId) ?? CROSSWORDS[0]
  const position = CROSSWORDS.indexOf(puzzle)

  return (
    <>
      <PageHeader
        title="Mini Crossword"
        note={
          <>
            <strong>{puzzle.title}</strong>
            {puzzle.id === dailyId ? ', today’s puzzle. ' : '. '}
            Click a square or a clue, then type.
          </>
        }
      >
        <label className="flex items-center gap-s2 text-base text-fg-2">
          Puzzle
          <select
            value={puzzle.id}
            onChange={(event) => setCurrentId(event.target.value)}
            className="border border-line-strong bg-bg px-s2 py-s2 text-base text-fg focus-visible:border-accent"
          >
            {CROSSWORDS.map((p, i) => (
              <option key={p.id} value={p.id}>
                {i + 1}. {p.title}
                {p.id === dailyId ? ' (today)' : ''}
              </option>
            ))}
          </select>
        </label>
      </PageHeader>

      <CrosswordBoard
        key={puzzle.id}
        puzzle={puzzle}
        best={stats.best[puzzle.id]}
        onSolved={(seconds, helped) => setStats((prev) => recordSolve(prev, puzzle.id, seconds, helped))}
        onNext={() => setCurrentId(CROSSWORDS[(position + 1) % CROSSWORDS.length].id)}
      />
    </>
  )
}

interface BoardProps {
  puzzle: CrosswordPuzzle
  best: number | undefined
  onSolved: (seconds: number, helped: boolean) => void
  onNext: () => void
}

function CrosswordBoard({ puzzle, best, onSolved, onNext }: BoardProps) {
  const toast = useToast()
  const entries = useMemo(() => deriveEntries(puzzle), [puzzle])
  const numbers = useMemo(() => numberCells(puzzle), [puzzle])
  const [progress, setProgress] = useLocalStorage<CrosswordProgress>(CROSSWORD_KEYS.progress(puzzle.id), FRESH)
  const [cursor, setCursor] = useState<Cursor>(() => startCursor(entries))
  const [listTab, setListTab] = useState<Direction | null>(null)
  const [clearOpen, setClearOpen] = useState(false)
  const [solvedOpen, setSolvedOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const active = entryFor(entries, cursor.index, cursor.direction) ?? entries[0]
  const crossing = entryFor(entries, cursor.index, cursor.direction === 'across' ? 'down' : 'across')
  const across = entries.filter((e) => e.direction === 'across')
  const down = entries.filter((e) => e.direction === 'down')

  useTicker(() => setProgress((prev) => (prev.solved ? prev : { ...prev, seconds: prev.seconds + 1 })), !progress.solved)

  const focusGrid = () => inputRef.current?.focus({ preventScroll: true })

  /* Every change to the letters goes through here: wrong marks drop from cells
     that changed, and the first moment the grid matches the solution records
     the solve with the time so far. */
  function commit(letters: string[], next: Cursor, changes: Partial<Pick<CrosswordProgress, 'revealed' | 'wrong' | 'helped'>> = {}) {
    const helped = changes.helped ?? progress.helped
    const revealed = changes.revealed ?? progress.revealed
    const wrong = changes.wrong ?? progress.wrong.filter((i) => letters[i] === progress.letters[i])
    const solved = isSolved(puzzle, letters)
    setProgress((prev) => ({ ...prev, letters, revealed, wrong, helped, solved: prev.solved || solved }))
    setCursor(next)
    if (solved && !progress.solved) {
      onSolved(progress.seconds, helped)
      window.setTimeout(() => setSolvedOpen(true), 500)
    }
  }

  function typeLetter(letter: string) {
    if (progress.solved) return
    const letters = [...progress.letters]
    if (!progress.revealed.includes(cursor.index)) letters[cursor.index] = letter
    commit(letters, afterType(entries, cursor, letters))
  }

  function erase() {
    if (progress.solved) return
    const result = backspace(entries, cursor, progress.letters)
    // Revealed squares are locked in.
    const letters = result.letters.map((letter, i) => (progress.revealed.includes(i) ? progress.letters[i] : letter))
    commit(letters, result.cursor)
  }

  function handleKey(key: string, shift: boolean): boolean {
    if (/^[a-z]$/i.test(key)) typeLetter(key.toUpperCase())
    else if (key === 'Backspace' || key === 'Delete') erase()
    else if (key.startsWith('Arrow')) setCursor(arrowMove(puzzle, entries, cursor, key as ArrowKey))
    else if (key === 'Tab' || key === 'Enter') setCursor(jumpEntry(entries, cursor, progress.letters, shift ? -1 : 1))
    else if (key === ' ') setCursor(toggleDirection(entries, cursor))
    else return false
    return true
  }

  // Keys pressed while focus is elsewhere on the page. Tab keeps its normal job there.
  useKeyboard((key, event) => {
    if (key === 'Tab') return
    if (handleKey(key, event.shiftKey)) {
      event.preventDefault()
      focusGrid()
    }
  })

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    if (handleKey(event.key, event.shiftKey)) event.preventDefault()
  }

  // Phone keyboards often send no usable key code, only text.
  function onInput(event: FormEvent<HTMLInputElement>) {
    const value = event.currentTarget.value
    event.currentTarget.value = ''
    const letter = value.slice(-1)
    if (/^[a-z]$/i.test(letter)) typeLetter(letter.toUpperCase())
  }

  function selectCell(index: number) {
    if (isBlock(puzzle, index)) return
    setCursor(clickCell(entries, cursor, index))
    focusGrid()
  }

  function pickEntry(entry: Entry) {
    setCursor({ index: firstEmpty(entry, progress.letters), direction: entry.direction })
    setListTab(null)
    focusGrid()
  }

  function checkGrid() {
    const wrong = wrongCells(puzzle, progress.letters)
    const filled = openCells(puzzle).filter((i) => progress.letters[i]).length
    setProgress((prev) => ({ ...prev, wrong, helped: true }))
    if (wrong.length) toast.show(`${wrong.length} ${wrong.length === 1 ? 'square is' : 'squares are'} wrong`)
    else toast.show(filled ? 'Everything filled in so far is right' : 'Nothing to check yet')
  }

  function reveal(cells: number[]) {
    if (progress.solved) return
    const letters = [...progress.letters]
    for (const i of cells) letters[i] = solutionAt(puzzle, i)
    commit(letters, cursor, {
      revealed: [...new Set([...progress.revealed, ...cells])],
      wrong: progress.wrong.filter((i) => !cells.includes(i)),
      helped: true,
    })
  }

  function clearGrid() {
    const letters = progress.letters.map((letter, i) => (progress.revealed.includes(i) ? letter : ''))
    commit(letters, startCursor(entries), { wrong: [] })
    setClearOpen(false)
  }

  const shownList = listTab ?? cursor.direction

  return (
    <div className="grid gap-s5 lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)] lg:items-start">
      <div className="mx-auto flex w-full max-w-[27rem] flex-col gap-s3">
        <Toolbar
          seconds={progress.seconds}
          solved={progress.solved}
          onCheck={checkGrid}
          onRevealCell={() => reveal([cursor.index])}
          onRevealWord={() => reveal(active.cells)}
          onClear={() => setClearOpen(true)}
        />

        {progress.solved && (
          <Note tone="ok">
            <span className="font-semibold">
              Solved in {formatClock(progress.seconds)}
              {progress.helped ? ' with help' : ''}.
            </span>
            <Button size="sm" variant="primary" className="ml-auto" onClick={onNext}>
              Next puzzle
            </Button>
          </Note>
        )}

        <CluePanel
          entry={active}
          onPrev={() => setCursor(jumpEntry(entries, cursor, ALL_FILLED, -1))}
          onNext={() => setCursor(jumpEntry(entries, cursor, ALL_FILLED, 1))}
        />

        <div className="relative focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
          <input
            ref={inputRef}
            aria-label={`${active.number} ${active.direction}: ${active.clue}. ${active.cells.length} letters.`}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            enterKeyHint="next"
            onKeyDown={onInputKeyDown}
            onInput={onInput}
            className="pointer-events-none absolute inset-0 size-full text-[16px] opacity-0"
          />
          <Grid puzzle={puzzle} numbers={numbers} progress={progress} cursor={cursor} active={active} onSelect={selectCell} />
        </div>
      </div>

      <div className="hidden gap-s5 sm:grid-cols-2 lg:grid">
        <ClueList title="Across" entries={across} active={active} crossing={crossing} letters={progress.letters} onPick={pickEntry} />
        <ClueList title="Down" entries={down} active={active} crossing={crossing} letters={progress.letters} onPick={pickEntry} />
      </div>

      <div className="mx-auto flex w-full max-w-[27rem] flex-col gap-s3 lg:hidden">
        <Segmented label="Clue list" options={LIST_TABS} value={shownList} onChange={setListTab} />
        <ClueList
          title={shownList === 'across' ? 'Across' : 'Down'}
          entries={shownList === 'across' ? across : down}
          active={active}
          crossing={crossing}
          letters={progress.letters}
          onPick={pickEntry}
        />
      </div>

      <Modal
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        title="Clear the grid?"
        footer={
          <>
            <Button variant="danger" onClick={clearGrid}>
              Clear grid
            </Button>
            <Button onClick={() => setClearOpen(false)}>Keep my letters</Button>
          </>
        }
      >
        <p className="text-base text-fg-2">Every letter you typed is removed. Revealed squares stay, and the clock keeps its time.</p>
      </Modal>

      <Modal
        open={solvedOpen}
        onClose={() => setSolvedOpen(false)}
        title="Solved"
        footer={
          <Button variant="primary" onClick={onNext}>
            Next puzzle
          </Button>
        }
      >
        <p className="text-md">
          You finished <strong>{puzzle.title}</strong> in <span className="font-mono">{formatClock(progress.seconds)}</span>
          {progress.helped ? ', with a little help.' : ', no help needed.'}
        </p>
        {best !== undefined && (
          <p className="text-base text-fg-2">
            Best time on this puzzle: <span className="font-mono">{formatClock(best)}</span>
          </p>
        )}
      </Modal>
    </div>
  )
}
