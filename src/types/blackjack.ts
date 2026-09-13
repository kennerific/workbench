export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'

export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

export interface Card {
  rank: Rank
  suit: Suit
  /** Unique within a shoe, for React keys. */
  id: string
}

export type HandOutcome = 'blackjack' | 'win' | 'push' | 'lose' | 'bust' | 'surrender'

export interface PlayerHand {
  cards: Card[]
  bet: number
  doubled: boolean
  fromSplit: boolean
  /** Split aces take one card each and cannot act further. */
  splitAces: boolean
  stood: boolean
  surrendered: boolean
  outcome?: HandOutcome
  /** Total returned to the bank for this hand, stake included. */
  payout?: number
}

export type TablePhase = 'betting' | 'insurance' | 'player' | 'settled'

export interface BlackjackState {
  phase: TablePhase
  shoe: Card[]
  /** Set once the cut card is reached; the next deal starts a fresh shoe. */
  needsShuffle: boolean
  dealer: Card[]
  hands: PlayerHand[]
  active: number
  bank: number
  /** The bet being built during the betting phase. */
  bet: number
  lastBet: number
  insurance: number
  insuranceWon: boolean | null
  /** Net result of the settled round, insurance included. */
  net: number
}

export interface BlackjackStats {
  hands: number
  wins: number
  losses: number
  pushes: number
  blackjacks: number
  biggestWin: number
  peakBank: number
}
