import { Shuffle } from 'lucide-react'
import { Button } from '../../common/Button'

interface ControlsProps {
  onShuffle: () => void
  onDeselect: () => void
  onSubmit: () => void
  canDeselect: boolean
  canSubmit: boolean
  busy: boolean
}

export function Controls({ onShuffle, onDeselect, onSubmit, canDeselect, canSubmit, busy }: ControlsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-s2">
      <Button onClick={onShuffle} disabled={busy}>
        <Shuffle className="size-4" aria-hidden />
        Shuffle
      </Button>
      <Button onClick={onDeselect} disabled={!canDeselect || busy}>
        Deselect all
      </Button>
      <Button variant="primary" onClick={onSubmit} disabled={!canSubmit || busy}>
        Submit
      </Button>
    </div>
  )
}
