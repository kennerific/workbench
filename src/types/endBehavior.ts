export type Sign = 1 | -1

export type Parity = 'even' | 'odd'

/** Where one end of the graph heads: up to +infinity or down to -infinity. */
export type End = 'up' | 'down'

export interface Root {
  x: number
  /** A double root touches the axis and turns back instead of crossing. */
  bounce: boolean
}

/** A polynomial in factored form: sign times the product of (x - r) per root. */
export interface Poly {
  sign: Sign
  roots: Root[]
}

export interface EndClass {
  sign: Sign
  parity: Parity
}

export interface Ends {
  left: End
  right: End
}

export type ClassKey = 'positive-even' | 'negative-even' | 'positive-odd' | 'negative-odd'

export type Mode = 'identify' | 'graph'

export interface Tally {
  answered: number
  correct: number
}

export interface EndBehaviorStats {
  modes: Record<Mode, Tally>
  classes: Record<ClassKey, Tally>
  streak: number
  best: number
}

export interface GraphPrompt {
  target: EndClass
  /** Distinct x-intercepts, ascending. */
  intercepts: number[]
}
