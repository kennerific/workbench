import { useEffect, useMemo, useRef, useState } from 'react'
import { ChartColumn, Settings } from 'lucide-react'
import { useKeyboard } from '../../../hooks/useKeyboard'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { prefersReducedMotion } from '../../../hooks/useReducedMotion'
import { useToast } from '../../../hooks/useToast'
import type { GameStatus, WordleMode, WordleRecord, WordleSettings, WordleStats } from '../../../types/wordle'
import { dayNumber } from '../../../utils/daily'
import {
  EMPTY_STATS,
  MAX_GUESSES,
  WORDLE_KEYS,
  WORD_LENGTH,
  gameStatus,
  hardModeViolation,
  mergeKeyStates,
  recordResult,
  scoreGuesses,
} from '../../../utils/wordle'
import { dailyAnswer, loadGuessSet, randomAnswer } from '../../../utils/wordleWords'
import { Button } from '../../common/Button'
import { Note } from '../../common/Note'
import { PageHeader } from '../../common/PageHeader'
import { Segmented } from '../../common/Segmented'
import { Board } from './Board'
import { Keyboard } from './Keyboard'
import { FLIP_MS, REVEAL_STEP_MS, STATE_LABEL } from './tileStyles'
import { WordleSettingsModal } from './WordleSettingsModal'
import { WordleStatsModal } from './WordleStatsModal'

const DEFAULT_SETTINGS: WordleSettings = { hard: false, highContrast: false }
const MODES = [
  { value: 'daily', label: 'Daily' },
  { value: 'unlimited', label: 'Unlimited' },
] as const
const PRAISE = ['Genius', 'Magnificent', 'Impressive', 'Splendid', 'Great', 'Phew']

