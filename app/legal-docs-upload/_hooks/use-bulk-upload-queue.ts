'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AiServiceError,
  BULK_STATUS_MAX_IDS,
  BULK_UPLOAD_MAX_FILES,
  getIngestionJobsBulk,
  uploadLawsBulk,
} from '@/lib/ai/client'
import type { BulkUploadSkipReason } from '@/lib/ai/types'

/** Client-side mirror of legalite-ai's per-file validation, applied
 * before a single byte goes over the network — matches
 * `_validate_and_extract_title` in app/api/routes/documents.py so a bad
 * file never has to round-trip to find out it was always going to be
 * rejected. */
const MAX_FILE_MB = 50
const MIN_TITLE_LENGTH = 2

export type UploadRowStatus =
  | 'uploading'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'rejected'
  | 'skipped'

export interface UploadRow {
  id: string
  filename: string
  sizeBytes: number
  status: UploadRowStatus
  /** 0-100. Only meaningful once the row has a jobId. */
  progress: number
  jobId?: string
  documentId?: string
  chunkCount?: number
  skipReason?: BulkUploadSkipReason
  /** Human-readable rejection/skip/error explanation for the row. */
  message?: string
}

function deriveTitleLength(filename: string): number {
  return filename.replace(/\.pdf$/i, '').trim().length
}

function validateFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.pdf')) return 'Only PDF files are accepted.'
  if (file.size === 0) return 'File is empty.'
  const sizeMB = file.size / (1024 * 1024)
  if (sizeMB > MAX_FILE_MB) {
    return `File exceeds ${MAX_FILE_MB} MB limit (${sizeMB.toFixed(1)} MB).`
  }
  if (deriveTitleLength(file.name) < MIN_TITLE_LENGTH) {
    return 'Filename too short to derive a title. Rename the file to something meaningful.'
  }
  return null
}

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const POLL_INTERVAL_MS = 2000
const TERMINAL: ReadonlySet<UploadRowStatus> = new Set(['completed', 'failed', 'rejected', 'skipped'])

/**
 * Survives a tab close/reopen so upload status is still visible when the
 * user comes back — the ingestion itself already runs server-side
 * regardless of the browser (Arq worker + Postgres `ingestion_jobs`),
 * this just remembers *which* job_ids belong to this browser so they can
 * be re-polled. The backend already treats holding a job_id as proof of
 * ownership for anonymous/GLOBAL jobs (see `_job_visible_bulk` in
 * legalite-ai/app/api/routes/jobs.py), so localStorage is a natural fit —
 * no backend or auth changes needed.
 */
const STORAGE_KEY = 'legalite:bulk-upload-queue:v1'
/** Bounds storage size for a long-running "upload thousands of docs"
 * session — oldest entries drop first once exceeded. */
const MAX_PERSISTED_ROWS = 500

interface PersistedState {
  docType: string
  rows: UploadRow[]
}

function isPersistableRow(value: unknown): value is UploadRow {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as UploadRow).id === 'string' &&
    typeof (value as UploadRow).filename === 'string' &&
    typeof (value as UploadRow).status === 'string'
  )
}

function loadPersisted(): PersistedState {
  if (typeof window === 'undefined') return { docType: '', rows: [] }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { docType: '', rows: [] }
    const parsed = JSON.parse(raw) as Partial<PersistedState> | null
    const rows = Array.isArray(parsed?.rows) ? parsed.rows.filter(isPersistableRow) : []
    return { docType: typeof parsed?.docType === 'string' ? parsed.docType : '', rows }
  } catch {
    return { docType: '', rows: [] }
  }
}

function persist(state: PersistedState) {
  if (typeof window === 'undefined') return
  try {
    // Only rows the server actually accepted (or resolved as a
    // duplicate) are worth restoring. A row still mid-upload when the
    // tab closed has no jobId and its File object is gone with it —
    // there's nothing left to resume, so it's dropped rather than
    // shown as a permanently stuck ghost row on reload.
    const restorable = state.rows.filter((r) => r.jobId || r.status === 'skipped')
    const capped = restorable.slice(-MAX_PERSISTED_ROWS)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ docType: state.docType, rows: capped }))
  } catch {
    // Storage full or unavailable (private browsing) — degrade to
    // in-memory only for this session rather than crash the upload flow.
  }
}

