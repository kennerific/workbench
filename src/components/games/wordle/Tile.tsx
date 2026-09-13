import type { CSSProperties } from 'react'
import type { LetterState } from '../../../types/wordle'
import { cx } from '../../../utils/cx'
import { FLIP_MS, STATE_LABEL, stateClass } from './tileStyles'

interface TileProps {
  letter: string
  state?: LetterState
  /** Set only while this tile's row is being revealed. */
  revealDelay?: number
  highContrast: boolean
}

/* The reveal is CSS only. The flip animation starts after revealDelay, and
   the colour classes arrive at the same moment but transition with zero
   duration after half a flip, so the colour changes while the tile is edge-on. */
export function Tile({ letter, state, revealDelay, highContrast }: TileProps) {
  const revealing = revealDelay !== undefined
  const style: CSSProperties | undefined = revealing
    ? { animationDelay: `${revealDelay}ms`, transitionDelay: `${revealDelay + FLIP_MS / 2}ms` }
    : undefined

  return (
    <div
      role="img"
      aria-label={letter ? `${letter}${state ? `, ${STATE_LABEL[state]}` : ''}` : 'empty'}
      style={style}
      className={cx(
        'flex aspect-square items-center justify-center border-2 text-[clamp(1.35rem,7vw,2rem)] leading-none font-bold uppercase select-none',
        'transition-[background-color,border-color,color] duration-0',
        state ? stateClass(state, highContrast) : letter ? 'animate-pop border-fg bg-surface text-fg' : 'border-line-strong bg-surface',
        revealing && 'animate-flip',
      )}
    >
      {letter}
    </div>
  )
}
