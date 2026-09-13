import { describe, expect, it } from 'vitest'
import type { BlackjackState, Card, Rank, Suit } from '../types/blackjack'
import {
  EMPTY_BLACKJACK_STATS,
  STARTING_BANK,
  availableActions,
  buildShoe,
  createTable,
  dealerShouldHit,
  formatMoney,
  handValue,
  isBlackjack,
  recordBlackjack,
  reduceBlackjack,
  type BlackjackAction,
} from './blackjack'
import { mulberry32 } from './rng'

const SUIT: Record<string, Suit> = { S: 'spades', H: 'hearts', D: 'diamonds', C: 'clubs' }
let serial = 0

function card(code: string): Card {
  return { rank: code.slice(0, -1) as Rank, suit: SUIT[code.slice(-1)], id: `t${serial++}` }
}

function cards(...codes: string[]): Card[] {
  return codes.map(card)
}

/* A table whose next draws come out in the given order: player, dealer,
   player, dealer, then any hits. Cards are popped from the end of the shoe,
   and a full shoe underneath keeps it well above the cut card. */
function rigged(draws: string[], bet = 10, bank = STARTING_BANK): BlackjackState {
  return { ...createTable(bank), shoe: [...buildShoe(), ...cards(...draws).reverse()], needsShuffle: false, bet }
}

const noShuffle = () => {
  throw new Error('should not reshuffle')
}

function run(state: BlackjackState, ...actions: BlackjackAction[]): BlackjackState {
  return actions.reduce(reduceBlackjack, state)
}

const DEAL: BlackjackAction = { type: 'deal', random: noShuffle }

describe('hand values', () => {
  it('counts aces as 11 until that busts', () => {
    expect(handValue(cards('AS', '6H'))).toEqual({ total: 17, soft: true })
    expect(handValue(cards('AS', '6H', '10D'))).toEqual({ total: 17, soft: false })
    expect(handValue(cards('AS', 'AH', '9D'))).toEqual({ total: 21, soft: true })
    expect(handValue(cards('KS', 'QH', '2D'))).toEqual({ total: 22, soft: false })
  })

  it('recognises blackjack only on two unsplit cards', () => {
    expect(isBlackjack(cards('AS', 'KH'))).toBe(true)
    expect(isBlackjack(cards('AS', 'KH'), true)).toBe(false)
    expect(isBlackjack(cards('7S', '7H', '7D'))).toBe(false)
  })

  it('has the dealer stand on soft 17 and hit 16', () => {
    expect(dealerShouldHit(cards('AS', '6H'))).toBe(false)
    expect(dealerShouldHit(cards('10S', '6H'))).toBe(true)
  })
})

describe('betting', () => {
  it('never bets more than the bank and needs the minimum to deal', () => {
    let state = createTable(30)
    state = run(state, { type: 'chip', value: 25 }, { type: 'chip', value: 25 })
    expect(state.bet).toBe(25)
    const small = run(createTable(), { type: 'chip', value: 1 }, DEAL)
    expect(small.phase).toBe('betting')
  })

  it('refills only a broke bank', () => {
    expect(run(createTable(3), { type: 'refill' }).bank).toBe(STARTING_BANK)
    expect(run(createTable(500), { type: 'refill' }).bank).toBe(500)
  })

  it('keeps the last bet for the next hand when affordable', () => {
    const settled = run(rigged(['10S', '6H', '6D', '10C', '10H']), DEAL, { type: 'hit' })
    expect(run(settled, { type: 'next' })).toMatchObject({ phase: 'betting', bet: 10, hands: [], dealer: [] })
  })
})

