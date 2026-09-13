import { cx } from '../../utils/cx'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

interface SegmentedProps<T extends string> {
  label: string
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
}

/** Workbench tabs: a joined row of toggle buttons, exactly one pressed. */
export function Segmented<T extends string>({ label, options, value, onChange }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex max-w-full overflow-x-auto border border-line-strong [scrollbar-width:none]">
      {options.map((option, index) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cx(
              'px-s3 py-s2 text-base whitespace-nowrap transition-colors duration-(--dur-1) sm:px-s4',
              index > 0 && 'border-l border-line-strong',
              selected ? 'bg-accent text-accent-on' : 'bg-surface text-fg hover:bg-surface-2',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
