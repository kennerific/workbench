import { CHIPS, formatMoney } from '../../../utils/blackjack'
import { cx } from '../../../utils/cx'

/* Each denomination takes a solved accent family, with its own -on colour for
   the value. A dashed inner rule stands in for the edge spots of a real chip. */
const CHIP_CLASS: Record<(typeof CHIPS)[number], string> = {
  1: 'bg-graphite text-graphite-on',
  5: 'bg-vermillion text-vermillion-on',
  25: 'bg-green text-green-on',
  100: 'bg-cobalt text-cobalt-on',
  500: 'bg-violet text-violet-on',
}

export function Chips({ bank, bet, onChip }: { bank: number; bet: number; onChip: (value: number) => void }) {
  return (
    <div role="group" aria-label="Chips" className="flex flex-wrap justify-center gap-s2">
      {CHIPS.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onChip(value)}
          disabled={bet + value > bank}
          aria-label={`Add ${formatMoney(value)}`}
          className={cx(
            'flex size-13 items-center justify-center font-mono text-sm font-semibold outline-1 -outline-offset-5 outline-current outline-dashed',
            'transition-transform duration-(--dur-1) hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0',
            CHIP_CLASS[value],
          )}
        >
          {value}
        </button>
      ))}
    </div>
  )
}
