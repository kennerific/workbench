import type { Entry } from '../../../types/crossword'
import { cx } from '../../../utils/cx'

interface ClueListProps {
  title: string
  entries: Entry[]
  active: Entry
  crossing?: Entry
  letters: string[]
  onPick: (entry: Entry) => void
}

export function ClueList({ title, entries, active, crossing, letters, onPick }: ClueListProps) {
  return (
    <section aria-label={`${title} clues`} className="flex min-w-0 flex-col gap-s1">
      <h2 className="wb-eyebrow border-b border-line pb-s1">{title}</h2>
      <ol className="flex flex-col">
        {entries.map((entry) => {
          const isActive = entry === active
          const isCrossing = entry === crossing
          const done = entry.cells.every((i) => letters[i])
          return (
            <li key={`${entry.number}-${entry.direction}`}>
              <button
                type="button"
                aria-current={isActive}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onPick(entry)}
                className={cx(
                  'flex w-full gap-s2 border-l-2 px-s2 py-1.5 text-left text-base transition-colors duration-(--dur-1)',
                  isActive
                    ? 'border-accent bg-accent-soft text-fg'
                    : isCrossing
                      ? 'border-line-strong text-fg hover:bg-surface-2'
                      : cx('border-transparent hover:bg-surface-2', done ? 'text-fg-3' : 'text-fg-2'),
                )}
              >
                <span className="w-5 flex-none font-mono font-semibold">{entry.number}</span>
                <span>{entry.clue}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
