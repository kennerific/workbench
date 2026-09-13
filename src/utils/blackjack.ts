import type { BlackjackState, BlackjackStats, Card, HandOutcome, PlayerHand, Rank, Suit } from '../types/blackjack'
import { shuffled } from './rng'

export const DECKS = 6
/** Share of the shoe dealt before the cut card. */
export const PENETRATION = 0.75
export const STARTING_BANK = 1000
export const MIN_BET = 5
export const MAX_HANDS = 4
export const CHIPS = [1, 5, 25, 100, 500] as const

export const BLACKJACK_KEYS = {
  table: 'blackjack:table',
  stats: 'blackjack:stats',
} as const

export const SUITS: readonly Suit[] = ['spades', 'hearts', 'diamonds', 'clubs']
export const RANKS: readonly Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

const SHOE_SIZE = DECKS * 52
const CUT_CARD = Math.floor(SHOE_SIZE * (1 - PENETRATION))

export function buildShoe(decks = DECKS): Card[] {
  const cards: Card[] = []
  for (let d = 0; d < decks; d++) {
    for (const suit of SUITS) for (const rank of RANKS) cards.push({ rank, suit, id: `${d}${suit[0]}${rank}` })
  }
  return cards
}

/** Uniform floats from the platform CSPRNG, for shuffling a real shoe. */
export function cryptoRandom(): number {
  const buffer = new Uint32Array(1)
  crypto.getRandomValues(buffer)
  return buffer[0] / 4294967296
}

export function rankValue(rank: Rank): number {
  if (rank === 'A') return 11
  if (rank === 'J' || rank === 'Q' || rank === 'K') return 10
  return Number(rank)
}

/** Aces count 11 until that would bust, then 1. Soft means an ace is still counting 11. */
export function handValue(cards: readonly Card[]): { total: number; soft: boolean } {
  let total = 0
  let elevens = 0
  for (const card of cards) {
    total += rankValue(card.rank)
    if (card.rank === 'A') elevens++
  }
  while (total > 21 && elevens > 0) {
    total -= 10
    elevens--
  }
  return { total, soft: elevens > 0 }
}

/** Two cards to 21. A split hand reaching 21 in two cards is just 21. */
export function isBlackjack(cards: readonly Card[], fromSplit = false): boolean {
  return !fromSplit && cards.length === 2 && handValue(cards).total === 21
}

/** The dealer stands on every 17, soft 17 included. */
export function dealerShouldHit(cards: readonly Card[]): boolean {
  return handValue(cards).total < 17
}

export function settleHand(hand: PlayerHand, dealer: readonly Card[]): { outcome: HandOutcome; payout: number } {
  if (hand.surrendered) return { outcome: 'surrender', payout: hand.bet / 2 }
  const player = handValue(hand.cards).total
  if (player > 21) return { outcome: 'bust', payout: 0 }

  const playerBlackjack = isBlackjack(hand.cards, hand.fromSplit)
  const dealerBlackjack = isBlackjack(dealer)
  if (playerBlackjack && dealerBlackjack) return { outcome: 'push', payout: hand.bet }
  if (playerBlackjack) return { outcome: 'blackjack', payout: hand.bet * 2.5 }
  if (dealerBlackjack) return { outcome: 'lose', payout: 0 }

  const house = handValue(dealer).total
  if (house > 21 || player > house) return { outcome: 'win', payout: hand.bet * 2 }
  if (player === house) return { outcome: 'push', payout: hand.bet }
  return { outcome: 'lose', payout: 0 }
}

export function createTable(bank = STARTING_BANK): BlackjackState {
  return {
    phase: 'betting',
    shoe: [],
    needsShuffle: true,
    dealer: [],
    hands: [],
    active: 0,
    bank,
    bet: 0,
    lastBet: 0,
    insurance: 0,
    insuranceWon: null,
    net: 0,
  }
}

function newHand(cards: Card[], bet: number, fromSplit = false, splitAces = false): PlayerHand {
  return { cards, bet, doubled: false, fromSplit, splitAces, stood: splitAces, surrendered: false }
}

export interface AvailableActions {
  hit: boolean
  stand: boolean
  double: boolean
  split: boolean
  surrender: boolean
}

