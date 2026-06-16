'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check,
  MagnifyingGlass,
  ShieldWarning,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  useConflictChecks,
  useConflictSearch,
  useRecordConflictCheck,
} from '@/hooks/use-conflicts'
import { TYPE_BADGE_PEOPLE } from '../_constants'

/**
 * Conflict-check tab — searches contacts + matters (incl. opposing
 * parties) for name collisions, and lets the firm record the run for
 * audit history. Past runs render below the search box.
 *
 * Lives on the Contacts page (not its own route) because the firm-side
 * mental model is "before opening a contact / matter, run a conflict
 * check" — co-locating reduces context-switching.
 */
const KIND_META: Record<string, { label: string; color: string }> = {
  contact: { label: 'Contact', color: TYPE_BADGE_PEOPLE },
  opposing_party: { label: 'Opposing party', color: '#C0392B' },
  case: { label: 'Matter', color: '#8B5CF6' },
}

export function ConflictsPanel() {
  const router = useRouter()
  const { run, matches, isLoading } = useConflictSearch()
  const recordCheck = useRecordConflictCheck()
  const { data: history } = useConflictChecks()
  const [query, setQuery] = useState('')
  const [searched, setSearched] = useState(false)

  const doSearch = () => {
    const q = query.trim()
    if (!q) return
    run(q)
    setSearched(true)
  }

  const doRecord = async () => {
    const q = query.trim()
    if (!q) return
    try {
      await recordCheck.mutateAsync(q)
      toast.success('Conflict check recorded.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not record check.')
    }
  }

  return (
    <div className="mt-6 space-y-5 max-w-3xl">
      <div
        className="rounded-2xl border p-5"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--border-soft)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <ShieldWarning
            size={16}
            strokeWidth={1.75}
            style={{ color: 'var(--gold-dark)' }}
          />
          <h3
            className="text-[14px] font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Run a conflict check
          </h3>
        </div>
        <p
          className="text-[12.5px] mb-3"
          style={{ color: 'var(--text-muted)' }}
        >
          Search existing contacts and matters (including opposing parties)
          before opening a new matter.
        </p>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 h-10 px-3 rounded-lg border flex-1"
            style={{
              borderColor: 'var(--border-default)',
              background: 'var(--surface-card)',
            }}
          >
            <MagnifyingGlass
              size={15}
              strokeWidth={1.75}
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  doSearch()
                }
              }}
              placeholder="Name of person, company, or opposing party…"
              className="flex-1 bg-transparent outline-none text-[13px]"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
          <Button onClick={doSearch} disabled={!query.trim() || isLoading}>
            {isLoading ? 'Searching…' : 'Check'}
          </Button>
          {searched && (
            <Button
              variant="outline"
              onClick={doRecord}
              disabled={recordCheck.isPending}
            >
              {recordCheck.isPending ? 'Saving…' : 'Record'}
            </Button>
          )}
        </div>

        {searched && !isLoading && (
          <div className="mt-4">
            {matches.length === 0 ? (
              <div
                className="rounded-xl border px-4 py-4 flex items-center gap-2 text-[13px]"
                style={{
                  borderColor: 'var(--border-soft)',
                  background: 'rgba(34,197,94,0.06)',
                  color: '#16A34A',
                }}
              >
                <Check size={15} strokeWidth={2} />
                No conflicts found for “{query.trim()}”.
              </div>
            ) : (
              <ul
                className="rounded-xl border divide-y overflow-hidden"
                style={{ borderColor: 'var(--border-soft)' }}
              >
                {matches.map((m, i) => {
                  const meta = KIND_META[m.kind] ?? KIND_META.contact
                  return (
                    <li
                      key={`${m.kind}-${m.ref_id}-${i}`}
                      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-[var(--surface-overlay)]"
                      style={{ borderColor: 'var(--border-soft)' }}
                      onClick={() =>
                        router.push(
                          m.kind === 'case'
                            ? `/cases/${m.ref_id}`
                            : `/contacts/${m.ref_id}`,
                        )
                      }
                    >
                      <span
                        className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold shrink-0"
                        style={{
                          background: `${meta.color}1F`,
                          color: meta.color,
                        }}
                      >
                        {meta.label}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div
                          className="text-[13px] font-medium truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {m.label}
                        </div>
                        {m.sublabel && (
                          <div
                            className="text-[11.5px] truncate"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {m.sublabel}
                          </div>
                        )}
                      </div>
                      <span
                        className="text-[11px] shrink-0"
                        style={{ color: 'var(--text-subtle)' }}
                      >
                        matched {m.match_field}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div>
          <h4
            className="text-[12px] font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--text-muted)' }}
          >
            Recent checks
          </h4>
          <ul
            className="rounded-xl border divide-y overflow-hidden"
            style={{
              borderColor: 'var(--border-soft)',
              background: 'var(--surface-card)',
            }}
          >
            {history.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5"
                style={{ borderColor: 'var(--border-soft)' }}
              >
                <div className="min-w-0">
                  <div
                    className="text-[13px] font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {h.query}
                  </div>
                  <div
                    className="text-[11.5px]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {h.run_by_name ? `${h.run_by_name} · ` : ''}
                    {new Date(h.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0"
                  style={
                    h.match_count > 0
                      ? {
                          background: 'rgba(192,57,43,0.10)',
                          color: '#C0392B',
                        }
                      : {
                          background: 'rgba(34,197,94,0.10)',
                          color: '#16A34A',
                        }
                  }
                >
                  {h.match_count}{' '}
                  {h.match_count === 1 ? 'match' : 'matches'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
