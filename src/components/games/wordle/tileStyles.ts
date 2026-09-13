import type { LetterState } from '../../../types/wordle'

/** One flip, and the gap between neighbouring tiles starting theirs. */
export const FLIP_MS = 500
export const REVEAL_STEP_MS = 280

/* Standard colours come from the solved status tokens. High contrast swaps
   in two accent families that stay distinct under common colour vision
   deficiencies. Absent uses the quietest foreground as a fill, which still
   clears AA against the ground used as its text colour. */
export function stateClass(state: LetterState, highContrast: boolean): string {
  switch (state) {
    case 'correct':
      return highContrast ? 'border-vermillion bg-vermillion text-vermillion-on' : 'border-ok bg-ok text-ok-on'
    case 'present':
      return highContrast ? 'border-cobalt bg-cobalt text-cobalt-on' : 'border-warn bg-warn text-warn-on'
    case 'absent':
      return 'border-fg-3 bg-fg-3 text-bg'
  }
}

export const STATE_LABEL: Record<LetterState, string> = {
  correct: 'correct',
  present: 'in the word, wrong spot',
  absent: 'not in the word',
}
