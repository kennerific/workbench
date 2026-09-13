import type { BlackjackStats } from '../../../types/blackjack'
import { formatMoney } from '../../../utils/blackjack'
import { Modal } from '../../common/Modal'
import { Stats } from '../../common/Stats'

export function BlackjackStatsModal({ open, onClose, stats }: { open: boolean; onClose: () => void; stats: BlackjackStats }) {
  return (
    <Modal open={open} onClose={onClose} title="Statistics">
      <Stats
        items={[
          { label: 'Hands', value: stats.hands },
          { label: 'Wins', value: stats.wins },
          { label: 'Losses', value: stats.losses },
          { label: 'Pushes', value: stats.pushes },
        ]}
      />
      <Stats
        items={[
          { label: 'Blackjacks', value: stats.blackjacks },
          { label: 'Best hand', value: formatMoney(stats.biggestWin) },
          { label: 'Peak chips', value: formatMoney(stats.peakBank) },
        ]}
      />
      <p className="text-sm text-fg-3">Split hands count separately. Chips are for fun and have no value.</p>
    </Modal>
  )
}

const RULES = [
  'Six decks, shuffled again once three quarters of the shoe has been dealt.',
  'The dealer draws to 16 and stands on every 17, soft 17 included.',
  'Blackjack pays 3 to 2. Other wins pay 1 to 1, and a tie returns your bet.',
  'Double down on any first two cards, including after a split, for exactly one more card.',
  'Split two cards of the same rank, up to four hands. Split aces get one card each, and 21 after a split is not blackjack.',
  'When the dealer shows an ace you can insure for half your bet. Insurance pays 2 to 1 if the dealer has blackjack.',
  'Surrender your first two cards to take back half your bet.',
]

export function BlackjackRulesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Table rules">
      <ul className="flex list-disc flex-col gap-s2 pl-s4 text-base text-fg-2">
        {RULES.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
      <p className="text-sm text-fg-3">
        Keys: H hit, S stand, D double, P split, R surrender, Y or N for insurance, Enter to deal and for the next hand.
      </p>
    </Modal>
  )
}
