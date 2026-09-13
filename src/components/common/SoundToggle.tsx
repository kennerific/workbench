import { Volume2, VolumeX } from 'lucide-react'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { Button } from './Button'

export const SOUND_KEY = 'sound'

export function SoundToggle() {
  const [on, setOn] = useLocalStorage(SOUND_KEY, true)
  const label = on ? 'Mute sound effects' : 'Turn sound effects on'

  return (
    <Button variant="quiet" size="icon" onClick={() => setOn(!on)} aria-label={label} title={label}>
      {on ? <Volume2 className="size-4" aria-hidden /> : <VolumeX className="size-4" aria-hidden />}
    </Button>
  )
}
