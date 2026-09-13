import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../../../hooks/useReducedMotion'
import type { ScoredGuess } from '../../../types/wordle'
import { MAX_GUESSES, WORD_LENGTH } from '../../../utils/wordle'
import { REVEAL_STEP_MS } from './tileStyles'
import { Tile } from './Tile'

interface BoardProps {
  rows: ScoredGuess[]
  current: string
  /** Index of the row currently flipping, if any. */
  revealing: number | null
  /** Increments each time the current row is rejected. */
  shake: number
  highContrast: boolean
}

const SHAKE: Keyframe[] = [
  { transform: 'translateX(0)' },
  { transform: 'translateX(-6px)' },
  { transform: 'translateX(6px)' },
  { transform: 'translateX(-4px)' },
  { transform: 'translateX(4px)' },
  { transform: 'translateX(0)' },
]

export function Board({ rows, current, revealing, shake, highContrast }: BoardProps) {
  const reduced = useReducedMotion()
  const currentRow = useRef<HTMLDivElement>(null)

  // Rows keep stable keys so a committed row's tiles can transition in place;
  // the shake is replayed with the Web Animations API instead of a remount.
  useEffect(() => {
    if (shake === 0 || reduced) return
    currentRow.current?.animate(SHAKE, { duration: 360, easing: 'ease-in-out' })
  }, [shake, reduced])

  return (
    <div role="group" aria-label="Guesses" className="grid w-[min(100%,20rem)] gap-1.5 [perspective:800px]">
      {Array.from({ length: MAX_GUESSES }, (_, r) => {
        const row = rows[r]
        const isCurrent = r === rows.length
        const letters = row ? row.guess : isCurrent ? current : ''
        return (
          <div key={r} ref={isCurrent ? currentRow : undefined} className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: WORD_LENGTH }, (_, c) => (
              <Tile
                key={c}
                letter={letters[c] ?? ''}
                state={row?.states[c]}
                revealDelay={revealing === r ? (reduced ? 0 : c * REVEAL_STEP_MS) : undefined}
                highContrast={highContrast}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}
