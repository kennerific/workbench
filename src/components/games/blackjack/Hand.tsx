import type { Card, HandOutcome } from '../../../types/blackjack'
import { formatMoney } from '../../../utils/blackjack'
import { cx } from '../../../utils/cx'
import { Badge } from '../../common/Badge'
import { PlayingCard } from './PlayingCard'

const OUTCOME_LABEL: Record<HandOutcome, string> = {
  blackjack: 'Blackjack',
  win: 'Win',
  push: 'Push',
  lose: 'Lose',
  bust: 'Bust',
  surrender: 'Surrendered',
}

const OUTCOME_TONE = {
  blackjack: 'ok',
  win: 'ok',
  push: 'neutral',
  lose: 'danger',
  bust: 'danger',
  surrender: 'warn',
} as const

interface HandProps {
  label: string
  cards: Card[]
  score: string | null
  owner: 'dealer' | 'player'
  hideHole?: boolean
  bet?: number
  doubled?: boolean
  outcome?: HandOutcome
  active?: boolean
}

/* The first four cards stagger in deal order (player, dealer, player, dealer).
   Later dealer cards follow one another; a player's hit lands at once. */
function dealDelay(owner: 'dealer' | 'player', index: number): number {
  if (index < 2) return owner === 'player' ? index * 240 : 120 + index * 240
  return owner === 'dealer' ? (index - 1) * 260 : 0
}

export function Hand({ label, cards, score, owner, hideHole, bet, doubled, outcome, active }: HandProps) {
  return (
    <div
      role="group"
      aria-label={`${label}${score ? `, ${score}` : ''}`}
      className={cx('flex min-w-0 flex-col items-center gap-s2 p-s2', active && 'outline-2 outline-offset-2 outline-accent')}
    >
      <div className="flex min-h-[6rem] items-end sm:min-h-28">
        {cards.map((card, i) => {
          const faceDown = !!hideHole && i === 1
          // A new key when the hole card turns over replays the deal animation as the reveal.
          return <PlayingCard key={faceDown ? `${card.id}-down` : card.id} card={card} faceDown={faceDown} delay={dealDelay(owner, i)} />
        })}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-s2 gap-y-s1 text-sm">
        <span className="font-semibold">{label}</span>
        {score && <span className="font-mono text-fg-2 tabular-nums">{score}</span>}
        {bet !== undefined && (
          <span className="font-mono text-fg-2 tabular-nums">
            {formatMoney(bet)}
            {doubled ? ' doubled' : ''}
          </span>
        )}
        {outcome && <Badge tone={OUTCOME_TONE[outcome]}>{OUTCOME_LABEL[outcome]}</Badge>}
      </div>
    </div>
  )
}
