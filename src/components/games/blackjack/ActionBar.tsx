import type { AvailableActions } from '../../../utils/blackjack'
import { Button } from '../../common/Button'
import { Kbd } from '../../common/Kbd'

export type PlayerMove = keyof AvailableActions

const MOVES: { move: PlayerMove; label: string; key: string }[] = [
  { move: 'hit', label: 'Hit', key: 'H' },
  { move: 'stand', label: 'Stand', key: 'S' },
  { move: 'double', label: 'Double', key: 'D' },
  { move: 'split', label: 'Split', key: 'P' },
  { move: 'surrender', label: 'Surrender', key: 'R' },
]

export function ActionBar({ can, onMove }: { can: AvailableActions; onMove: (move: PlayerMove) => void }) {
  return (
    <div role="group" aria-label="Your move" className="grid grid-cols-2 gap-s2 sm:flex sm:flex-wrap sm:justify-center">
      {MOVES.map(({ move, label, key }) => (
        <Button
          key={move}
          variant={move === 'hit' || move === 'stand' ? 'primary' : 'default'}
          disabled={!can[move]}
          onClick={() => onMove(move)}
          aria-keyshortcuts={key}
          className="sm:min-w-28"
        >
          {label}
          <Kbd>{key}</Kbd>
        </Button>
      ))}
    </div>
  )
}
