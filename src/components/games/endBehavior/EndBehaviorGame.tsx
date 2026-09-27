import { useState } from 'react'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import type { ClassKey, EndBehaviorStats, Mode, Tally } from '../../../types/endBehavior'
import {
  CLASS_KEYS,
  EMPTY_END_STATS,
  END_KEYS,
  accuracy,
  describeClass,
  parseClassKey,
  recordAnswer,
} from '../../../utils/endBehavior'
import { PageHeader } from '../../common/PageHeader'
import { Segmented } from '../../common/Segmented'
import { Stats } from '../../common/Stats'
import { GraphRound } from './GraphRound'
import { IdentifyRound } from './IdentifyRound'

const MODES = [
  { value: 'identify', label: 'Identify' },
  { value: 'graph', label: 'Graph it' },
] as const

const NOTES: Record<Mode, string> = {
  identify: 'Read where each end of the graph goes. Keys 1 to 4 pick a class, Enter checks.',
  graph: 'Build the polynomial the prompt describes on the grid. Enter checks.',
}

const percent = (tally: Tally) => (tally.answered ? `${accuracy(tally)}%` : '–')

export function EndBehaviorGame() {
  const [mode, setMode] = useLocalStorage<Mode>(END_KEYS.mode, 'identify')
  const [stats, setStats] = useLocalStorage<EndBehaviorStats>(END_KEYS.stats, EMPTY_END_STATS)
  const [round, setRound] = useState(0)

  const answer = (key: ClassKey, correct: boolean) => setStats((prev) => recordAnswer(prev, mode, key, correct))
  const next = () => setRound((n) => n + 1)
  const Round = mode === 'identify' ? IdentifyRound : GraphRound

  return (
    <>
      <PageHeader title="End Behavior" note={NOTES[mode]}>
        <Segmented label="Mode" options={MODES} value={mode} onChange={setMode} />
      </PageHeader>

      <Round key={`${mode}:${round}`} onAnswer={answer} onNext={next} />

      <section className="flex flex-col gap-s2">
        <h2 className="text-md">Progress</h2>
        <Stats
          items={[
            { label: 'Streak', value: stats.streak },
            { label: 'Best', value: stats.best },
            { label: 'Identify', value: percent(stats.modes.identify) },
            { label: 'Graph it', value: percent(stats.modes.graph) },
          ]}
        />
        <Stats
          items={CLASS_KEYS.map((key) => ({
            label: describeClass(parseClassKey(key)),
            value: percent(stats.classes[key]),
          }))}
        />
      </section>
    </>
  )
}
