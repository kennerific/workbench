import type { ReactNode } from 'react'
import { CornerDownLeft, Delete } from 'lucide-react'
import type { LetterState } from '../../../types/wordle'
import { cx } from '../../../utils/cx'
import { STATE_LABEL, stateClass } from './tileStyles'

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']

interface KeyboardProps {
  states: Record<string, LetterState>
  onKey: (key: string) => void
  disabled: boolean
  highContrast: boolean
}

export function Keyboard({ states, onKey, disabled, highContrast }: KeyboardProps) {
  return (
    <div role="group" aria-label="Keyboard" className="flex w-full max-w-[31rem] flex-col gap-1.5 select-none">
      {ROWS.map((row, i) => (
        <div key={row} className="flex gap-1.5">
          {i === 1 && <span aria-hidden className="flex-[0.5]" />}
          {i === 2 && (
            <Key label="Enter" wide disabled={disabled} onPress={() => onKey('Enter')}>
              <CornerDownLeft className="size-4 sm:hidden" aria-hidden />
              <span className="max-sm:hidden">Enter</span>
            </Key>
          )}
          {row.split('').map((letter) => {
            const state = states[letter]
            return (
              <Key
                key={letter}
                label={state ? `${letter}, ${STATE_LABEL[state]}` : letter}
                disabled={disabled}
                className={state ? stateClass(state, highContrast) : undefined}
                onPress={() => onKey(letter)}
              >
                {letter}
              </Key>
            )
          })}
          {i === 2 && (
            <Key label="Backspace" wide disabled={disabled} onPress={() => onKey('Backspace')}>
              <Delete className="size-5" aria-hidden />
            </Key>
          )}
          {i === 1 && <span aria-hidden className="flex-[0.5]" />}
        </div>
      ))}
    </div>
  )
}

interface KeyProps {
  label: string
  onPress: () => void
  disabled: boolean
  wide?: boolean
  className?: string
  children: ReactNode
}

function Key({ label, onPress, disabled, wide, className, children }: KeyProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      // Keep focus on the page so physical Enter never re-presses the last clicked key.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onPress}
      className={cx(
        'flex h-13 min-w-0 flex-1 items-center justify-center border text-sm font-bold uppercase transition-colors duration-(--dur-1) active:translate-y-px disabled:cursor-default',
        wide && 'flex-[1.5] text-xs',
        className ?? 'border-line-strong bg-surface-2 text-fg hover:bg-surface-3',
      )}
    >
      {children}
    </button>
  )
}
