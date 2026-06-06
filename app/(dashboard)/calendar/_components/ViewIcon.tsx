'use client'

import type { ViewMode } from '../_types'

/**
 * 14×14 inline-SVG icon used by the view-mode dropdown (trigger + each
 * menu item).
 *   - Day        → a single tall pane
 *   - Work week  → 5 vertical bars
 *   - Week       → 7 vertical bars
 *   - Month      → a 3-row × 4-col dot matrix
 */
export function ViewIcon({ mode }: { mode: ViewMode }) {
  if (mode === 'Month') return <MonthIcon />
  // Column counts per non-month view — drives bar widths.
  const cols = mode === 'Day' ? 1 : mode === 'Work week' ? 5 : 7
  const gap = 1
  const pad = 1
  const innerWidth = 14 - pad * 2
  const totalGap = gap * (cols - 1)
  const barWidth = (innerWidth - totalGap) / cols
  return (
    <span className="inline-flex items-center justify-center h-4 w-4 shrink-0" aria-hidden>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1" y="2.5" width="12" height="9" rx="1" stroke="currentColor" strokeWidth="1.4" />
        {Array.from({ length: cols }, (_, i) => (
          <rect
            key={i}
            x={pad + i * (barWidth + gap)}
            y={4.5}
            width={barWidth}
            height={5}
            fill="currentColor"
            opacity={0.35}
          />
        ))}
      </svg>
    </span>
  )
}

function MonthIcon() {
  const cols = 4
  const rows = 3
  const cellW = 2
  const cellH = 2
  const gapX = 1
  const gapY = 1
  const startX = (14 - (cols * cellW + (cols - 1) * gapX)) / 2
  const startY = (14 - (rows * cellH + (rows - 1) * gapY)) / 2
  return (
    <span className="inline-flex items-center justify-center h-4 w-4 shrink-0" aria-hidden>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1" y="2.5" width="12" height="9" rx="1" stroke="currentColor" strokeWidth="1.4" />
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => (
            <rect
              key={`${r}-${c}`}
              x={startX + c * (cellW + gapX)}
              y={startY + r * (cellH + gapY)}
              width={cellW}
              height={cellH}
              fill="currentColor"
              opacity={0.45}
              rx={0.5}
            />
          )),
        )}
      </svg>
    </span>
  )
}
