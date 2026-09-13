import { TAGS } from '../../data/apps'
import type { AppTag } from '../../types/app'
import { cx } from '../../utils/cx'

const OPTIONS: Array<AppTag | null> = [null, ...TAGS]

/** A joined segmented control. One tag at a time, or All. */
export function TagFilter({ value, onChange }: { value: AppTag | null; onChange: (tag: AppTag | null) => void }) {
  return (
    <div role="group" aria-label="Filter by tag" className="flex max-w-full overflow-x-auto border border-line-strong [scrollbar-width:none]">
      {OPTIONS.map((tag, index) => {
        const selected = value === tag
        return (
          <button
            key={tag ?? 'all'}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(tag)}
            className={cx(
              'px-s3 py-s2 text-base whitespace-nowrap transition-colors duration-(--dur-1) sm:px-s4',
              index > 0 && 'border-l border-line-strong',
              selected ? 'bg-accent text-accent-on' : 'bg-surface text-fg hover:bg-surface-2',
            )}
          >
            {tag ?? 'All'}
          </button>
        )
      })}
    </div>
  )
}
