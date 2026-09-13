import { useEffect, useRef } from 'react'

/* Calls onTick once a second while running and the tab is visible, so a
   puzzle clock pauses when you switch away. The callback can change every
   render without restarting the interval. */
export function useTicker(onTick: () => void, running: boolean, intervalMs = 1000) {
  const tick = useRef(onTick)

  useEffect(() => {
    tick.current = onTick
  })

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') tick.current()
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [running, intervalMs])
}
