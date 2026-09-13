import { Dices, Trash2, Upload } from 'lucide-react'
import type { ConnectionsPuzzle, ConnectionsState } from '../../../types/connections'
import { CONNECTIONS_KEYS } from '../../../utils/connections'
import { getStored } from '../../../utils/storage'
import { Badge } from '../../common/Badge'
import { Button } from '../../common/Button'
import { Modal } from '../../common/Modal'

interface PuzzlePickerProps {
  open: boolean
  onClose: () => void
  puzzles: ConnectionsPuzzle[]
  customIds: ReadonlySet<string>
  dailyId: string
  currentId: string
  onPick: (id: string) => void
  onRandom: () => void
  onLoadCustom: () => void
  onRemoveCustom: (id: string) => void
}

function progressLabel(id: string): string {
  const state = getStored<ConnectionsState | null>(CONNECTIONS_KEYS.progress(id), null)
  if (!state) return 'New'
  if (state.status === 'won') return state.mistakes === 0 ? 'Perfect' : 'Solved'
  if (state.status === 'lost') return 'Missed'
  return state.guesses.length > 0 ? 'In progress' : 'New'
}

export function PuzzlePicker(props: PuzzlePickerProps) {
  const { open, onClose, puzzles, customIds, dailyId, currentId, onPick, onRandom, onLoadCustom, onRemoveCustom } = props

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Puzzles"
      size="lg"
      footer={
        <>
          <Button onClick={onRandom}>
            <Dices className="size-4" aria-hidden />
            Random puzzle
          </Button>
          <Button onClick={onLoadCustom}>
            <Upload className="size-4" aria-hidden />
            Load your own
          </Button>
        </>
      }
    >
      {open && (
        <ul className="flex flex-col border border-line">
          {puzzles.map((puzzle) => {
            const current = puzzle.id === currentId
            const custom = customIds.has(puzzle.id)
            return (
              <li key={puzzle.id} className="flex items-stretch border-b border-line-2 last:border-b-0">
                <button
                  type="button"
                  aria-current={current}
                  onClick={() => onPick(puzzle.id)}
                  className="flex min-w-0 flex-1 items-center gap-s2 border-l-2 border-transparent px-s3 py-s2 text-left text-fg-2 hover:bg-surface-2 hover:text-fg aria-[current=true]:border-accent aria-[current=true]:bg-accent-soft aria-[current=true]:text-fg"
                >
                  <span className="truncate font-semibold">{puzzle.title}</span>
                  {puzzle.id === dailyId && <Badge tone="accent">Today</Badge>}
                  {custom && <Badge>Custom</Badge>}
                  <span className="ml-auto flex-none font-mono text-xs text-fg-3">{progressLabel(puzzle.id)}</span>
                </button>
                {custom && (
                  <Button
                    variant="quiet"
                    size="icon"
                    className="h-auto self-stretch"
                    onClick={() => onRemoveCustom(puzzle.id)}
                    aria-label={`Remove ${puzzle.title}`}
                    title="Remove"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}
