import { useState } from 'react'
import { useKeyboard } from '../../../hooks/useKeyboard'
import type { ClassKey, End, Poly } from '../../../types/endBehavior'
import {
  CLASS_KEYS,
  classKey,
  classOf,
  describeClass,
  endsOf,
  formatPoly,
  parseClassKey,
  randomPoly,
} from '../../../utils/endBehavior'
import { cx } from '../../../utils/cx'
import { Button } from '../../common/Button'
import { Note } from '../../common/Note'
import { Segmented } from '../../common/Segmented'
import { Plot } from './Plot'

type Pick = End | ''

const LIMITS = [
  { value: 'up', label: '+∞' },
  { value: 'down', label: '−∞' },
] as const

const limitText = (end: End) => (end === 'up' ? '+∞' : '−∞')

interface RoundProps {
  onAnswer: (key: ClassKey, correct: boolean) => void
  onNext: () => void
}

export function IdentifyRound({ onAnswer, onNext }: RoundProps) {
  const [poly] = useState<Poly>(() => randomPoly())
  const [pick, setPick] = useState<ClassKey | null>(null)
  const [right, setRight] = useState<Pick>('')
  const [left, setLeft] = useState<Pick>('')
  const [checked, setChecked] = useState(false)

  const answer = classOf(poly)
  const key = classKey(answer)
  const ends = endsOf(answer)
  const ready = pick !== null && right !== '' && left !== ''
  const classOk = pick === key
  const endsOk = right === ends.right && left === ends.left

  function check() {
    if (!ready || checked) return
    setChecked(true)
    onAnswer(key, classOk && endsOk)
  }

  useKeyboard((k, event) => {
    const index = Number(k) - 1
    if (!checked && index >= 0 && index < CLASS_KEYS.length) setPick(CLASS_KEYS[index])
    else if (k === 'Enter') (checked ? onNext : check)()
    else return
    event.preventDefault()
  })

  return (
    <div className="grid gap-s5 md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] md:items-start">
      <Plot label="A polynomial graph. Classify its end behavior." poly={poly} />

      <div className="flex flex-col gap-s4">
        <fieldset className="flex flex-col gap-s2">
          <legend className="mb-s2 text-md">Which class is it?</legend>
          <div className="grid grid-cols-2 gap-s2">
            {CLASS_KEYS.map((option, i) => (
              <button
                key={option}
                type="button"
                aria-pressed={pick === option}
                disabled={checked}
                onClick={() => setPick(option)}
                className={cx(
                  'flex items-center gap-s2 border px-s3 py-s3 text-left text-base capitalize transition-colors duration-(--dur-1) disabled:cursor-default',
                  classStyle(option, pick, checked ? key : null),
                )}
              >
                <span className="font-mono text-xs opacity-70">{i + 1}</span>
                {describeClass(parseClassKey(option))}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-s3" disabled={checked}>
          <legend className="mb-s2 text-md">Finish the limits</legend>
          <LimitRow lead="As x → +∞, f(x) →" value={right} onChange={setRight} />
          <LimitRow lead="As x → −∞, f(x) →" value={left} onChange={setLeft} />
        </fieldset>

        {checked ? (
          <Note tone={classOk && endsOk ? 'ok' : 'danger'}>
            <div className="flex flex-col gap-s1">
              <span className="font-semibold">
                {classOk && endsOk ? 'Correct.' : `It is ${describeClass(answer)}.`}
              </span>
              <span>
                As x → +∞, f(x) → {limitText(ends.right)}; as x → −∞, f(x) → {limitText(ends.left)}.
              </span>
              <span className="font-mono text-sm">{formatPoly(poly)}</span>
            </div>
            <Button size="sm" variant="primary" className="ml-auto" onClick={onNext}>
              Next graph
            </Button>
          </Note>
        ) : (
          <Button variant="primary" disabled={!ready} onClick={check} className="self-start">
            Check
          </Button>
        )}
      </div>
    </div>
  )
}

function classStyle(option: ClassKey, pick: ClassKey | null, answer: ClassKey | null): string {
  if (answer !== null && option === answer) return 'border-ok bg-ok-soft text-fg'
  if (answer !== null && option === pick) return 'border-danger bg-danger-soft text-fg'
  if (option === pick) return 'border-accent bg-accent text-accent-on'
  return 'border-line-strong bg-surface text-fg hover:bg-surface-2'
}

function LimitRow({ lead, value, onChange }: { lead: string; value: Pick; onChange: (end: End) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-s3">
      <span className="min-w-[11rem] font-mono text-base">{lead}</span>
      <Segmented<Pick> label={lead} options={LIMITS} value={value} onChange={(end) => end !== '' && onChange(end)} />
    </div>
  )
}
