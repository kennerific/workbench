import type { ConnectionsPuzzle, ConnectionsState } from '../../../types/connections'
import { SolvedRow } from './SolvedRow'
import { WordCard } from './WordCard'

interface GridProps {
  puzzle: ConnectionsPuzzle
  state: ConnectionsState
  busy: boolean
  onToggle: (word: string) => void
  /** Registers each card element, for the lift and shake animations. */
  cardRef: (word: string, element: HTMLButtonElement | null) => void
}

export function Grid({ puzzle, state, busy, onToggle, cardRef }: GridProps) {
  const groups = [...state.solved, ...state.revealed]
  const full = state.selected.length >= 4

  return (
    <div className="flex flex-col gap-s2">
      {groups.map((index) => (
        <SolvedRow key={index} group={puzzle.groups[index]} revealed={state.revealed.includes(index)} />
      ))}
      {state.order.length > 0 && (
        <div role="group" aria-label="Words" className="grid grid-cols-4 gap-s2">
          {state.order.map((word) => {
            const selected = state.selected.includes(word)
            return (
              <WordCard
                key={word}
                ref={(element) => cardRef(word, element)}
                word={word}
                selected={selected}
                disabled={busy || state.status !== 'playing' || (full && !selected)}
                onToggle={() => onToggle(word)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
