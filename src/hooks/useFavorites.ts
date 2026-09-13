import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'

const EMPTY: string[] = []

export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage<string[]>('favorites', EMPTY)

  const toggleFavorite = useCallback(
    (id: string) => setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    [setFavorites],
  )

  return { favorites, toggleFavorite }
}
