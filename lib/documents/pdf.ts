/**
 * PDF export for the drafting studio.
 *
 * Builds the print HTML with the same builders the editor uses
 * (lib/documents/design.ts) and sends it to the backend renderer
 * (`POST /api/pdf/render`), which prints it with headless Chromium.
 *
 * The renderer refuses remote URLs, so images are inlined as data URIs
 * here first: the firm logo and any picture in the body that is not
 * already inline. An image that cannot be fetched (e.g. blocked by CORS)
 * is dropped rather than failing the whole export.
 */

import { readToken } from '@/lib/apollo'
import {
  buildFooterTemplate,
  buildHeaderTemplate,
  buildPrintHtml,
  effectiveMargins,
  type DocumentDesign,
  type LetterheadFirm,
} from './design'

const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'https://legalite-backend-production.up.railway.app/graphql'

/** REST lives beside GraphQL: <origin>/api/... */
const PDF_ENDPOINT = `${GRAPHQL_URL.replace(/\/graphql\/?$/, '')}/api/pdf/render`

async function toDataUri(url: string): Promise<string | null> {
  if (url.startsWith('data:')) return url
  try {
    const res = await fetch(url, { mode: 'cors', credentials: 'omit' })
    if (!res.ok) return null
    const blob = await res.blob()
    if (!blob.type.startsWith('image/')) return null
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

async function inlineBodyImages(html: string): Promise<string> {
  if (!html.includes('<img')) return html
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  const images = Array.from(doc.querySelectorAll('img'))
  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute('src') ?? ''
      const data = src ? await toDataUri(src) : null
      if (data) img.setAttribute('src', data)
      else img.remove()
    }),
  )
  return doc.body.innerHTML
}

export class PdfExportError extends Error {}

/** Renders the document to a PDF blob via the backend. */
export async function renderDocumentPdf({
  title,
  bodyHtml,
  design,
  firm,
}: {
  title: string
  bodyHtml: string
  design: DocumentDesign
  firm: LetterheadFirm | null
}): Promise<Blob> {
  const token = readToken()
  if (!token) throw new PdfExportError('Sign in again to export PDFs.')

  const [body, logo] = await Promise.all([
    inlineBodyImages(bodyHtml),
    firm?.logoUrl ? toDataUri(firm.logoUrl) : Promise.resolve(null),
  ])
  const html = buildPrintHtml({
    title,
    bodyHtml: body,
    design,
    firm: firm ? { ...firm, logoUrl: logo } : null,
  })

  let res: Response
  try {
    res = await fetch(PDF_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title,
        html,
        page_size: design.page.size,
        landscape: design.page.orientation === 'landscape',
        margins_mm: effectiveMargins(design),
        header_html: buildHeaderTemplate(design) || undefined,
        footer_html: buildFooterTemplate(design) || undefined,
      }),
    })
  } catch {
    throw new PdfExportError('Could not reach the server. Check your connection and try again.')
  }

  if (!res.ok) {
    let message = 'The PDF could not be generated. Please try again.'
    try {
      const err = (await res.json()) as { message?: string | string[] }
      if (res.status === 413) message = 'This document is too large to export. Try smaller images.'
      else if (typeof err.message === 'string') message = err.message
    } catch {
      // Non-JSON error body; keep the generic message.
    }
    throw new PdfExportError(message)
  }
  return res.blob()
}

/** Saves a blob through a temporary link. */
export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Mirrors the backend's filename rules so the saved name matches. */
export function pdfFilename(title: string): string {
  const base = title
    .normalize('NFKD')
    .replace(/[^\w\s.-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '')
    .slice(0, 120)
    .replace(/\.pdf$/i, '')
  return `${base || 'document'}.pdf`
}
