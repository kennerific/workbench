import { Timer } from 'lucide-react'
import { formatClock } from '../../../utils/time'

export function CrosswordTimer({ seconds, stopped }: { seconds: number; stopped: boolean }) {
  return (
    <p className="flex items-center gap-1.5 font-mono text-lg tabular-nums" title={stopped ? 'Finished' : 'Pauses when you leave the tab'}>
      <Timer className="size-4 text-fg-3" aria-hidden />
      <span className="wb-visually-hidden">Time </span>
      {formatClock(seconds)}
    </p>
  )
}