export function availableActions(state: BlackjackState): AvailableActions {
  const hand = state.hands[state.active]
  if (state.phase !== 'player' || !hand || hand.stood) {
    return { hit: false, stand: false, double: false, split: false, surrender: false }
  }
  const twoCards = hand.cards.length === 2
  return {
    hit: true,
    stand: true,
    double: twoCards && !hand.splitAces && state.bank >= hand.bet,
    split:
      twoCards && hand.cards[0].rank === hand.cards[1].rank && state.hands.length < MAX_HANDS && state.bank >= hand.bet,
    surrender: twoCards && state.hands.length === 1 && !hand.fromSplit,
  }
}

export function canRefill(state: BlackjackState): boolean {
  return state.phase === 'betting' && state.bank < MIN_BET
}

export type BlackjackAction =
  | { type: 'chip'; value: number }
  | { type: 'clear' }
  | { type: 'rebet' }
  /** The caller supplies randomness, used only when a fresh shoe is needed. */
  | { type: 'deal'; random: () => number }
  | { type: 'insurance'; take: boolean }
  | { type: 'hit' }
  | { type: 'stand' }
  | { type: 'double' }
  | { type: 'split' }
  | { type: 'surrender' }
  | { type: 'next' }
  | { type: 'refill' }

export function reduceBlackjack(state: BlackjackState, action: BlackjackAction): BlackjackState {
  const can = availableActions(state)

  switch (action.type) {
    case 'chip': {
      if (state.phase !== 'betting') return state
      const bet = state.bet + action.value
      return bet <= state.bank ? { ...state, bet } : state
    }
    case 'clear':
      return state.phase === 'betting' && state.bet > 0 ? { ...state, bet: 0 } : state
    case 'rebet':
      return state.phase === 'betting' && state.lastBet > 0 && state.lastBet <= state.bank ? { ...state, bet: state.lastBet } : state
    case 'deal':
      return deal(state, action.random)
    case 'insurance':
      return state.phase === 'insurance' ? takeInsurance(state, action.take) : state

    case 'hit': {
      if (!can.hit) return state
      const shoe = [...state.shoe]
      const hands = state.hands.map((hand, i) => (i === state.active ? { ...hand, cards: [...hand.cards, shoe.pop()!] } : hand))
      return advance({ ...state, shoe, hands })
    }
    case 'stand': {
      if (!can.stand) return state
      return advance({ ...state, hands: state.hands.map((hand, i) => (i === state.active ? { ...hand, stood: true } : hand)) })
    }
    case 'double': {
      if (!can.double) return state
      const shoe = [...state.shoe]
      const hand = state.hands[state.active]
      const doubled: PlayerHand = { ...hand, cards: [...hand.cards, shoe.pop()!], bet: hand.bet * 2, doubled: true, stood: true }
      return advance({
        ...state,
        shoe,
        bank: state.bank - hand.bet,
        hands: state.hands.map((h, i) => (i === state.active ? doubled : h)),
      })
    }
    case 'split': {
      if (!can.split) return state
      const shoe = [...state.shoe]
      const hand = state.hands[state.active]
      const [first, second] = hand.cards
      const aces = first.rank === 'A'
      const left = newHand([first, shoe.pop()!], hand.bet, true, aces)
      const right = newHand([second, shoe.pop()!], hand.bet, true, aces)
      const hands = [...state.hands.slice(0, state.active), left, right, ...state.hands.slice(state.active + 1)]
      return advance({ ...state, shoe, hands, bank: state.bank - hand.bet })
    }
    case 'surrender': {
      if (!can.surrender) return state
      return advance({ ...state, hands: [{ ...state.hands[0], surrendered: true, stood: true }] })
    }

    case 'next': {
      if (state.phase !== 'settled') return state
      return {
        ...state,
        phase: 'betting',
        dealer: [],
        hands: [],
        active: 0,
        insurance: 0,
        insuranceWon: null,
        net: 0,
        bet: state.lastBet <= state.bank ? state.lastBet : 0,
      }
    }
    case 'refill':
      return canRefill(state) ? { ...state, bank: STARTING_BANK, bet: 0 } : state
  }
}

