import type { BlackjackState, Card } from '../../../types/blackjack'
import { handValue } from '../../../utils/blackjack'
import { Hand } from './Hand'

function scoreLabel(cards: readonly Card[]): string {
  const { total, soft } = handValue(cards)
  if (total > 21) return `${total}, bust`
  return soft ? `Soft ${total}` : String(total)
}

export function Table({ table }: { table: BlackjackState }) {
  const hidden = table.phase === 'insurance' || table.phase === 'player'
  const up = table.dealer[0]
  const dealerScore = !up ? null : hidden ? (up.rank === 'A' ? 'Showing an ace' : `Showing ${handValue([up]).total}`) : scoreLabel(table.dealer)
  const split = table.hands.length > 1

  return (
    <section aria-label="Table" className="flex flex-col gap-s4 border border-fg bg-surface px-s3 py-s5 sm:px-s6">
      {table.dealer.length > 0 ? (
        <Hand label="Dealer" owner="dealer" cards={table.dealer} hideHole={hidden} score={dealerScore} />
      ) : (
        <EmptyHand label="Dealer" />
      )}

      <div aria-hidden className="border-t border-dashed border-line" />

      {table.hands.length > 0 ? (
        <div className="flex flex-wrap items-start justify-center gap-x-s6 gap-y-s4">
          {table.hands.map((hand, i) => (
            <Hand
              key={i}
              label={split ? `Hand ${i + 1}` : 'You'}
              owner="player"
              cards={hand.cards}
              score={scoreLabel(hand.cards)}
              bet={hand.bet}
              doubled={hand.doubled}
              outcome={hand.outcome}
              active={split && table.phase === 'player' && i === table.active}
            />
          ))}
        </div>
      ) : (
        <EmptyHand label="You" />
      )}
    </section>
  )
}

function EmptyHand({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-s2 p-s2">
      <div aria-hidden className="flex">
        <div className="h-[6rem] w-[4.25rem] border border-dashed border-line-strong sm:h-28 sm:w-20" />
        <div className="-ml-9 h-[6rem] w-[4.25rem] border border-dashed border-line-strong sm:-ml-11 sm:h-28 sm:w-20" />
      </div>
      <span className="text-sm font-semibold text-fg-3">{label}</span>
    </div>
  )
}
