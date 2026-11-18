'use client'

/**
 * Animated confirmation / prompt dialog used everywhere instead of the
 * browser's window.confirm and window.prompt.
 *
 * - ConfirmDialogView: the presentational dialog. Owns its own phases
 *   (idle -> working -> done, or error) so callers can hand it an async
 *   action and let it show progress and the result.
 * - ConfirmHost: mounted once in the dashboard layout; renders whatever
 *   confirmAction() / promptText() from stores/confirm.store asked for.
 *
 * Motion: backdrop fades in with a blur, the card springs up, the icon
 * pulses two rings (and the danger icon gives a small shake), the content
 * staggers in, and success draws a tick. All of it is switched off for
 * prefers-reduced-motion (see .ll-confirm-* in globals.css).
 */

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { Info, PencilSimpleLine, Trash, WarningCircle, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/shared/Spinner'
import { cn } from '@/lib/utils'
import { useConfirmStore, type ConfirmTone } from '@/stores/confirm.store'

const TONES: Record<ConfirmTone, { fg: string; bg: string; ring: string; button: string; buttonHover: string }> = {
  danger: {
    fg: '#B42318',
    bg: 'rgba(217, 45, 32, 0.10)',
    ring: 'rgba(217, 45, 32, 0.35)',
    button: '#C4320A',
    buttonHover: '#A3260A',
  },
  warning: {
    fg: '#A07A1E',
    bg: 'rgba(201, 151, 43, 0.14)',
    ring: 'rgba(201, 151, 43, 0.4)',
    button: '#C9972B',
    buttonHover: '#A07A1E',
  },
  default: {
    fg: '#0D1B2A',
    bg: 'rgba(13, 27, 42, 0.07)',
    ring: 'rgba(13, 27, 42, 0.22)',
    button: '#0D1B2A',
    buttonHover: '#1B2D42',
  },
}

export interface ConfirmDialogViewProps {
  open: boolean
  /** Called when the user dismisses (Cancel, Escape, backdrop, close button). */
  onCancel: () => void
  /** Called after a successful confirm, once the success tick has shown. */
  onDone: (value?: string) => void
  title: string
  description?: ReactNode
  details?: string[]
  confirmLabel?: string
  cancelLabel?: string
  successLabel?: string
  tone?: ConfirmTone
  requireText?: string
  /** Turns the dialog into a single-field prompt. */
  prompt?: {
    label?: string
    placeholder?: string
    defaultValue?: string
    type?: 'text' | 'url' | 'email'
    validate?: (value: string) => string | null
  }
  /** Optional work to run before closing; keeps the dialog open while it runs. */
  action?: (value?: string) => Promise<unknown> | unknown
  onOpenChangeComplete?: (open: boolean) => void
}

type Phase = 'idle' | 'working' | 'done'

export function ConfirmDialogView({
  open,
  onCancel,
  onDone,
  title,
  description,
  details,
  confirmLabel,
  cancelLabel = 'Cancel',
  successLabel = 'Done',
  tone = 'default',
  requireText,
  prompt,
  action,
  onOpenChangeComplete,
}: ConfirmDialogViewProps) {
  const t = TONES[tone]
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [value, setValue] = useState(prompt?.defaultValue ?? '')
  const shakeRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const inputId = useId()
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (doneTimer.current) clearTimeout(doneTimer.current)
  }, [])

  const needsInput = Boolean(prompt || requireText)
  const typedOk = !requireText || value.trim() === requireText
  const busy = phase !== 'idle'

  const label = confirmLabel ?? (prompt ? 'Save' : tone === 'danger' ? 'Delete' : 'Confirm')
  const Icon = prompt ? PencilSimpleLine : tone === 'danger' ? Trash : tone === 'warning' ? WarningCircle : Info

  const fail = (message: string) => {
    setError(message)
    // Restart the shake without re-mounting the input (which would drop focus).
    const el = shakeRef.current
    if (el) {
      el.classList.remove('ll-confirm-shake')
      void el.offsetWidth
      el.classList.add('ll-confirm-shake')
    }
  }

  const submit = async () => {
    if (busy) return
    if (!typedOk) return fail(`Type "${requireText}" to confirm.`)
    const submitted = prompt ? value.trim() : undefined
    if (prompt) {
      const msg = prompt.validate?.(value.trim()) ?? null
      if (msg) return fail(msg)
    }
    setError(null)
    if (!action) {
      onDone(submitted)
      return
    }
    setPhase('working')
    try {
      await action(submitted)
      setPhase('done')
      doneTimer.current = setTimeout(() => onDone(submitted), 750)
    } catch (err) {
      setPhase('idle')
      fail(err instanceof Error && err.message ? err.message : 'Something went wrong. Please try again.')
    }
  }

  // Danger: focus Cancel so a stray Enter does not delete. Inputs take
  // focus when present; otherwise the confirm button.
  const initialFocus = needsInput ? inputRef : tone === 'danger' ? cancelRef : confirmRef

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next && phase !== 'working') onCancel()
      }}
      onOpenChangeComplete={onOpenChangeComplete}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="ll-confirm-backdrop" />
        <DialogPrimitive.Popup
          initialFocus={initialFocus}
          className="ll-confirm-popup"
          data-tone={tone}
          data-phase={phase}
          style={{ ['--ll-tone' as string]: t.fg, ['--ll-tone-bg' as string]: t.bg, ['--ll-tone-ring' as string]: t.ring }}
        >
          {/* Indeterminate progress while the action runs. */}
          <div className={cn('ll-confirm-progress', phase === 'working' && 'is-active')} aria-hidden />

          {phase !== 'working' && phase !== 'done' && (
            <DialogPrimitive.Close
              aria-label="Close"
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-black/5 hover:text-[var(--navy)]"
            >
              <X size={16} />
            </DialogPrimitive.Close>
          )}

          {phase === 'done' ? (
            <div className="flex flex-col items-center px-6 pb-8 pt-9 text-center" role="status" aria-live="polite">
              <svg className="ll-confirm-check" width="64" height="64" viewBox="0 0 64 64" aria-hidden>
                <circle cx="32" cy="32" r="30" fill="rgba(18,183,106,0.12)" />
                <path d="M20 33.5 L28.5 42 L45 24.5" fill="none" stroke="#12B76A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <DialogPrimitive.Title className="ll-confirm-rise mt-4 font-heading text-lg" style={{ color: 'var(--navy)' }}>
                {successLabel}
              </DialogPrimitive.Title>
            </div>
          ) : (
            <form
              className="ll-confirm-body px-6 pb-5 pt-7"
              onSubmit={(e) => {
                e.preventDefault()
                void submit()
              }}
            >
              <div className="flex items-start gap-4">
                <span className="ll-confirm-icon" aria-hidden>
                  <Icon size={22} weight="duotone" />
                </span>
                <div className="min-w-0 flex-1 pr-6">
                  <DialogPrimitive.Title className="ll-confirm-rise font-heading text-[19px] leading-snug" style={{ color: 'var(--navy)' }}>
                    {title}
                  </DialogPrimitive.Title>
                  {description && (
                    <DialogPrimitive.Description
                      render={<div />}
                      className="ll-confirm-rise mt-1.5 text-[13.5px] leading-relaxed"
                      style={{ color: '#4B5563', animationDelay: '60ms' }}
                    >
                      {description}
                    </DialogPrimitive.Description>
                  )}
                </div>
              </div>

              {details && details.length > 0 && (
                <ul
                  className="ll-confirm-rise mt-4 space-y-1.5 rounded-xl border px-3.5 py-3 text-[13px]"
                  style={{ borderColor: 'var(--border-soft)', background: 'rgba(13,27,42,0.025)', animationDelay: '110ms' }}
                >
                  {details.map((d) => (
                    <li key={d} className="flex items-start gap-2" style={{ color: '#374151' }}>
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: t.fg }} />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              )}

              {needsInput && (
                <div ref={shakeRef} className="ll-confirm-rise mt-4" style={{ animationDelay: '150ms' }}>
                  <label htmlFor={inputId} className="mb-1.5 block text-[12.5px] font-medium" style={{ color: '#374151' }}>
                    {requireText ? (
                      <>
                        Type <span className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[12px]" style={{ color: 'var(--navy)' }}>{requireText}</span> to confirm
                      </>
                    ) : (
                      prompt?.label ?? 'Value'
                    )}
                  </label>
                  <Input
                    ref={inputRef}
                    id={inputId}
                    type={prompt?.type ?? 'text'}
                    value={value}
                    placeholder={prompt?.placeholder ?? (requireText ? requireText : undefined)}
                    autoComplete="off"
                    spellCheck={false}
                    disabled={busy}
                    aria-invalid={Boolean(error) || undefined}
                    onChange={(e) => {
                      setValue(e.target.value)
                      if (error) setError(null)
                    }}
                    className="h-10 rounded-xl text-[14px]"
                  />
                </div>
              )}

              {error && (
                <p role="alert" className="ll-confirm-rise mt-2.5 text-[12.5px] font-medium" style={{ color: '#B42318' }}>
                  {error}
                </p>
              )}

              <div className="ll-confirm-rise mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end" style={{ animationDelay: '190ms' }}>
                <Button
                  ref={cancelRef}
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={onCancel}
                  className="h-10 rounded-xl px-4"
                >
                  {cancelLabel}
                </Button>
                <Button
                  ref={confirmRef}
                  type="submit"
                  disabled={busy || (Boolean(requireText) && !typedOk)}
                  className="ll-confirm-cta h-10 min-w-[112px] rounded-xl px-4 font-semibold text-white"
                  style={{ ['--cta' as string]: t.button, ['--cta-hover' as string]: t.buttonHover }}
                >
                  {phase === 'working' ? (
                    <>
                      <Spinner size={15} /> Working...
                    </>
                  ) : (
                    label
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/** Renders requests from confirmAction() / promptText(). Mount once. */
export function ConfirmHost() {
  const request = useConfirmStore((s) => s.request)
  const open = useConfirmStore((s) => s.open)
  const close = useConfirmStore((s) => s.close)
  if (!request) return null

  const cancel = () => {
    if (request.kind === 'confirm') request.resolve(false)
    else request.resolve(null)
    close()
  }
  const done = (value?: string) => {
    if (request.kind === 'confirm') request.resolve(true)
    else request.resolve(value ?? '')
    close()
  }

  return (
    <ConfirmDialogView
      key={request.id}
      open={open}
      onCancel={cancel}
      onDone={done}
      title={request.title}
      description={request.description}
      details={request.details}
      confirmLabel={request.confirmLabel}
      cancelLabel={request.cancelLabel}
      successLabel={request.successLabel}
      tone={request.tone}
      requireText={request.kind === 'confirm' ? request.requireText : undefined}
      prompt={
        request.kind === 'prompt'
          ? {
              label: request.inputLabel,
              placeholder: request.placeholder,
              defaultValue: request.defaultValue,
              type: request.inputType,
              validate: request.validate,
            }
          : undefined
      }
      action={
        request.onConfirm
          ? (value?: string) =>
              request.kind === 'prompt' ? request.onConfirm?.(value ?? '') : request.onConfirm?.()
          : undefined
      }
    />
  )
}
