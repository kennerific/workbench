/* Namespaced, versioned localStorage.

   Every key is stored as wb:<key> holding { v, data }. A version mismatch or
   unreadable value falls back rather than throwing, so a schema change can
   never brick a game. Values are cached in memory so every reader of a key
   sees the same reference, and writes notify subscribers in this tab and, via
   the storage event, in other tabs. */

const PREFIX = 'wb:'

interface Envelope<T> {
  v: number
  data: T
}

type Listener = () => void

const cache = new Map<string, unknown>()
const listeners = new Map<string, Set<Listener>>()

function notify(key: string): void {
  listeners.get(key)?.forEach((fn) => fn())
}

function read<T>(key: string, fallback: T, version: number): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    const parsed = JSON.parse(raw) as Partial<Envelope<T>> | null
    if (!parsed || parsed.v !== version || !('data' in parsed)) return fallback
    return parsed.data as T
  } catch {
    return fallback
  }
}

export function getStored<T>(key: string, fallback: T, version = 1): T {
  if (!cache.has(key)) cache.set(key, read(key, fallback, version))
  return cache.get(key) as T
}

export function setStored<T>(key: string, value: T, version = 1): void {
  cache.set(key, value)
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ v: version, data: value } satisfies Envelope<T>))
  } catch {
    // Private mode or quota: the in-memory value still holds for this visit.
  }
  notify(key)
}

export function removeStored(key: string): void {
  cache.delete(key)
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
  notify(key)
}

export function subscribeStored(key: string, fn: Listener): () => void {
  let set = listeners.get(key)
  if (!set) {
    set = new Set()
    listeners.set(key, set)
  }
  set.add(fn)
  return () => {
    set.delete(fn)
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (!event.key?.startsWith(PREFIX)) return
    const key = event.key.slice(PREFIX.length)
    cache.delete(key)
    notify(key)
  })
}
