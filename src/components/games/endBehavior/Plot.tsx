import { useId, type KeyboardEvent } from 'react'
import type { Poly } from '../../../types/endBehavior'
import { AXIS, ROOT_RANGE, curvePoints, formatNumber } from '../../../utils/endBehavior'
import { cx } from '../../../utils/cx'

const PAD = 0.7
const LINES = Array.from({ length: 2 * AXIS + 1 }, (_, i) => i - AXIS)
const SLOTS = Array.from({ length: 2 * ROOT_RANGE + 1 }, (_, i) => i - ROOT_RANGE)
const LABELS = LINES.filter((n) => n !== 0 && n % 2 === 0)

interface PlotProps {
  label: string
  poly: Poly | null
  /** Dashed model answer. */
  ghost?: Poly
  /** Clickable x-axis slots. */
  onSlot?: (x: number) => void
}

function path(poly: Poly): string {
  return curvePoints(poly)
    .map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(3)} ${(-y).toFixed(3)}`)
    .join('')
}

export function Plot({ label, poly, ghost, onSlot }: PlotProps) {
  const arrow = useId()
  const ghostArrow = useId()
  const hasCurve = poly !== null && poly.roots.length > 0

  function slotKey(event: KeyboardEvent, x: number) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onSlot?.(x)
  }

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`${-AXIS - PAD} ${-AXIS - PAD} ${2 * (AXIS + PAD)} ${2 * (AXIS + PAD)}`}
      className="block aspect-square w-full border border-line-strong bg-surface select-none"
    >
      <defs>
        <Arrowhead id={arrow} className="fill-accent" />
        <Arrowhead id={ghostArrow} className="fill-fg-3" />
      </defs>

      {LINES.map((n) => (
        <g key={n} className={n === 0 ? 'stroke-fg-2' : 'stroke-line'}>
          <line x1={n} x2={n} y1={-AXIS} y2={AXIS} vectorEffect="non-scaling-stroke" strokeWidth={n === 0 ? 1.5 : 1} />
          <line y1={n} y2={n} x1={-AXIS} x2={AXIS} vectorEffect="non-scaling-stroke" strokeWidth={n === 0 ? 1.5 : 1} />
        </g>
      ))}

      <g className="fill-fg-3 font-mono" fontSize={0.42}>
        {LABELS.map((n) => (
          <g key={n}>
            <text x={n} y={0.62} textAnchor="middle">
              {formatNumber(n)}
            </text>
            <text x={-0.22} y={-n + 0.15} textAnchor="end">
              {formatNumber(n)}
            </text>
          </g>
        ))}
      </g>

      {ghost && (
        <path
          d={path(ghost)}
          fill="none"
          className="stroke-fg-3"
          strokeWidth={2}
          strokeDasharray="6 5"
          vectorEffect="non-scaling-stroke"
          markerStart={`url(#${ghostArrow})`}
          markerEnd={`url(#${ghostArrow})`}
        />
      )}

      {hasCurve && (
        <path
          d={path(poly)}
          fill="none"
          className="stroke-accent"
          strokeWidth={3}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          markerStart={`url(#${arrow})`}
          markerEnd={`url(#${arrow})`}
        />
      )}

      {poly?.roots.map((root) => (
        <circle
          key={root.x}
          cx={root.x}
          cy={0}
          r={0.2}
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          className={cx('stroke-accent', root.bounce ? 'fill-surface' : 'fill-accent')}
        />
      ))}

      {onSlot &&
        SLOTS.map((x) => {
          const root = poly?.roots.find((r) => r.x === x)
          const state = root ? (root.bounce ? 'bounces' : 'crosses') : 'empty'
          return (
            <rect
              key={x}
              role="button"
              tabIndex={0}
              aria-label={`x = ${formatNumber(x)}, ${state}`}
              x={x - 0.45}
              y={-0.45}
              width={0.9}
              height={0.9}
              onClick={() => onSlot(x)}
              onKeyDown={(event) => slotKey(event, x)}
              className="cursor-pointer fill-transparent stroke-transparent outline-none hover:fill-accent-soft hover:stroke-accent-line focus-visible:stroke-accent"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          )
        })}
    </svg>
  )
}

function Arrowhead({ id, className }: { id: string; className: string }) {
  return (
    <marker
      id={id}
      viewBox="0 0 10 10"
      refX={5}
      refY={5}
      markerWidth={0.6}
      markerHeight={0.6}
      markerUnits="userSpaceOnUse"
      orient="auto-start-reverse"
    >
      <path d="M0 0L10 5L0 10z" className={className} />
    </marker>
  )
}
