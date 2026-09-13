import { useEffect } from 'react'
import type { ThemeChoice } from '../types/app'
import { useLocalStorage } from './useLocalStorage'

/* Three states. An explicit choice stamps data-theme on <html>; "system"
   stamps nothing so prefers-color-scheme decides. index.html applies the
   stored choice before first paint; this keeps it in sync afterwards. */
export function useTheme() {
  const [theme, setTheme] = useLocalStorage<ThemeChoice>('theme', 'system')

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
  }, [theme])

  return [theme, setTheme] as const
}
