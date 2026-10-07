'use client'

/**
 * Side panels for the Deadline engine. Each is self-contained: it reads
 * its own query and store slice and sits in its own Suspense boundary,
 * so a change to one never re-renders the others.
 */

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { ClipboardText, Bell, BellSlash } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAttentionItems, useAwaitingOutcome, useNow } from '@/hooks/use-attention-feed'
import { useDeadlines } from '@/hooks/use-deadlines'
import { useDueEventsStore } from '@/stores/due-events.store'
import { useDeadlineEngineStore } from '@/stores/deadline-engine.store'
import {
  checkAndNotifyDeadlines,
  disableNotifications,
  getNotificationPreference,
  isNotificationSupported,
  requestNotificationPermission,
} from '@/lib/notifications'
import { KIND_META, KIND_ORDER, agoLabel } from '../_lib/attention-meta'
import { PanelSkeleton } from './skeletons'

// ── Outcomes awaiting ────────────────────────────────────────────────────

/**
 * Past events the user attended but has not reported on. "Record" pushes
 * the event back onto the global Event Due queue, which re-opens the
 * standard outcome prompt mounted in the dashboard layout.
 */
export function OutcomePanel() {
  const { events, ready } = useAwaitingOutcome()
  const now = useNow()
  const restore = useDueEventsStore((s) => s.restore)
  if (!ready) return <PanelSkeleton rows={2} />
  if (events.length === 0) return null

  return (
    <Card padding="none" className="overflow-hidden">
      <div
        className="flex items-center gap-2.5 px-4 py-3.5"
        style={{ borderBottom: '1px solid var(--border-soft)' }}
      >
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: 'rgba(217,119,6,0.12)' }}
        >
          <ClipboardText size={15} weight="duotone" style={{ color: '#B4530A' }} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            Outcomes to record
          </p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Did these take place?
          </p>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold tabular-nums"
          style={{ background: 'rgba(217,119,6,0.12)', color: '#B4530A' }}
        >
          {events.length}
        </span>
      </div>
      <ul className="divide-y" style={{ borderColor: 'var(--border-soft)' }}>
        {events.slice(0, 5).map((e) => (
          <li key={e.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-medium" style={{ color: 'var(--text-primary)' }}>
                {e.title}
              </p>
              <p className="truncate text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Ended {agoLabel(new Date(e.end_time).getTime(), now)}
                {e.case_title && <> · {e.case_title}</>}
              </p>
            </div>
            <Button size="sm" variant="outline" className="h-7 rounded-full text-[11px]" onClick={() => restore(e)}>
              Record
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

// ── Load by source ───────────────────────────────────────────────────────

/**
 * Proportional bar + legend showing where the pressure is coming from.
 * Each legend row doubles as a filter toggle for the timeline.
 */
export function SourceBreakdown() {
  const { activeItems: items, ready } = useAttentionItems()
  const active = useDeadlineEngineStore((s) => s.kindFilter)
  const onToggle = useDeadlineEngineStore((s) => s.setKindFilter)
  if (!ready) return <PanelSkeleton rows={6} />

  const counts = KIND_ORDER.map((k) => ({
    kind: k,
    total: items.filter((i) => i.kind === k).length,
    overdue: items.filter((i) => i.kind === k && i.bucket === 'overdue').length,
  }))
  const total = items.length || 1

  return (
    <Card padding="md">
      <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
        By category
      </p>
      <div className="mt-3 flex h-2.5 overflow-hidden rounded-full" style={{ background: 'var(--surface-sunken)' }}>
        {counts.map(({ kind, total: n }) =>
          n ? (
            <div
              key={kind}
              style={{
                width: `${(n / total) * 100}%`,
                background: KIND_META[kind].color,
                opacity: active && active !== kind ? 0.25 : 1,
              }}
            />
          ) : null,
        )}
      </div>
      <ul className="mt-3 space-y-0.5">
        {counts.map(({ kind, total: n, overdue }) => {
          const meta = KIND_META[kind]
          const isActive = active === kind
          return (
            <li key={kind}>
              <button
                type="button"
                disabled={n === 0}
                onClick={() => onToggle(isActive ? null : kind)}
                aria-pressed={isActive}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[var(--surface-overlay)] disabled:cursor-default disabled:hover:bg-transparent"
                style={{ background: isActive ? meta.tint : undefined, opacity: n === 0 ? 0.45 : 1 }}
              >
                <meta.Icon size={14} weight="duotone" style={{ color: meta.color }} />
                <span className="flex-1 text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
                  {meta.plural}
                </span>
                {overdue > 0 && (
                  <span className="text-[10.5px] font-semibold" style={{ color: '#C0392B' }}>
                    {overdue} past due
                  </span>
                )}
                <span className="w-6 text-right text-[12.5px] font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {n}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

// ── Browser notifications ────────────────────────────────────────────────

const noopSubscribe = () => () => {}

/**
 * Browser alerts for pending deadlines. Owns its `deadlines` query and
 * the permission state; renders nothing until hydrated (the capability
 * check needs `window`, and SSR markup must match the first client pass).
 */
export function NotificationsCard() {
  const supported = useSyncExternalStore(noopSubscribe, isNotificationSupported, () => false)
  const [enabled, setEnabled] = useState(() => getNotificationPreference())
  const { data: deadlines } = useDeadlines('Pending')

  useEffect(() => {
    if (enabled && deadlines?.length) checkAndNotifyDeadlines(deadlines)
  }, [deadlines, enabled])

  const onToggle = useCallback(async () => {
    if (enabled) {
      disableNotifications()
      setEnabled(false)
      toast.success('Deadline notifications disabled.')
      return
    }
    const granted = await requestNotificationPermission()
    if (granted) {
      setEnabled(true)
      toast.success('Deadline notifications enabled.')
    } else {
      toast.error('Notification permission was denied. Enable it in your browser settings.')
    }
  }, [enabled])

  if (!supported) return null
  return (
    <Card padding="md" className="flex items-center gap-3">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: enabled ? 'var(--gold-muted)' : 'var(--surface-sunken)' }}
      >
        {enabled ? (
          <Bell size={15} weight="duotone" style={{ color: 'var(--gold-dark)' }} />
        ) : (
          <BellSlash size={15} style={{ color: 'var(--text-muted)' }} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          Desktop alerts
        </p>
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {enabled ? 'On for upcoming deadlines' : 'Off in this browser'}
        </p>
      </div>
      <Button size="sm" variant="outline" className="h-7 rounded-full text-[11px]" onClick={onToggle}>
        {enabled ? 'Turn off' : 'Turn on'}
      </Button>
    </Card>
  )
}
