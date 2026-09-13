/** Mulberry32: tiny, fast and deterministic. For shuffles and daily picks, never for secrets. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A shuffled copy (Fisher-Yates). */
export function shuffled<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  return shuffled(items, mulberry32(seed))
}

export function randomItem<T>(items: readonly T[], random: () => number = Math.random): T {
  return items[Math.floor(random() * items.length)]
}
