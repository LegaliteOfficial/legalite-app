'use client'

/**
 * EventDuePrompt
 * --------------
 * The floating "Did this event take place?" card. Anchored to the
 * top-right of the viewport, portaled to `document.body` so it lives
 * above every route.
 *
 * Renders NOTHING when the queue is empty — the null-render guard is
 * the first hook consumer, so the component tree doesn't even mount
 * when there's nothing to ask. This keeps the layout-level Boot cheap
 * during normal navigation.
 *
 * Step forms (Completion / Reschedule / Cancel) are dynamically
 * imported so their forms + Zod validation don't ship in the initial
 * bundle for the ~99% of app-opens with no pending events.
 */

import dynamic from 'next/dynamic'
import { useCallback } from 'react'
import { CalendarBlank, X } from '@phosphor-icons/react'
import { useDueEventMutations, useDueEventsBoot } from '@/hooks/use-due-events'
import {
  useCurrentDueEvent,
  useDueEventsStore,
} from '@/stores/due-events.store'
import { PromptStep } from './PromptStep'

const CompletionStep = dynamic(
  () => import('./CompletionStep').then((m) => m.CompletionStep),
  { ssr: false },
)
const RescheduleStep = dynamic(
  () => import('./RescheduleStep').then((m) => m.RescheduleStep),
  { ssr: false },
)
const CancelStep = dynamic(
  () => import('./CancelStep').then((m) => m.CancelStep),
  { ssr: false },
)

export function EventDuePrompt() {
  // Boot owns the network policy. Kept at this level (not the layout
  // provider) so the polling hooks tear down when the user signs out
  // and the AuthGuard unmounts the tree.
  const { refetch } = useDueEventsBoot()
  const currentEvent = useCurrentDueEvent()
  const step = useDueEventsStore((s) => s.step)
  const setStep = useDueEventsStore((s) => s.setStep)
  const mutations = useDueEventMutations(refetch)

  const handleDismissClose = useCallback(() => {
    if (!currentEvent) return
    // "Not now" close — record as 'dismissed' server-side so the
    // prompt doesn't reappear on the next fetch.
    void mutations.acknowledge(currentEvent, {
      event_id: currentEvent.id,
      response: 'dismissed',
    })
  }, [currentEvent, mutations])

  if (!currentEvent) return null

  return (
    <div
      // Anchored top-right, portaled visually. Not using a full Dialog
      // primitive because we deliberately DON'T want a backdrop / focus
      // trap — the prompt should be non-blocking so navigation still
      // works underneath.
      className="fixed top-4 right-4 z-[70] w-[380px] max-w-[calc(100vw-2rem)]"
      role="dialog"
      aria-live="polite"
      aria-label="Event due prompt"
      style={{
        animation: 'due-slide-in 220ms cubic-bezier(0.16, 1, 0.3, 1) both',
      }}
    >
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--border-default)',
          boxShadow:
            '0 20px 40px -12px rgba(13,27,42,0.24), 0 4px 12px -4px rgba(13,27,42,0.10)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between gap-3 px-5 py-3.5 border-b"
          style={{
            borderColor: 'var(--border-soft)',
            background:
              'linear-gradient(180deg, var(--accent-today-tint, rgba(201,151,43,0.06)) 0%, transparent 100%)',
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <CalendarBlank
              size={14}
              weight="duotone"
              style={{ color: 'var(--gold-dark)' }}
            />
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--gold-dark)' }}
            >
              Event Due
            </span>
          </div>
          <button
            type="button"
            onClick={handleDismissClose}
            aria-label="Close — ask me later"
            className="inline-flex items-center justify-center h-6 w-6 rounded-md transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = 'var(--surface-overlay)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = 'transparent')
            }
          >
            <X size={12} strokeWidth={2} />
          </button>
        </div>

        {/* Body — one step at a time. Only the ask step is eager; the
            three action forms are dynamically imported. */}
        {step === 'ask' && <PromptStep event={currentEvent} onStep={setStep} />}
        {step === 'completion' && (
          <CompletionStep event={currentEvent} mutations={mutations} onBack={() => setStep('ask')} />
        )}
        {step === 'reschedule' && (
          <RescheduleStep event={currentEvent} mutations={mutations} onBack={() => setStep('ask')} />
        )}
        {step === 'cancel' && (
          <CancelStep event={currentEvent} mutations={mutations} onBack={() => setStep('ask')} />
        )}
      </div>

      <style jsx global>{`
        @keyframes due-slide-in {
          from {
            opacity: 0;
            transform: translateX(16px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </div>
  )
}
