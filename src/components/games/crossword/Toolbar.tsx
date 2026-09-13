import { Button } from '../../common/Button'
import { CrosswordTimer } from './CrosswordTimer'

interface ToolbarProps {
  seconds: number
  solved: boolean
  onCheck: () => void
  onRevealCell: () => void
  onRevealWord: () => void
  onClear: () => void
}

export function Toolbar({ seconds, solved, onCheck, onRevealCell, onRevealWord, onClear }: ToolbarProps) {
  const keepFocus = (event: React.MouseEvent) => event.preventDefault()
  return (
    <div className="flex flex-wrap items-center gap-x-s3 gap-y-s2">
      <CrosswordTimer seconds={seconds} stopped={solved} />
      <div className="ml-auto flex flex-wrap gap-s1">
        <Button size="sm" onMouseDown={keepFocus} onClick={onCheck} disabled={solved}>
          Check grid
        </Button>
        <Button size="sm" onMouseDown={keepFocus} onClick={onRevealCell} disabled={solved}>
          Reveal cell
        </Button>
        <Button size="sm" onMouseDown={keepFocus} onClick={onRevealWord} disabled={solved}>
          Reveal word
        </Button>
        <Button size="sm" variant="quiet" onClick={onClear} disabled={solved}>
          Clear
        </Button>
      </div>
    </div>
  )
}
