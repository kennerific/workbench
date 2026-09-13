import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Entry } from '../../../types/crossword'
import { Button } from '../../common/Button'

/** The active clue, repeated above the grid, with previous and next buttons. */
export function CluePanel({ entry, onPrev, onNext }: { entry: Entry; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex items-stretch border border-line bg-surface">
      <Button variant="quiet" size="icon" className="h-auto min-h-[34px]" onMouseDown={(e) => e.preventDefault()} onClick={onPrev} aria-label="Previous clue">
        <ChevronLeft className="size-4" aria-hidden />
      </Button>
      <p className="flex min-h-12 flex-1 items-center gap-s3 border-x border-line-2 bg-accent-soft px-s3 py-s2 text-md">
        <span className="flex-none font-mono font-semibold">
          {entry.number}
          {entry.direction === 'across' ? 'A' : 'D'}
        </span>
        <span>{entry.clue}</span>
      </p>
      <Button variant="quiet" size="icon" className="h-auto min-h-[34px]" onMouseDown={(e) => e.preventDefault()} onClick={onNext} aria-label="Next clue">
        <ChevronRight className="size-4" aria-hidden />
      </Button>
    </div>
  )
}
