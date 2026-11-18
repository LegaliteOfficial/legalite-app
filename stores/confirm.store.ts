import type { ReactNode } from 'react'
import { create } from 'zustand'

/**
 * In-app replacement for window.confirm / window.prompt. One request at a
 * time is shown by <ConfirmHost/> (mounted once in the dashboard layout).
 *
 *   if (!(await confirmAction({ title: 'Delete this task?', tone: 'danger' }))) return
 *
 * Pass `onConfirm` to run the action inside the dialog: it stays open with
 * a spinner while the promise runs, shows a brief success tick, then
 * closes. A thrown error keeps it open with the message so the user can
 * retry or cancel.
 */

export type ConfirmTone = 'danger' | 'warning' | 'default'

interface BaseOptions {
  title: string
  description?: ReactNode
  /** Short consequence lines rendered as a checklist ("3 documents are unlinked"). */
  details?: string[]
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmTone
  /** Shown on the tick after onConfirm succeeds. */
  successLabel?: string
}

export interface ConfirmOptions extends BaseOptions {
  /** High-impact actions: the user must type this exact text to enable the button. */
  requireText?: string
  onConfirm?: () => Promise<unknown> | unknown
}

export interface PromptOptions extends BaseOptions {
  inputLabel?: string
  placeholder?: string
  defaultValue?: string
  inputType?: 'text' | 'url' | 'email'
  /** Return an error message to block submission. */
  validate?: (value: string) => string | null
  onConfirm?: (value: string) => Promise<unknown> | unknown
}

export type ConfirmRequest =
  | ({ kind: 'confirm'; id: number; resolve: (ok: boolean) => void } & ConfirmOptions)
  | ({ kind: 'prompt'; id: number; resolve: (value: string | null) => void } & PromptOptions)

interface ConfirmStore {
  request: ConfirmRequest | null
  open: boolean
  show: (req: ConfirmRequest) => void
  /** Closes the dialog; the request stays so the exit animation has content. */
  close: () => void
}

export const useConfirmStore = create<ConfirmStore>((set, get) => ({
  request: null,
  open: false,
  show: (req) => {
    // A new request supersedes one still open: that one counts as cancelled.
    const prev = get().request
    if (prev && get().open) {
      if (prev.kind === 'confirm') prev.resolve(false)
      else prev.resolve(null)
    }
    set({ request: req, open: true })
  },
  close: () => set({ open: false }),
}))

let nextId = 1

export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    useConfirmStore.getState().show({ ...options, kind: 'confirm', id: nextId++, resolve })
  })
}

export function promptText(options: PromptOptions): Promise<string | null> {
  return new Promise((resolve) => {
    useConfirmStore.getState().show({ ...options, kind: 'prompt', id: nextId++, resolve })
  })
}
