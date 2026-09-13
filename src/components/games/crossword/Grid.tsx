import type { CrosswordProgress, CrosswordPuzzle, Cursor, Entry } from '../../../types/crossword'
import { SIZE, isBlock } from '../../../utils/crossword'
import { cx } from '../../../utils/cx'

interface GridProps {
  puzzle: CrosswordPuzzle
  numbers: (number | null)[]
  progress: CrosswordProgress
  cursor: Cursor
  active: Entry
  onSelect: (index: number) => void
}

/* A dark ground shows through one-pixel gaps as the grid lines, so every cell
   paints an opaque background. Screen readers follow the hidden input that
   announces the active clue, so the cells themselves stay presentational. */
export function Grid({ puzzle, numbers, progress, cursor, active, onSelect }: GridProps) {
  return (
    <div aria-hidden className="grid grid-cols-5 gap-px border-2 border-fg bg-fg">
      {Array.from({ length: SIZE * SIZE }, (_, index) =>
        isBlock(puzzle, index) ? (
          <div key={index} className="aspect-square bg-fg" />
        ) : (
          <Cell
            key={index}
            number={numbers[index]}
            letter={progress.letters[index]}
            isCursor={cursor.index === index}
            inWord={active.cells.includes(index)}
            wrong={progress.wrong.includes(index)}
            revealed={progress.revealed.includes(index)}
            onSelect={() => onSelect(index)}
          />
        ),
      )}
    </div>
  )
}

interface CellProps {
  number: number | null
  letter: string
  isCursor: boolean
  inWord: boolean
  wrong: boolean
  revealed: boolean
  onSelect: () => void
}

function Cell({ number, letter, isCursor, inWord, wrong, revealed, onSelect }: CellProps) {
  return (
    <div
      // Keep focus in the grid's input when a cell is clicked.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onSelect}
      className={cx(
        'relative flex aspect-square cursor-pointer items-center justify-center select-none',
        isCursor ? 'bg-accent text-accent-on' : inWord ? 'bg-accent-tint text-fg' : 'bg-surface text-fg',
      )}
    >
      {number !== null && (
        <span
          className={cx(
            'absolute top-0.5 left-1 font-mono text-[clamp(0.55rem,2.4vw,0.75rem)] leading-none',
            isCursor ? 'text-accent-on' : 'text-fg-2',
          )}
        >
          {number}
        </span>
      )}
      <span
        className={cx(
          'text-[clamp(1.35rem,8vw,2.25rem)] leading-none font-semibold',
          !isCursor && wrong && 'text-danger',
          !isCursor && !wrong && revealed && 'text-accent',
        )}
      >
        {letter}
      </span>
      {wrong && (
        <span
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top_right,transparent_calc(50%-1px),var(--danger)_calc(50%-1px),var(--danger)_calc(50%+1px),transparent_calc(50%+1px))]"
        />
      )}
      {revealed && (
        <span
          className={cx(
            'pointer-events-none absolute top-0 right-0 border-t-[10px] border-l-[10px] border-l-transparent',
            isCursor ? 'border-t-accent-on' : 'border-t-accent',
          )}
        />
      )}
    </div>
  )
}
