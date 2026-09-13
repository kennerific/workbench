import { useState, type ChangeEvent } from 'react'
import { Upload } from 'lucide-react'
import type { ConnectionsPuzzle } from '../../../types/connections'
import { MAX_CUSTOM_PUZZLES, normalizePuzzle, puzzleProblems } from '../../../utils/connections'
import { Button } from '../../common/Button'
import { buttonClass } from '../../common/buttonClass'
import { Modal } from '../../common/Modal'
import { Note } from '../../common/Note'

const EXAMPLE = JSON.stringify(
  {
    id: 'my-puzzle',
    title: 'My puzzle',
    groups: [
      { label: 'Shades of red', level: 0, words: ['CRIMSON', 'SCARLET', 'RUBY', 'MAROON'] },
      { label: 'Chess pieces', level: 1, words: ['KING', 'QUEEN', 'ROOK', 'BISHOP'] },
      { label: 'Rivers', level: 2, words: ['NILE', 'AMAZON', 'THAMES', 'DANUBE'] },
      { label: 'Fire___', level: 3, words: ['WORK', 'PLACE', 'FLY', 'MAN'] },
    ],
  },
  null,
  2,
)

interface PuzzleLoaderProps {
  open: boolean
  onClose: () => void
  onAdd: (puzzle: ConnectionsPuzzle) => void
  /** Ids of built-in puzzles, which a custom puzzle may not reuse. */
  reservedIds: ReadonlySet<string>
}

export function PuzzleLoader({ open, onClose, onAdd, reservedIds }: PuzzleLoaderProps) {
  const [text, setText] = useState('')
  const [problems, setProblems] = useState<string[]>([])

  function load(raw: string) {
    let value: unknown
    try {
      value = JSON.parse(raw)
    } catch {
      setProblems(['That is not valid JSON. Check for a missing quote, comma or bracket.'])
      return
    }

    const found = puzzleProblems(value)
    if (found.length === 0 && reservedIds.has((value as ConnectionsPuzzle).id.trim())) {
      found.push(`The id "${(value as ConnectionsPuzzle).id.trim()}" belongs to a built-in puzzle. Choose another.`)
    }
    setProblems(found)
    if (found.length > 0) return

    onAdd(normalizePuzzle(value as ConnectionsPuzzle))
    setText('')
    onClose()
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const raw = await file.text()
    setText(raw)
    load(raw)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Load your own puzzle"
      size="lg"
      footer={
        <>
          <Button variant="primary" onClick={() => load(text)} disabled={!text.trim()}>
            Add puzzle
          </Button>
          <label className={buttonClass('default', 'md', 'has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-accent')}>
            <Upload className="size-4" aria-hidden />
            Choose a file
            <input type="file" accept="application/json,.json" className="wb-visually-hidden" onChange={onFile} />
          </label>
        </>
      }
    >
      <p className="text-base text-fg-2">
        Paste a puzzle as JSON. It needs an id, a title and four groups. Each group has a label, a level from 0 (easiest) to 3
        (trickiest) and four words.
      </p>
      <label className="flex flex-col gap-s1">
        <span className="text-base text-fg">Puzzle JSON</span>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          spellCheck={false}
          rows={10}
          placeholder={EXAMPLE}
          className="min-h-48 w-full resize-y border border-line-strong bg-bg p-s3 font-mono text-sm placeholder:text-fg-3 focus-visible:border-accent"
        />
      </label>
      {problems.length > 0 && (
        <Note tone="danger">
          <ul className="flex list-disc flex-col gap-s1 pl-s4">
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </Note>
      )}
      <p className="text-sm text-fg-3">
        Up to {MAX_CUSTOM_PUZZLES} custom puzzles are kept in this browser. Loading one with the same id replaces it.
      </p>
    </Modal>
  )
}
