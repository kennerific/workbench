import type { ReactNode } from 'react'

/** A key hint. Hidden on touch-sized screens, where there is no keyboard to press. */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="border border-line-strong bg-surface-2 px-[5px] font-mono text-xs leading-normal font-normal text-fg-2 max-sm:hidden">
      {children}
    </kbd>
  )
}
