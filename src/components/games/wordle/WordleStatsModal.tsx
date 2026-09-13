import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { useNow } from '../../../hooks/useNow'
import type { WordleMode, WordleRecord, WordleStats } from '../../../types/wordle'
import { cx } from '../../../utils/cx'
import { msUntilNextDay } from '../../../utils/daily'
import { copyText } from '../../../utils/share'
import { formatClock } from '../../../utils/time'
import { MAX_GUESSES, gameStatus, scoreGuesses, shareGrid, visibleStreak, winRate } from '../../../utils/wordle'
import { Button } from '../../common/Button'
import { Modal } from '../../common/Modal'
import { Stats } from '../../common/Stats'

interface WordleStatsModalProps {
  open: boolean
  onClose: () => void
  stats: WordleStats
  mode: WordleMode
  today: number
  record: WordleRecord | null
  shareTitle: string
  onNewWord?: () => void
}

export function WordleStatsModal({ open, onClose, stats, mode, today, record, shareTitle, onNewWord }: WordleStatsModalProps) {
  const rows = record ? scoreGuesses(record.guesses, record.answer) : []
  const status = gameStatus(rows)
  const finished = !!record && status !== 'playing'

  const footer =
    finished || mode === 'daily' ? (
      <>
        {finished && record && <ShareButton text={shareGrid(rows, shareTitle, status === 'won', record.hard)} />}
        {mode === 'daily' ? open && <Countdown /> : onNewWord && <Button onClick={onNewWord}>New word</Button>}
      </>
    ) : undefined

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={status === 'won' ? 'Solved' : status === 'lost' ? 'Out of guesses' : 'Statistics'}
      footer={footer}
    >
      {finished && record && (
        <div className="flex flex-col gap-s1">
          <p className="text-base text-fg-2">
            {status === 'won' ? `Solved in ${rows.length} of ${MAX_GUESSES}. ` : ''}The word was
          </p>
          <p className="flex flex-wrap items-baseline gap-x-s4 gap-y-s1">
            <span className="text-2xl font-bold tracking-[.18em]">{record.answer}</span>
            <a
              className="text-base text-accent underline"
              href={`https://en.wiktionary.org/wiki/${record.answer.toLowerCase()}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Definition<span className="wb-visually-hidden"> of {record.answer} (opens in a new tab)</span>
            </a>
          </p>
        </div>
      )}

      <Stats
        items={[
          { label: 'Played', value: stats.played },
          { label: 'Win %', value: winRate(stats) },
          { label: 'Streak', value: visibleStreak(stats, mode === 'daily' ? today : undefined) },
          { label: 'Best', value: stats.bestStreak },
        ]}
      />

      <section aria-labelledby="distribution-heading" className="flex flex-col gap-s2">
        <h3 id="distribution-heading" className="wb-eyebrow">
          Guess distribution{mode === 'daily' ? ', daily' : ', unlimited'}
        </h3>
        <Distribution counts={stats.distribution} highlight={status === 'won' ? rows.length : null} />
      </section>
    </Modal>
  )
}

function Distribution({ counts, highlight }: { counts: number[]; highlight: number | null }) {
  const max = Math.max(1, ...counts)
  return (
    <ol className="flex flex-col gap-1">
      {counts.map((count, i) => (
        <li key={i} className="flex items-center gap-s2 font-mono text-sm">
          <span className="w-3 text-fg-2">{i + 1}</span>
          <span className="flex-1">
            <span
              className={cx(
                'flex h-5 min-w-7 items-center justify-end px-1.5 font-medium tabular-nums',
                highlight === i + 1 ? 'bg-accent text-accent-on' : 'bg-fg-3 text-bg',
              )}
              style={{ width: `${(count / max) * 100}%` }}
            >
              {count}
            </span>
          </span>
        </li>
      ))}
    </ol>
  )
}

function ShareButton({ text }: { text: string }) {
  const [result, setResult] = useState<'copied' | 'failed' | null>(null)

  async function share() {
    setResult((await copyText(text)) ? 'copied' : 'failed')
    window.setTimeout(() => setResult(null), 2000)
  }

  return (
    <Button variant="primary" onClick={share}>
      <Share2 className="size-4" aria-hidden />
      {result === 'copied' ? 'Copied to clipboard' : result === 'failed' ? 'Copy failed' : 'Share result'}
    </Button>
  )
}

function Countdown() {
  const now = useNow(1000)
  return (
    <p className="ml-auto self-center text-sm text-fg-2">
      Next word in <span className="font-mono tabular-nums">{formatClock(msUntilNextDay(new Date(now)) / 1000)}</span>
    </p>
  )
}