export function WordleGame() {
  const [mode, setMode] = useLocalStorage<WordleMode>(WORDLE_KEYS.mode, 'daily')
  const [settings, setSettings] = useLocalStorage<WordleSettings>(WORDLE_KEYS.settings, DEFAULT_SETTINGS)
  const [daily, setDaily] = useLocalStorage<WordleRecord | null>(WORDLE_KEYS.daily, null)
  const [unlimited, setUnlimited] = useLocalStorage<WordleRecord | null>(WORDLE_KEYS.unlimited, null)
  const [stats, setStats] = useLocalStorage<WordleStats>(WORDLE_KEYS.stats(mode), EMPTY_STATS)
  const [today] = useState(() => dayNumber())
  const [statsOpen, setStatsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // A stored daily round only counts if it is today's; otherwise start fresh.
  const dailyRecord = useMemo<WordleRecord>(
    () => (daily?.day === today ? daily : { answer: dailyAnswer(today), guesses: [], hard: settings.hard, day: today }),
    [daily, today, settings.hard],
  )

  useEffect(() => {
    if (mode === 'unlimited' && !unlimited) setUnlimited({ answer: randomAnswer(), guesses: [], hard: settings.hard })
  }, [mode, unlimited, setUnlimited, settings.hard])

  const record = mode === 'daily' ? dailyRecord : unlimited
  const puzzleNumber = today + 1
  const hardLocked = !!record && record.guesses.length > 0 && gameStatus(scoreGuesses(record.guesses, record.answer)) === 'playing'

  function commitGuess(guess: string): GameStatus {
    if (!record) return 'playing'
    const guesses = [...record.guesses, guess]
    const next: WordleRecord = { ...record, guesses, hard: record.guesses.length === 0 ? settings.hard : record.hard }
    if (mode === 'daily') setDaily(next)
    else setUnlimited(next)

    const status = gameStatus(scoreGuesses(guesses, record.answer))
    if (status !== 'playing') {
      setStats((prev) => recordResult(prev, status === 'won', guesses.length, mode === 'daily' ? today : undefined))
    }
    return status
  }

  function newUnlimitedWord() {
    setUnlimited({ answer: randomAnswer(unlimited?.answer), guesses: [], hard: settings.hard })
    setStatsOpen(false)
  }

  return (
    <>
      <PageHeader
        title="Wordle"
        note={
          mode === 'daily'
            ? `Daily #${puzzleNumber}. Everyone gets the same word today.`
            : 'Unlimited. A new word every round, as many as you like.'
        }
      >
        <Segmented label="Mode" options={MODES} value={mode} onChange={setMode} />
        <Button variant="quiet" size="icon" onClick={() => setStatsOpen(true)} aria-label="Statistics" title="Statistics">
          <ChartColumn className="size-4" aria-hidden />
        </Button>
        <Button variant="quiet" size="icon" onClick={() => setSettingsOpen(true)} aria-label="Settings" title="Settings">
          <Settings className="size-4" aria-hidden />
        </Button>
      </PageHeader>

      {record && (
        <WordleRound
          key={`${mode}:${record.day ?? ''}:${record.answer}`}
          record={record}
          settings={settings}
          onCommit={commitGuess}
          onFinished={() => setStatsOpen(true)}
          onShowStats={() => setStatsOpen(true)}
          onNewWord={mode === 'unlimited' ? newUnlimitedWord : undefined}
        />
      )}

      <WordleStatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        stats={stats}
        mode={mode}
        today={today}
        record={record}
        shareTitle={mode === 'daily' ? `Workbench Wordle #${puzzleNumber}` : 'Workbench Wordle Unlimited'}
        onNewWord={mode === 'unlimited' ? newUnlimitedWord : undefined}
      />
      <WordleSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={setSettings}
        hardLocked={hardLocked}
      />
    </>
  )
}

interface WordleRoundProps {
  record: WordleRecord
  settings: WordleSettings
  onCommit: (guess: string) => GameStatus
  onFinished: () => void
  onShowStats: () => void
  onNewWord?: () => void
}

/* One round. Keyed by its answer, so typing, reveal and shake state reset on
   a new word or a mode switch without any manual clearing. */
function WordleRound({ record, settings, onCommit, onFinished, onShowStats, onNewWord }: WordleRoundProps) {
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [shake, setShake] = useState(0)
  const [revealing, setRevealing] = useState<number | null>(null)
  const [guessSet, setGuessSet] = useState<Set<string> | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const timers = useRef<number[]>([])

  const rows = useMemo(() => scoreGuesses(record.guesses, record.answer), [record])
  const status = gameStatus(rows)
  // The keyboard only learns from a row once it has finished flipping.
  const keyStates = useMemo(() => mergeKeyStates(revealing === null ? rows : rows.slice(0, revealing)), [rows, revealing])
  const busy = revealing !== null
  const hard = record.guesses.length === 0 ? settings.hard : record.hard

  useEffect(() => {
    let alive = true
    loadGuessSet().then((set) => {
      if (alive) setGuessSet(set)
    })
    const pending = timers.current
    return () => {
      alive = false
      pending.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  function later(fn: () => void, ms: number) {
    timers.current.push(window.setTimeout(fn, ms))
  }

  function reject(message: string) {
    setShake((n) => n + 1)
    toast.show(message)
  }

  function submit() {
    if (current.length < WORD_LENGTH) return reject('Not enough letters')
    if (!guessSet) return toast.show('Loading the word list, try again in a moment')
    if (!guessSet.has(current)) return reject('Not in word list')
    if (hard) {
      const problem = hardModeViolation(current, rows)
      if (problem) return reject(problem)
    }

    const rowIndex = record.guesses.length
    const guess = current
    const result = onCommit(guess)
    setCurrent('')
    setRevealing(rowIndex)

    const reduced = prefersReducedMotion()
    const revealMs = reduced ? 0 : REVEAL_STEP_MS * (WORD_LENGTH - 1) + FLIP_MS
    later(() => {
      setRevealing(null)
      const states = scoreGuesses([guess], record.answer)[0].states
      setAnnouncement(`${guess}: ${guess.split('').map((l, i) => `${l} ${STATE_LABEL[states[i]]}`).join(', ')}`)
      if (result === 'won') toast.show(PRAISE[rowIndex] ?? 'Solved', { tone: 'ok' })
      if (result === 'lost') toast.show(record.answer, { duration: 3200 })
      if (result !== 'playing') later(onFinished, reduced ? 300 : 1400)
    }, revealMs)
  }

  function handleKey(key: string) {
    if (status !== 'playing' || busy) return
    if (key === 'Enter') return submit()
    if (key === 'Backspace') return setCurrent((word) => word.slice(0, -1))
    if (/^[a-z]$/i.test(key)) setCurrent((word) => (word.length < WORD_LENGTH ? word + key.toUpperCase() : word))
  }

  useKeyboard(handleKey)

  return (
    <div className="flex flex-col items-center gap-s4">
      {status !== 'playing' && !busy && (
        <Note tone={status === 'won' ? 'ok' : 'neutral'} className="w-full max-w-[31rem]">
          <span className="font-semibold">
            {status === 'won' ? `Solved in ${rows.length} of ${MAX_GUESSES}.` : `The word was ${record.answer}.`}
          </span>
          <span className="ml-auto flex gap-s2">
            <Button size="sm" onClick={onShowStats}>
              Stats and share
            </Button>
            {onNewWord && (
              <Button size="sm" variant="primary" onClick={onNewWord}>
                New word
              </Button>
            )}
          </span>
        </Note>
      )}

      <Board rows={rows} current={current} revealing={revealing} shake={shake} highContrast={settings.highContrast} />

      <Keyboard states={keyStates} onKey={handleKey} disabled={status !== 'playing'} highContrast={settings.highContrast} />

      <p className="wb-visually-hidden" aria-live="polite">
        {announcement}
      </p>
      {hard && status === 'playing' && <p className="text-sm text-fg-3">Hard mode is on for this round.</p>}
    </div>
  )
}
