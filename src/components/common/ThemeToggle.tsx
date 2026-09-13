import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import type { ThemeChoice } from '../../types/app'
import { Button } from './Button'

const NEXT: Record<ThemeChoice, ThemeChoice> = { system: 'light', light: 'dark', dark: 'system' }
const LABEL: Record<ThemeChoice, string> = { system: 'System', light: 'Light', dark: 'Dark' }
const ICON = { system: Monitor, light: Sun, dark: Moon }

/** Cycles system, light, dark. Mounted once in the masthead, which keeps <html> in sync. */
export function ThemeToggle() {
  const [theme, setTheme] = useTheme()
  const Icon = ICON[theme]
  const label = `Theme: ${LABEL[theme]}. Switch to ${LABEL[NEXT[theme]].toLowerCase()}`

  return (
    <Button variant="quiet" size="icon" onClick={() => setTheme(NEXT[theme])} aria-label={label} title={label}>
      <Icon className="size-4" aria-hidden />
    </Button>
  )
}
