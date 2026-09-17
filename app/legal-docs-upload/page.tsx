import type { Metadata } from 'next'
import { UploadWorkspace } from './_components/UploadWorkspace'

export const metadata: Metadata = {
  title: 'Legal Document Upload — LegaLite',
  robots: { index: false, follow: false },
}

/**
 * Standalone bulk-upload tool for training LegaLite AI's legal corpus.
 * Deliberately outside the (auth)/(dashboard)/(marketing) route groups —
 * no login gate, no app chrome. Talks directly to the legalite-ai FastAPI
 * service's anonymous /upload-law/bulk + /ingestion/jobs/bulk endpoints
 * (see lib/ai/client.ts).
 */
export default function LegalDocsUploadPage() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--surface-page)' }}>
      <UploadWorkspace />
    </main>
  )
}