function deal(state: BlackjackState, random: () => number): BlackjackState {
  if (state.phase !== 'betting' || state.bet < MIN_BET || state.bet > state.bank) return state

  const fresh = state.needsShuffle || state.shoe.length < 20
  const shoe = fresh ? shuffled(buildShoe(), random) : [...state.shoe]
  const draw = () => shoe.pop()!
  const player1 = draw()
  const dealer1 = draw()
  const player2 = draw()
  const dealer2 = draw()

  const table: BlackjackState = {
    ...state,
    phase: 'player',
    shoe,
    needsShuffle: shoe.length <= CUT_CARD,
    bank: state.bank - state.bet,
    lastBet: state.bet,
    dealer: [dealer1, dealer2],
    hands: [newHand([player1, player2], state.bet)],
    active: 0,
    insurance: 0,
    insuranceWon: null,
    net: 0,
  }

  return dealer1.rank === 'A' ? { ...table, phase: 'insurance' } : peek(table)
}

/* Simplified insurance: offered on a dealer ace, costs half the bet, pays 2:1
   if the hole card makes blackjack. Declining, or not affording it, just peeks. */
function takeInsurance(state: BlackjackState, take: boolean): BlackjackState {
  const cost = state.hands[0].bet / 2
  const insured = take && state.bank >= cost ? { ...state, bank: state.bank - cost, insurance: cost } : state
  return peek({ ...insured, phase: 'player' })
}

/* The dealer checks the hole card under an ace or ten. A dealer blackjack ends
   the round at once; so does a player blackjack, which needs no more cards. */
function peek(state: BlackjackState): BlackjackState {
  const upValue = rankValue(state.dealer[0].rank)
  if (upValue >= 10 && isBlackjack(state.dealer)) return settle(state)
  if (isBlackjack(state.hands[0].cards)) return settle(state)
  return state
}

/* Move to the next hand that still needs a decision. When none is left the
   dealer draws to 17, unless every hand has already busted or surrendered. */
function advance(state: BlackjackState): BlackjackState {
  const hands = state.hands.map((hand) => (!hand.stood && handValue(hand.cards).total >= 21 ? { ...hand, stood: true } : hand))
  const next = hands.findIndex((hand) => !hand.stood)
  if (next !== -1) return { ...state, hands, active: next }

  const shoe = [...state.shoe]
  const dealer = [...state.dealer]
  const live = hands.some((hand) => !hand.surrendered && handValue(hand.cards).total <= 21)
  if (live) while (dealerShouldHit(dealer)) dealer.push(shoe.pop()!)

  return settle({ ...state, hands, dealer, shoe, needsShuffle: shoe.length <= CUT_CARD })
}

function settle(state: BlackjackState): BlackjackState {
  const hands = state.hands.map((hand) => ({ ...hand, stood: true, ...settleHand(hand, state.dealer) }))
  const dealerBlackjack = isBlackjack(state.dealer)
  const insurancePayout = state.insurance > 0 && dealerBlackjack ? state.insurance * 3 : 0
  const returned = hands.reduce((sum, hand) => sum + (hand.payout ?? 0), 0) + insurancePayout
  const staked = hands.reduce((sum, hand) => sum + hand.bet, 0) + state.insurance

  return {
    ...state,
    phase: 'settled',
    hands,
    active: -1,
    bank: state.bank + returned,
    net: returned - staked,
    insuranceWon: state.insurance > 0 ? dealerBlackjack : null,
  }
}

export const EMPTY_BLACKJACK_STATS: BlackjackStats = {
  hands: 0,
  wins: 0,
  losses: 0,
  pushes: 0,
  blackjacks: 0,
  biggestWin: 0,
  peakBank: STARTING_BANK,
}

export function recordBlackjack(stats: BlackjackStats, settled: BlackjackState): BlackjackStats {
  const outcomes = settled.hands.map((hand) => hand.outcome)
  const count = (...kinds: HandOutcome[]) => outcomes.filter((o) => o && kinds.includes(o)).length
  return {
    hands: stats.hands + outcomes.length,
    wins: stats.wins + count('win', 'blackjack'),
    losses: stats.losses + count('lose', 'bust', 'surrender'),
    pushes: stats.pushes + count('push'),
    blackjacks: stats.blackjacks + count('blackjack'),
    biggestWin: Math.max(stats.biggestWin, settled.net),
    peakBank: Math.max(stats.peakBank, settled.bank),
  }
}

/** "$1,250", "$12.50", "-$10". */
export function formatMoney(amount: number): string {
  const hasCents = Math.round(Math.abs(amount) * 100) % 100 !== 0
  const digits = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  })
  return `${amount < 0 ? '-' : ''}$${digits}`
}
