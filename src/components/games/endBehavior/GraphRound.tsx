import { useState } from 'react'
import { useKeyboard } from '../../../hooks/useKeyboard'
import { useToast } from '../../../hooks/useToast'
import type { ClassKey, GraphPrompt, Poly, Sign } from '../../../types/endBehavior'
import {
  MAX_DEGREE,
  classKey,
  degree,
  formatPoly,
  gradeGraph,
  modelAnswer,
  promptText,
  randomPrompt,
  toggleRoot,
} from '../../../utils/endBehavior'
import { Button } from '../../common/Button'
import { Note } from '../../common/Note'
import { Segmented } from '../../common/Segmented'
import { Plot } from './Plot'

const SIGNS = [
  { value: 'positive', label: 'Positive' },
  { value: 'negative', label: 'Negative' },
] as const

const SIGN_OF: Record<(typeof SIGNS)[number]['value'], Sign> = { positive: 1, negative: -1 }

const EMPTY: Poly = { sign: 1, roots: [] }

interface RoundProps {
  onAnswer: (key: ClassKey, correct: boolean) => void
  onNext: () => void
}

export function GraphRound({ onAnswer, onNext }: RoundProps) {
  const toast = useToast()
  const [prompt] = useState<GraphPrompt>(() => randomPrompt())
  const [built, setBuilt] = useState<Poly>(EMPTY)
  const [problems, setProblems] = useState<string[] | null>(null)

  const checked = problems !== null
  const correct = problems?.length === 0
  const deg = degree(built)

  function slot(x: number) {
    const next = toggleRoot(built, x)
    if (next) setBuilt(next)
    else toast.show(`Degree ${MAX_DEGREE} is the limit here. Remove a root first.`)
  }

  function check() {
    if (checked || deg === 0) return
    const found = gradeGraph(prompt, built)
    setProblems(found)
    onAnswer(classKey(prompt.target), found.length === 0)
  }

  useKeyboard((k, event) => {
    if (k !== 'Enter') return
    event.preventDefault()
    if (checked) onNext()
    else check()
  })

  return (
    <div className="flex flex-col gap-s4">
      <p className="text-lg">{promptText(prompt)}</p>
      <div className="grid gap-s5 md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] md:items-start">
        <Plot
          label="Your graph. Click a whole number on the x-axis to place an intercept."
          poly={built}
          ghost={checked && !correct ? modelAnswer(prompt) : undefined}
          onSlot={checked ? undefined : slot}
        />

        <div className="flex flex-col gap-s4">
          <p className="text-base text-fg-2">
            Click a whole number on the x-axis to place an intercept. Click it again to make it bounce off the axis
            (a double root), and a third time to remove it.
          </p>

          <div className="flex flex-wrap items-center gap-s3">
            <span className="min-w-[11rem] text-base">Leading coefficient</span>
            <Segmented
              label="Leading coefficient"
              options={SIGNS}
              value={built.sign === 1 ? 'positive' : 'negative'}
              onChange={(value) => !checked && setBuilt({ ...built, sign: SIGN_OF[value] })}
            />
          </div>

          <p className="font-mono text-base text-fg-2">
            Degree {deg}
            {deg > 0 && ` (${deg % 2 === 0 ? 'even' : 'odd'})`}
          </p>

          {checked ? (
            <Note tone={correct ? 'ok' : 'danger'}>
              <div className="flex flex-col gap-s1">
                <span className="font-semibold">{correct ? 'Correct.' : 'Not quite.'}</span>
                {problems.map((problem) => (
                  <span key={problem}>{problem}</span>
                ))}
                {!correct && (
                  <span>
                    One answer, dashed on the grid: <span className="font-mono text-sm">{formatPoly(modelAnswer(prompt))}</span>
                  </span>
                )}
              </div>
              <Button size="sm" variant="primary" className="ml-auto" onClick={onNext}>
                Next prompt
              </Button>
            </Note>
          ) : (
            <div className="flex gap-s2">
              <Button variant="primary" disabled={deg === 0} onClick={check}>
                Check
              </Button>
              <Button disabled={deg === 0} onClick={() => setBuilt({ ...EMPTY, sign: built.sign })}>
                Clear
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
