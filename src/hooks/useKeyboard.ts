import { useEffect, useRef } from 'react'

/* Page-level key handling for games. Ignores modified keys, typing in form
   fields, anything while a modal is open, and Enter or Space on a focused
   button (the button's own click handles those). */
export function useKeyboard(onKey: (key: string, event: KeyboardEvent) => void, enabled = true) {
  const handler = useRef(onKey)

  useEffect(() => {
    handler.current = onKey
  })

  useEffect(() => {
    if (!enabled) return

    function handle(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (document.querySelector('dialog[open]')) return
      const target = event.target instanceof Element ? event.target : null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      if (target?.closest('button, a') && (event.key === 'Enter' || event.key === ' ')) return
      handler.current(event.key, event)
    }

    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [enabled])
}