describe('rounds', () => {
  it('pays a natural blackjack 3:2 without the dealer playing', () => {
    const state = run(rigged(['AS', '9H', 'KD', '7C']), DEAL)
    expect(state.phase).toBe('settled')
    expect(state.hands[0].outcome).toBe('blackjack')
    expect(state.bank).toBe(1015)
    expect(state.net).toBe(15)
  })

  it('offers insurance on an ace and pays it 2:1 against a dealer blackjack', () => {
    const offered = run(rigged(['9S', 'AH', '9D', 'KC']), DEAL)
    expect(offered.phase).toBe('insurance')

    const insured = run(offered, { type: 'insurance', take: true })
    expect(insured.phase).toBe('settled')
    expect(insured.hands[0].outcome).toBe('lose')
    expect(insured.insuranceWon).toBe(true)
    expect(insured.bank).toBe(1000)

    const declined = run(offered, { type: 'insurance', take: false })
    expect(declined.bank).toBe(990)
  })

  it('loses the insurance stake when the dealer has no blackjack', () => {
    let state = run(rigged(['9S', 'AH', '9D', '5C', '2S']), DEAL, { type: 'insurance', take: true })
    expect(state).toMatchObject({ phase: 'player', bank: 985 })
    state = run(state, { type: 'stand' })
    // Dealer A-5-2 is soft 18 against the player's 18.
    expect(state.hands[0].outcome).toBe('push')
    expect(state).toMatchObject({ bank: 995, net: -5, insuranceWon: false })
  })

  it('has the dealer stand on soft 17', () => {
    const state = run(rigged(['10S', '6H', '8D', 'AC']), DEAL, { type: 'stand' })
    expect(state.dealer).toHaveLength(2)
    expect(state.hands[0].outcome).toBe('win')
    expect(state.bank).toBe(1010)
  })

  it('settles a bust at once and leaves the dealer hand alone', () => {
    const state = run(rigged(['10S', '6H', '6D', '10C', '10H']), DEAL, { type: 'hit' })
    expect(state.phase).toBe('settled')
    expect(state.hands[0].outcome).toBe('bust')
    expect(state.dealer).toHaveLength(2)
    expect(state.bank).toBe(990)
  })

  it('doubles the bet for exactly one more card', () => {
    const state = run(rigged(['6S', '6H', '5D', '10C', '10S', '9H']), DEAL, { type: 'double' })
    expect(state.hands[0]).toMatchObject({ bet: 20, doubled: true, outcome: 'win' })
    expect(state.hands[0].cards).toHaveLength(3)
    expect(state.bank).toBe(1020)
  })

  it('splits a pair into two hands played in turn', () => {
    let state = run(rigged(['8S', '6H', '8D', '10C', '3S', '2H', '10D']), DEAL)
    expect(availableActions(state).split).toBe(true)
    state = run(state, { type: 'split' })
    expect(state.hands.map((h) => h.cards.length)).toEqual([2, 2])
    expect(state).toMatchObject({ active: 0, bank: 980 })
    state = run(state, { type: 'stand' })
    expect(state.active).toBe(1)
    state = run(state, { type: 'stand' })
    expect(state.hands.map((h) => h.outcome)).toEqual(['win', 'win'])
    expect(state.bank).toBe(1020)
  })

  it('gives split aces one card each and does not count 21 as blackjack', () => {
    const state = run(rigged(['AS', '6H', 'AD', '10C', '9S', 'KH', '5D']), DEAL, { type: 'split' })
    expect(state.phase).toBe('settled')
    // Dealer 6-10-5 makes 21: A-9 loses, A-K is a plain 21 and pushes.
    expect(state.hands.map((h) => h.outcome)).toEqual(['lose', 'push'])
    expect(state.bank).toBe(990)
  })

  it('refuses a split the bank cannot cover', () => {
    const state = run(rigged(['8S', '6H', '8D', '10C'], 10, 15), DEAL)
    expect(availableActions(state).split).toBe(false)
    expect(availableActions(state).double).toBe(false)
  })

  it('returns half the bet on surrender', () => {
    const state = run(rigged(['10S', '6H', '6D', '10C']), DEAL, { type: 'surrender' })
    expect(state.hands[0].outcome).toBe('surrender')
    expect(state.dealer).toHaveLength(2)
    expect(state.bank).toBe(995)
  })

  it('ignores actions that are not available', () => {
    const betting = createTable()
    expect(run(betting, { type: 'hit' })).toBe(betting)
  })
})

describe('the shoe', () => {
  it('holds six decks', () => {
    const shoe = buildShoe()
    expect(shoe).toHaveLength(312)
    expect(shoe.filter((c) => c.rank === 'A')).toHaveLength(24)
    expect(new Set(shoe.map((c) => c.id)).size).toBe(312)
  })

  it('shuffles a fresh shoe on the first deal', () => {
    const state = run({ ...createTable(), bet: 10 }, { type: 'deal', random: mulberry32(1) })
    expect(state.shoe).toHaveLength(308)
    expect(state.needsShuffle).toBe(false)
  })

  it('marks the cut card and reshuffles on the next deal', () => {
    // 80 cards, the top four rigged so the hand plays out without insurance.
    const low = {
      ...createTable(),
      shoe: [...buildShoe().slice(0, 76), ...cards('10S', '6H', '8D', '10C').reverse()],
      needsShuffle: false,
      bet: 10,
    }
    const passed = run(low, DEAL)
    expect(passed.phase).toBe('player')
    expect(passed.needsShuffle).toBe(true)

    const settled = run(passed, { type: 'stand' })
    expect(settled.phase).toBe('settled')
    const next = run(settled, { type: 'next' }, { type: 'deal', random: mulberry32(2) })
    expect(next.shoe.length).toBeGreaterThanOrEqual(300)
  })
})

describe('stats and money', () => {
  it('records outcomes, the biggest win and the peak bank', () => {
    const settled = run(rigged(['8S', '6H', '8D', '10C', '3S', '2H', '10D']), DEAL, { type: 'split' }, { type: 'stand' }, { type: 'stand' })
    expect(recordBlackjack(EMPTY_BLACKJACK_STATS, settled)).toMatchObject({ hands: 2, wins: 2, biggestWin: 20, peakBank: 1020 })
  })

  it('formats whole dollars, cents and losses', () => {
    expect(formatMoney(1250)).toBe('$1,250')
    expect(formatMoney(12.5)).toBe('$12.50')
    expect(formatMoney(-10)).toBe('-$10')
  })
})
