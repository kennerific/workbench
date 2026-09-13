import { useCallback, useRef, useSyncExternalStore } from 'react'
import { getStored, setStored, subscribeStored } from '../utils/storage'

export type SetStored<T> = (next: T | ((prev: T) => T)) => void

/** A persisted value shared by every component that reads the same key. */
export function useLocalStorage<T>(key: string, fallback: T, version = 1): [T, SetStored<T>] {
  const fallbackRef = useRef(fallback)
  const subscribe = useCallback((fn: () => void) => subscribeStored(key, fn), [key])
  const value = useSyncExternalStore(
    subscribe,
    () => getStored(key, fallback, version),
    () => fallback,
  )

  const set = useCallback<SetStored<T>>(
    (next) => {
      const prev = getStored(key, fallbackRef.current, version)
      const value = typeof next === 'function' ? (next as (prev: T) => T)(prev) : next
      setStored(key, value, version)
    },
    [key, version],
  )

  return [value, set]
}
