'use client'

import { ArrowCounterClockwise, Trash } from '@phosphor-icons/react'
import { DocTypeSelect } from './DocTypeSelect'
import { DropZone } from './DropZone'
import { FileRow } from './FileRow'
import { useBulkUploadQueue } from '../_hooks/use-bulk-upload-queue'

export function UploadWorkspace() {
  const { docType, setDocType, rows, addFiles, clearFinished, resetAll, summary, hydrated } =
    useBulkUploadQueue()

  const locked = rows.length > 0
  const hasFinished = summary.completed + summary.failed + summary.skipped > 0
  const overallPct =
    summary.total === 0 ? 0 : Math.round(((summary.completed + summary.failed + summary.skipped) / summary.total) * 100)

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-12">
      <div>
        <h1 className="font-heading text-[26px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Legal document upload
        </h1>
        <p className="mt-1 text-[14px]" style={{ color: 'var(--text-secondary)' }}>
          Bulk-upload PDFs to train LegaLite AI. Pick a document type, then drop in as many files as you need.
        </p>
      </div>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <DocTypeSelect value={docType} onChange={setDocType} disabled={locked} />
        {locked ? (
          <button
            type="button"
            onClick={resetAll}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium transition-colors hover:bg-black/[0.03]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowCounterClockwise size={13} />
            Type is locked to <span className="font-medium">{docType}</span> — start a new batch to change it
          </button>
        ) : (
          // Held back until the persisted batch has been read, so a
          // restored session never flashes this line before locking.
          hydrated && (
            <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
              Your progress is saved on this device — safe to close the tab and come back later.
            </p>
          )
        )}
      </div>

      <DropZone disabled={!docType} onFiles={addFiles} />

      {rows.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                <span>
                  {summary.completed} of {summary.total} ingested
                  {summary.failed > 0 && ` · ${summary.failed} failed`}
                  {summary.skipped > 0 && ` · ${summary.skipped} skipped`}
                </span>
                <span>{overallPct}%</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-sunken)' }}>
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{ width: `${overallPct}%`, background: 'var(--gold)' }}
                />
              </div>
            </div>
            {hasFinished && (
              <button
                type="button"
                onClick={clearFinished}
                className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium transition-colors hover:bg-black/[0.03]"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Trash size={13} />
                Clear finished
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {rows.map((row) => (
              <FileRow key={row.id} row={row} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
