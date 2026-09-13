import { useState } from 'react'
import { BookOpen, ChartColumn } from 'lucide-react'
import { useKeyboard } from '../../../hooks/useKeyboard'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import type { BlackjackState, BlackjackStats } from '../../../types/blackjack'
import {
  BLACKJACK_KEYS,
  EMPTY_BLACKJACK_STATS,
  availableActions,
  createTable,
  cryptoRandom,
  formatMoney,
  isBlackjack,
  handValue,
  recordBlackjack,
  reduceBlackjack,
  type BlackjackAction,
} from '../../../utils/blackjack'
import { Button } from '../../common/Button'
import { Kbd } from '../../common/Kbd'
import { Note } from '../../common/Note'
import { PageHeader } from '../../common/PageHeader'
import { Stats } from '../../common/Stats'
import { ActionBar, type PlayerMove } from './ActionBar'
import { BettingControls } from './BettingControls'
import { BlackjackRulesModal, BlackjackStatsModal } from './BlackjackModals'
import { Table } from './Table'

const INITIAL_TABLE = createTable()

function signed(amount: number): string {
  return amount > 0 ? `+${formatMoney(amount)}` : formatMoney(amount)
}

function resultText(table: BlackjackState): string {
  const net = table.net
  const tail = net > 0 ? `You win ${formatMoney(net)}.` : net < 0 ? `You lose ${formatMoney(-net)}.` : 'Your stake comes back.'
  const insurance = table.insuranceWon === null ? '' : table.insuranceWon ? ' Insurance paid.' : ' Insurance lost.'

  if (table.hands.length > 1) return `${table.hands.length} hands settled. ${tail}${insurance}`

  const dealerBust = handValue(table.dealer).total > 21
  const dealerBlackjack = isBlackjack(table.dealer)
  const heads = {
    blackjack: 'Blackjack!',
    win: dealerBust ? 'Dealer busts.' : 'You beat the dealer.',
    push: 'Push.',
    lose: dealerBlackjack ? 'Dealer has blackjack.' : 'Dealer wins.',
    bust: 'Bust.',
    surrender: 'Surrendered.',
  }
  const outcome = table.hands[0]?.outcome
  return `${outcome ? heads[outcome] : ''} ${tail}${insurance}`.trim()
}

export function BlackjackGame() {
  const [table, setTable] = useLocalStorage<BlackjackState>(BLACKJACK_KEYS.table, INITIAL_TABLE)
  const [stats, setStats] = useLocalStorage<BlackjackStats>(BLACKJACK_KEYS.stats, EMPTY_BLACKJACK_STATS)
  const [statsOpen, setStatsOpen] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const can = availableActions(table)

  function act(action: BlackjackAction) {
    const next = reduceBlackjack(table, action)
    if (next === table) return
    setTable(next)
    if (table.phase !== 'settled' && next.phase === 'settled') setStats((prev) => recordBlackjack(prev, next))
  }

  const deal = () => act({ type: 'deal', random: cryptoRandom })
  const move = (m: PlayerMove) => act({ type: m })

  useKeyboard((key) => {
    const k = key.toLowerCase()
    if (table.phase === 'player') {
      const moves: Record<string, PlayerMove> = { h: 'hit', s: 'stand', d: 'double', p: 'split', r: 'surrender' }
      if (moves[k]) move(moves[k])
    } else if (table.phase === 'insurance') {
      if (k === 'y') act({ type: 'insurance', take: true })
      if (k === 'n') act({ type: 'insurance', take: false })
    } else if (key === 'Enter') {
      if (table.phase === 'betting') deal()
      else act({ type: 'next' })
    }
  })

  const staked =
    table.phase === 'betting' ? table.bet : table.hands.reduce((sum, hand) => sum + hand.bet, 0) + table.insurance
  const insuranceCost = (table.hands[0]?.bet ?? 0) / 2

  return (
    <>
      <PageHeader title="Blackjack" note="Six decks. The dealer stands on every 17. Blackjack pays 3 to 2.">
        <Button variant="quiet" size="icon" onClick={() => setRulesOpen(true)} aria-label="Table rules" title="Table rules">
          <BookOpen className="size-4" aria-hidden />
        </Button>
        <Button variant="quiet" size="icon" onClick={() => setStatsOpen(true)} aria-label="Statistics" title="Statistics">
          <ChartColumn className="size-4" aria-hidden />
        </Button>
      </PageHeader>

      <div className="mx-auto flex w-full max-w-[56rem] flex-col gap-s4">
        <Stats
          items={[
            { label: 'Chips', value: formatMoney(table.bank) },
            { label: table.phase === 'betting' ? 'Bet' : 'On the table', value: formatMoney(staked) },
            { label: 'Last hand', value: table.phase === 'settled' ? signed(table.net) : '·' },
          ]}
        />

        <Table table={table} />

        <div aria-live="polite" className="flex flex-col gap-s3">
          {table.phase === 'betting' && (
            <BettingControls
              bank={table.bank}
              bet={table.bet}
              lastBet={table.lastBet}
              onChip={(value) => act({ type: 'chip', value })}
              onClear={() => act({ type: 'clear' })}
              onRebet={() => act({ type: 'rebet' })}
              onDeal={deal}
              onRefill={() => act({ type: 'refill' })}
            />
          )}

          {table.phase === 'insurance' && (
            <Note tone="accent">
              <span>
                The dealer shows an ace. Insurance costs {formatMoney(insuranceCost)} and pays 2 to 1 if the dealer has blackjack.
              </span>
              <span className="ml-auto flex gap-s2">
                <Button size="sm" onClick={() => act({ type: 'insurance', take: true })} disabled={table.bank < insuranceCost}>
                  Insure <Kbd>Y</Kbd>
                </Button>
                <Button size="sm" variant="primary" onClick={() => act({ type: 'insurance', take: false })}>
                  No thanks <Kbd>N</Kbd>
                </Button>
              </span>
            </Note>
          )}

          {table.phase === 'player' && <ActionBar can={can} onMove={move} />}

          {table.phase === 'settled' && (
            <Note tone={table.net > 0 ? 'ok' : table.net < 0 ? 'danger' : 'neutral'}>
              <span className="font-semibold">{resultText(table)}</span>
              <Button variant="primary" size="sm" className="ml-auto" onClick={() => act({ type: 'next' })}>
                Next hand <Kbd>Enter</Kbd>
              </Button>
            </Note>
          )}
        </div>
      </div>

      <BlackjackStatsModal open={statsOpen} onClose={() => setStatsOpen(false)} stats={stats} />
      <BlackjackRulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </>
  )
}
