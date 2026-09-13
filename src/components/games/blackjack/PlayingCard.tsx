import { Club, Diamond, Heart, Spade } from 'lucide-react'
import type { Card, Rank, Suit } from '../../../types/blackjack'
import { cx } from '../../../utils/cx'

const SUIT_ICON = { spades: Spade, hearts: Heart, diamonds: Diamond, clubs: Club } as const

const RANK_NAME: Partial<Record<Rank, string>> = { A: 'Ace', J: 'Jack', Q: 'Queen', K: 'King' }

function cardName(card: Card): string {
  return `${RANK_NAME[card.rank] ?? card.rank} of ${card.suit}`
}

function isRed(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds'
}

interface PlayingCardProps {
  card: Card
  faceDown?: boolean
  /** Milliseconds before the deal animation starts. */
  delay?: number
}

const SIZE = 'h-[6rem] w-[4.25rem] sm:h-28 sm:w-20'

/* Cards overlap in a fan; each later card sits above the one before. Red suits
   use the danger token, which is solved as text on the card's surface. */
export function PlayingCard({ card, faceDown = false, delay = 0 }: PlayingCardProps) {
  const Icon = SUIT_ICON[card.suit]

  return (
    <div className="-ml-9 animate-deal first:ml-0 sm:-ml-11" style={{ animationDelay: `${delay}ms` }}>
      {faceDown ? (
        <div
          role="img"
          aria-label="Face-down card"
          className={cx(
            SIZE,
            'border border-fg bg-accent p-1.5',
            '[background-image:repeating-linear-gradient(45deg,transparent_0_5px,color-mix(in_srgb,var(--accent-on)_35%,transparent)_5px_6px)]',
          )}
        >
          <div className="size-full border border-accent-on/40" />
        </div>
      ) : (
        <div
          role="img"
          aria-label={cardName(card)}
          className={cx(SIZE, 'flex flex-col justify-between border border-fg bg-surface p-1.5', isRed(card.suit) ? 'text-danger' : 'text-fg')}
        >
          <Corner rank={card.rank} Icon={Icon} />
          <Icon className="size-7 self-center sm:size-8" fill="currentColor" strokeWidth={1.5} aria-hidden />
          <Corner rank={card.rank} Icon={Icon} flipped />
        </div>
      )}
    </div>
  )
}

function Corner({ rank, Icon, flipped = false }: { rank: Rank; Icon: typeof Spade; flipped?: boolean }) {
  return (
    <div aria-hidden className={cx('flex flex-col items-start gap-0.5 leading-none', flipped && 'rotate-180')}>
      <span className="font-mono text-sm font-semibold sm:text-md">{rank}</span>
      <Icon className="size-3" fill="currentColor" strokeWidth={1.5} />
    </div>
  )
}
