'use client'

/**
 * Autosave for the studio. Watches the document's editable fields and
 * saves only the ones that changed, shortly after the user stops typing.
 *
 * - Debounced (DELAY_MS) so a burst of keystrokes is one request.
 * - One request in flight at a time; edits made meanwhile are saved
 *   right after it returns, so the last edit always lands.
 * - Only changed fields are sent: re-sending case_id on every keystroke
 *   would make the backend re-file the document each time.
 * - Warns before the tab closes while anything is unsaved.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAutosaveDocument } from '@/hooks/use-documents'
import type { DocumentStatus } from '@/lib/documents/status'

const DELAY_MS = 1200

export interface SavedFields {
  title: string
  content: string
  design: Record<string, unknown>
  case_id: string
  status: DocumentStatus
}

export type SaveState = 'saved' | 'pending' | 'saving' | 'error'

function serialise(v: unknown): string {
  return JSON.stringify(v)
}

export function useAutosave(docId: string, fields: SavedFields) {
  const save = useAutosaveDocument()
  const [state, setState] = useState<SaveState>('saved')
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)

  // What the server has, field by field (serialised for cheap comparison).
  // The first render's values are what was loaded: that is the baseline.
  const [baseline] = useState(() => ({
    title: serialise(fields.title),
    content: serialise(fields.content),
    design: serialise(fields.design),
    case_id: serialise(fields.case_id),
    status: serialise(fields.status),
  }))
  const savedRef = useRef<Record<keyof SavedFields, string>>(baseline)
  const latestRef = useRef(fields)
  const inFlightRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // The mutation helper is a fresh object each render; keep the latest in a
  // ref so flush (and the effects that depend on it) stay stable.
  const mutateRef = useRef(save.mutateAsync)
  const flushRef = useRef<() => Promise<boolean>>(async () => false)

  useEffect(() => {
    latestRef.current = fields
    mutateRef.current = save.mutateAsync
  })

  const changedFields = useCallback((): Partial<SavedFields> => {
    const saved = savedRef.current
    const now = latestRef.current
    const diff: Partial<SavedFields> = {}
    for (const key of Object.keys(saved) as (keyof SavedFields)[]) {
      if (serialise(now[key]) !== saved[key]) {
        ;(diff as Record<string, unknown>)[key] = now[key]
      }
    }
    return diff
  }, [])

  const flush = useCallback(async (): Promise<boolean> => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (inFlightRef.current) return false
    const diff = changedFields()
    if (Object.keys(diff).length === 0) {
      setState('saved')
      return true
    }
    // The backend requires a title; an emptied title field saves as untitled.
    const payload = { ...diff }
    if (payload.title !== undefined && !payload.title.trim()) payload.title = 'Untitled document'

    inFlightRef.current = true
    setState('saving')
    try {
      await mutateRef.current({ id: docId, data: payload })
      for (const key of Object.keys(diff) as (keyof SavedFields)[]) {
        savedRef.current[key] = serialise(diff[key])
      }
      setLastSavedAt(Date.now())
      inFlightRef.current = false
      // Edits made while this request was in flight.
      if (Object.keys(changedFields()).length > 0) {
        setState('pending')
        timerRef.current = setTimeout(() => void flushRef.current(), DELAY_MS)
      } else {
        setState('saved')
      }
      return true
    } catch {
      inFlightRef.current = false
      setState('error')
      return false
    }
  }, [changedFields, docId])

  useEffect(() => {
    flushRef.current = flush
  }, [flush])

  // Schedule a save whenever a field changes.
  const signature = serialise(fields)
  useEffect(() => {
    if (Object.keys(changedFields()).length === 0) return
    // Marking the document dirty is a reaction to an edit, not derived state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((s) => (s === 'saving' ? s : 'pending'))
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => void flush(), DELAY_MS)
  }, [signature, changedFields, flush])

  // Warn before leaving with unsaved work; save what we can on unmount.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(changedFields()).length > 0 || inFlightRef.current) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      if (Object.keys(changedFields()).length > 0) void flush()
    }
  }, [changedFields, flush])

  return { state, lastSavedAt, saveNow: flush }
}
