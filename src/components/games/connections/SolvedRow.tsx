import type { ConnectionsGroup } from '../../../types/connections'
import { cx } from '../../../utils/cx'

/* The four difficulty colours are solved accent families, easiest to
   trickiest: amber, green, cobalt, violet. Each pairs with its own -on text. */
const LEVEL_CLASS = [
  'bg-amber text-amber-on',
  'bg-green text-green-on',
  'bg-cobalt text-cobalt-on',
  'bg-violet text-violet-on',
] as const

export function SolvedRow({ group, revealed }: { group: ConnectionsGroup; revealed: boolean }) {
  return (
    <div
      className={cx(
        'flex min-h-[4.5rem] animate-rise flex-col items-center justify-center gap-0.5 px-s3 py-s2 text-center sm:min-h-20',
        LEVEL_CLASS[group.level],
      )}
    >
      <p className="text-sm font-bold tracking-[.06em] uppercase">
        {group.label}
        {revealed && <span className="wb-visually-hidden"> (revealed)</span>}
      </p>
      <p className="text-base">{group.words.join(', ')}</p>
    </div>
  )
}
