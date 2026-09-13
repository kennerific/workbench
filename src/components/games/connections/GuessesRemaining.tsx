import { MAX_MISTAKES } from '../../../utils/connections'
import { cx } from '../../../utils/cx'

export function GuessesRemaining({ mistakes }: { mistakes: number }) {
  const left = MAX_MISTAKES - mistakes
  return (
    <div className="flex items-center justify-center gap-s3 text-base text-fg-2">
      <span>
        Mistakes remaining<span className="wb-visually-hidden">: {left}</span>
      </span>
      <span aria-hidden className="flex gap-1.5">
        {Array.from({ length: MAX_MISTAKES }, (_, i) => (
          <span key={i} className={cx('size-3 transition-colors duration-(--dur-2)', i < left ? 'bg-fg-2' : 'bg-line')} />
        ))}
      </span>
    </div>
  )
}
