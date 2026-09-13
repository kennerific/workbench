import { RefreshCw } from 'lucide-react'
import { MIN_BET, STARTING_BANK, formatMoney } from '../../../utils/blackjack'
import { Button } from '../../common/Button'
import { Kbd } from '../../common/Kbd'
import { Note } from '../../common/Note'
import { Chips } from './Chips'

interface BettingControlsProps {
  bank: number
  bet: number
  lastBet: number
  onChip: (value: number) => void
  onClear: () => void
  onRebet: () => void
  onDeal: () => void
  onRefill: () => void
}

export function BettingControls({ bank, bet, lastBet, onChip, onClear, onRebet, onDeal, onRefill }: BettingControlsProps) {
  if (bank < MIN_BET) {
    return (
      <Note tone="warn">
        <span>You are out of chips. The house will stake you again.</span>
        <Button variant="primary" size="sm" className="ml-auto" onClick={onRefill}>
          <RefreshCw className="size-4" aria-hidden />
          Refill to {formatMoney(STARTING_BANK)}
        </Button>
      </Note>
    )
  }

  return (
    <div className="flex flex-col items-center gap-s3">
      <Chips bank={bank} bet={bet} onChip={onChip} />
      <div className="flex flex-wrap items-center justify-center gap-s2">
        <Button onClick={onClear} disabled={bet === 0}>
          Clear
        </Button>
        {bet === 0 && lastBet > 0 && (
          <Button onClick={onRebet} disabled={lastBet > bank}>
            Rebet {formatMoney(lastBet)}
          </Button>
        )}
        <Button variant="primary" onClick={onDeal} disabled={bet < MIN_BET}>
          Deal
          <Kbd>Enter</Kbd>
        </Button>
      </div>
      <p className="text-sm text-fg-3">
        {bet < MIN_BET ? `Minimum bet ${formatMoney(MIN_BET)}. Tap chips to add to your bet.` : 'Tap chips to raise the bet.'}
      </p>
    </div>
  )
}
