import type { Ref } from 'react'
import { cx } from '../../../utils/cx'

interface WordCardProps {
  word: string
  selected: boolean
  disabled: boolean
  onToggle: () => void
  ref?: Ref<HTMLButtonElement>
}

export function WordCard({ word, selected, disabled, onToggle, ref }: WordCardProps) {
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onToggle}
      className={cx(
        'flex h-[4.5rem] min-w-0 items-center justify-center border px-1 text-center text-[clamp(0.72rem,3.1vw,1rem)] leading-tight font-bold uppercase select-none [overflow-wrap:anywhere] sm:h-20',
        'transition-colors duration-(--dur-1) active:translate-y-px disabled:cursor-default',
        selected ? 'border-fg bg-fg text-bg' : 'border-line-strong bg-surface-2 text-fg hover:bg-surface-3',
      )}
    >
      {word}
    </button>
  )
}