/**
 * Drives the whole /legal-docs-upload flow: client-side validation,
 * batching files into groups of BULK_UPLOAD_MAX_FILES for
 * POST /upload-law/bulk, and polling GET /ingestion/jobs/bulk until
 * every accepted file reaches a terminal state. Also owns `docType`
 * (rather than the page) so both restore from the same persisted
 * snapshot and can never disagree after a reload.
 */
export function useBulkUploadQueue() {
  // Both states start empty so the first client render matches the
  // server-rendered HTML; the persisted snapshot is read in an effect
  // after mount. Seeding useState from localStorage instead would make
  // the client's first render disagree with the server's and throw away
  // the whole tree as a hydration mismatch.
  const [docType, setDocType] = useState<string>('')
  const [rows, setRows] = useState<UploadRow[]>([])
  const [hydrated, setHydrated] = useState(false)
  const rowsRef = useRef(rows)
  rowsRef.current = rows

  const docTypeRef = useRef(docType)
  docTypeRef.current = docType

  useEffect(() => {
    const persisted = loadPersisted()
    if (persisted.docType) setDocType(persisted.docType)
    if (persisted.rows.length > 0) setRows(persisted.rows)
    setHydrated(true)
  }, [])

  useEffect(() => {
    // Never write before the restore effect has run, or the empty
    // initial state would overwrite the snapshot we are about to load.
    if (!hydrated) return
    persist({ docType, rows })
  }, [hydrated, docType, rows])

  // Files added but not yet included in a submitted batch.
  const pendingRef = useRef<{ row: UploadRow; file: File }[]>([])
  const isFlushingRef = useRef(false)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isMountedRef = useRef(true)
  const abortRef = useRef(new AbortController())

  const patchRow = useCallback((id: string, patch: Partial<UploadRow>) => {
    if (!isMountedRef.current) return
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }, [])

  const flushBatches = useCallback(async () => {
    if (isFlushingRef.current) return
    isFlushingRef.current = true
    try {
      while (pendingRef.current.length > 0 && isMountedRef.current) {
        const batch = pendingRef.current.splice(0, BULK_UPLOAD_MAX_FILES)
        try {
          const response = await uploadLawsBulk(
            batch.map((b) => b.file),
            docTypeRef.current,
            { signal: abortRef.current.signal },
          )
          if (!isMountedRef.current) return

          const byFilename = new Map(batch.map((b) => [b.row.filename, b.row.id]))

          for (const job of response.jobs) {
            const rowId = byFilename.get(job.filename)
            if (!rowId) continue
            patchRow(rowId, {
              status: job.status === 'completed' ? 'completed' : 'queued',
              jobId: job.job_id,
              documentId: job.document_id ?? undefined,
              progress: job.status === 'completed' ? 100 : 0,
            })
          }
          for (const rejection of response.rejections) {
            const rowId = byFilename.get(rejection.filename)
            if (!rowId) continue
            patchRow(rowId, { status: 'rejected', message: rejection.reason })
          }
          for (const skip of response.skipped_duplicates) {
            const rowId = byFilename.get(skip.filename)
            if (!rowId) continue
            // An in-flight duplicate still has a live job elsewhere —
            // poll it too instead of leaving the row stuck at "skipped"
            // with no further feedback.
            if (skip.reason === 'in_flight' && skip.existing_job_id) {
              patchRow(rowId, {
                status: 'queued',
                jobId: skip.existing_job_id,
                skipReason: skip.reason,
                message: 'Already being ingested from an earlier upload.',
              })
            } else {
              patchRow(rowId, {
                status: 'skipped',
                skipReason: skip.reason,
                documentId: skip.existing_document_id ?? undefined,
                message:
                  skip.reason === 'already_ingested'
                    ? 'Already in the corpus.'
                    : 'Duplicate title in this batch.',
              })
            }
          }
        } catch (err) {
          if (!isMountedRef.current) return
          const message =
            err instanceof AiServiceError ? err.message : 'Upload failed. Please try again.'
          for (const { row } of batch) patchRow(row.id, { status: 'failed', message })
        }
      }
    } finally {
      isFlushingRef.current = false
    }
  }, [patchRow])

  const poll = useCallback(async () => {
    const live = rowsRef.current.filter(
      (r) => !TERMINAL.has(r.status) && r.jobId,
    ) as (UploadRow & { jobId: string })[]
    if (live.length === 0) return

    const chunks: (UploadRow & { jobId: string })[][] = []
    for (let i = 0; i < live.length; i += BULK_STATUS_MAX_IDS) {
      chunks.push(live.slice(i, i + BULK_STATUS_MAX_IDS))
    }

    await Promise.all(
      chunks.map(async (chunk) => {
        try {
          const result = await getIngestionJobsBulk(
            chunk.map((r) => r.jobId),
            { signal: abortRef.current.signal },
          )
          if (!isMountedRef.current) return
          const byJobId = new Map(chunk.map((r) => [r.jobId, r.id]))

          for (const job of result.found) {
            const rowId = byJobId.get(job.id)
            if (!rowId) continue
            if (job.status === 'failed') {
              patchRow(rowId, {
                status: 'failed',
                progress: job.progress,
                message: job.error_message ?? 'Ingestion failed.',
              })
            } else if (job.status === 'completed') {
              patchRow(rowId, {
                status: 'completed',
                progress: 100,
                documentId: job.document_id ?? undefined,
                chunkCount: job.chunk_count,
              })
            } else {
              patchRow(rowId, {
                status: job.status,
                progress: job.progress,
              })
            }
          }
          // A job we just created that comes back "missing" is an
          // anomaly (not the normal not-found/not-authorised case,
          // since we hold IDs we were handed seconds ago) — surface it
          // rather than polling it forever.
          for (const missingId of result.missing) {
            const rowId = byJobId.get(missingId)
            if (!rowId) continue
            patchRow(rowId, { status: 'failed', message: 'Job status unavailable.' })
          }
        } catch {
          // Transient polling error — leave rows as-is, next tick retries.
        }
      }),
    )
  }, [patchRow])

  useEffect(() => {
    isMountedRef.current = true
    const controller = abortRef.current
    return () => {
      isMountedRef.current = false
      controller.abort()
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const hasLive = rows.some((r) => !TERMINAL.has(r.status) && r.jobId)
    if (hasLive && !pollTimerRef.current) {
      // Fire immediately rather than waiting a full POLL_INTERVAL_MS —
      // matters most right after hydrating restored rows from a
      // previous session, where the UI would otherwise sit on stale
      // "queued"/"processing" status for up to 2s before refreshing.
      void poll()
      pollTimerRef.current = setInterval(poll, POLL_INTERVAL_MS)
    } else if (!hasLive && pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [rows, poll])

  const addFiles = useCallback(
    (files: File[]) => {
      const newRows: UploadRow[] = []
      const toUpload: { row: UploadRow; file: File }[] = []

      for (const file of files) {
        const id = makeId()
        const error = validateFile(file)
        const row: UploadRow = {
          id,
          filename: file.name,
          sizeBytes: file.size,
          status: error ? 'rejected' : 'uploading',
          progress: 0,
          message: error ?? undefined,
        }
        newRows.push(row)
        if (!error) toUpload.push({ row, file })
      }

      setRows((prev) => [...prev, ...newRows])
      pendingRef.current.push(...toUpload)
      if (toUpload.length > 0) void flushBatches()
    },
    [flushBatches],
  )

  const clearFinished = useCallback(() => {
    setRows((prev) => prev.filter((r) => !TERMINAL.has(r.status)))
  }, [])

  /** Wipes the whole batch (including in-progress rows) and unlocks the
   * doc-type picker — the only way to start a differently-typed batch,
   * now that a page refresh restores rather than clears the session. */
  const resetAll = useCallback(() => {
    setRows([])
    setDocType('')
  }, [])

  const summary = useMemo(() => {
    const total = rows.length
    const completed = rows.filter((r) => r.status === 'completed').length
    const failed = rows.filter((r) => r.status === 'failed' || r.status === 'rejected').length
    const skipped = rows.filter((r) => r.status === 'skipped').length
    const inProgress = total - completed - failed - skipped
    return { total, completed, failed, skipped, inProgress }
  }, [rows])

  return { docType, setDocType, rows, addFiles, clearFinished, resetAll, summary, hydrated }
}
