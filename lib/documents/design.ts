/**
 * Document design — the drafting studio's page design model.
 * ==========================================================
 *
 * A design describes how a document is laid out on paper: page size and
 * margins, typography, letterhead, running header and footer, and an
 * optional watermark. It is stored per document (`documents.design`) and
 * travels with templates.
 *
 * The same builders here produce the editor canvas AND the PDF:
 *   - `buildDocumentCss`   — body typography, scoped to a root selector
 *   - `buildLetterheadHtml`— the first-page letterhead
 *   - `buildWatermarkHtml` — the diagonal watermark
 *   - `buildPrintHtml`     — the complete HTML document sent to the PDF
 *                            renderer (fonts, styles, letterhead, body)
 *   - `buildHeaderTemplate` / `buildFooterTemplate` — running header and
 *                            footer with page numbers, printed in the
 *                            page margins by Chromium
 *
 * Keeping one source of truth is what makes "designs intact" hold: the
 * PDF is the editor's own HTML and CSS rendered by the same engine.
 *
 * Fonts are Google Fonts (loaded by the editor and by the renderer), so
 * the typeface on screen is the typeface in the PDF. Tinos and Arimo are
 * metric-compatible with Times New Roman and Arial.
 */

// ── Model ────────────────────────────────────────────────────────────────

export type PageSize = 'A4' | 'Letter' | 'Legal'
export type Orientation = 'portrait' | 'landscape'
export type LetterheadLayout = 'classic' | 'centered' | 'banner'
export type PageNumberStyle = 'none' | 'page' | 'pageOfTotal'
export type Alignment = 'left' | 'center' | 'right'

export interface Margins {
  top: number
  right: number
  bottom: number
  left: number
}

export interface DocumentDesign {
  version: 1
  page: { size: PageSize; orientation: Orientation; margins: Margins }
  typography: {
    font: FontId
    headingFont: FontId
    /** Body size in points. */
    size: number
    lineHeight: number
    /** Space after paragraphs, in points. */
    paragraphSpacing: number
  }
  /** Accent colour for headings rules, letterhead and table headers. */
  accent: string
  letterhead: {
    enabled: boolean
    layout: LetterheadLayout
    showLogo: boolean
    showContacts: boolean
  }
  header: { text: string; align: Alignment }
  footer: { text: string; align: Alignment; pageNumbers: PageNumberStyle }
  /** Empty text means no watermark. */
  watermark: { text: string; opacity: number }
}

/** Firm details shown in the letterhead. */
export interface LetterheadFirm {
  name: string
  /** data: URI (inlined before PDF rendering) or https URL in the editor. */
  logoUrl?: string | null
  addressLines: string[]
  phone?: string | null
  email?: string | null
  website?: string | null
}

// ── Reference data ───────────────────────────────────────────────────────

export const PAGE_SIZES_MM: Record<PageSize, { width: number; height: number; label: string }> = {
  A4: { width: 210, height: 297, label: 'A4 (210 × 297 mm)' },
  Letter: { width: 215.9, height: 279.4, label: 'Letter (8.5 × 11 in)' },
  Legal: { width: 215.9, height: 355.6, label: 'Legal (8.5 × 14 in)' },
}

export const DOCUMENT_FONTS = [
  { id: 'tinos', label: 'Times (Tinos)', family: "'Tinos', 'Times New Roman', serif", google: 'Tinos:ital,wght@0,400;0,700;1,400;1,700' },
  { id: 'eb-garamond', label: 'Garamond', family: "'EB Garamond', Garamond, serif", google: 'EB+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,700' },
  { id: 'libre-baskerville', label: 'Baskerville', family: "'Libre Baskerville', Baskerville, serif", google: 'Libre+Baskerville:ital,wght@0,400;0,700;1,400' },
  { id: 'source-serif', label: 'Source Serif', family: "'Source Serif 4', Georgia, serif", google: 'Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400;1,700' },
  { id: 'lora', label: 'Lora', family: "'Lora', Georgia, serif", google: 'Lora:ital,wght@0,400;0,600;0,700;1,400;1,700' },
  { id: 'arimo', label: 'Arial (Arimo)', family: "'Arimo', Arial, sans-serif", google: 'Arimo:ital,wght@0,400;0,700;1,400;1,700' },
  { id: 'inter', label: 'Inter', family: "'Inter', Helvetica, sans-serif", google: 'Inter:ital,wght@0,400;0,600;0,700;1,400;1,700' },
] as const

export type FontId = (typeof DOCUMENT_FONTS)[number]['id']

export const FONT_SIZES_PT = [8, 9, 10, 10.5, 11, 11.5, 12, 12.5, 13, 14, 16, 18, 20, 24, 28, 32, 36]
export const LINE_HEIGHTS = [1, 1.15, 1.3, 1.5, 1.75, 2]

export const MARGIN_PRESETS: { id: string; label: string; margins: Margins }[] = [
  { id: 'normal', label: 'Normal (25.4 mm)', margins: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 } },
  { id: 'narrow', label: 'Narrow (12.7 mm)', margins: { top: 12.7, right: 12.7, bottom: 12.7, left: 12.7 } },
  { id: 'wide', label: 'Wide (38 mm sides)', margins: { top: 25.4, right: 38, bottom: 25.4, left: 38 } },
  { id: 'binding', label: 'Court binding (38 mm left)', margins: { top: 25.4, right: 25.4, bottom: 25.4, left: 38 } },
]

export const ACCENT_SWATCHES = [
  { label: 'Navy', value: '#0D1B2A' },
  { label: 'Gold', value: '#A07A1E' },
  { label: 'Burgundy', value: '#7A1E2C' },
  { label: 'Forest', value: '#1F4D3A' },
  { label: 'Slate', value: '#3F4A5A' },
  { label: 'Black', value: '#111111' },
]

export const WATERMARK_PRESETS = [
  'DRAFT',
  'CONFIDENTIAL',
  'WITHOUT PREJUDICE',
  'PRIVILEGED & CONFIDENTIAL',
  'COPY',
]

export const DEFAULT_DESIGN: DocumentDesign = {
  version: 1,
  page: { size: 'A4', orientation: 'portrait', margins: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 } },
  typography: { font: 'tinos', headingFont: 'tinos', size: 12, lineHeight: 1.5, paragraphSpacing: 8 },
  accent: '#0D1B2A',
  letterhead: { enabled: false, layout: 'classic', showLogo: true, showContacts: true },
  header: { text: '', align: 'right' },
  footer: { text: '', align: 'center', pageNumbers: 'pageOfTotal' },
  watermark: { text: '', opacity: 0.08 },
}

/** Starting points offered in the design panel. */
export const DESIGN_PRESETS: { id: string; label: string; description: string; design: DocumentDesign }[] = [
  {
    id: 'pleading',
    label: 'Court pleading',
    description: 'Times 12 pt, double spaced, wide binding margin',
    design: {
      ...DEFAULT_DESIGN,
      page: { size: 'A4', orientation: 'portrait', margins: { top: 25.4, right: 25.4, bottom: 25.4, left: 38 } },
      typography: { font: 'tinos', headingFont: 'tinos', size: 12, lineHeight: 2, paragraphSpacing: 0 },
      accent: '#111111',
      footer: { text: '', align: 'center', pageNumbers: 'page' },
    },
  },
  {
    id: 'letter',
    label: 'Firm letter',
    description: 'Letterhead, Garamond, numbered pages',
    design: {
      ...DEFAULT_DESIGN,
      typography: { font: 'eb-garamond', headingFont: 'eb-garamond', size: 12.5, lineHeight: 1.4, paragraphSpacing: 10 },
      accent: '#0D1B2A',
      letterhead: { enabled: true, layout: 'classic', showLogo: true, showContacts: true },
      footer: { text: '', align: 'right', pageNumbers: 'pageOfTotal' },
    },
  },
  {
    id: 'agreement',
    label: 'Agreement',
    description: 'Source Serif, numbered pages, confidential footer',
    design: {
      ...DEFAULT_DESIGN,
      typography: { font: 'source-serif', headingFont: 'source-serif', size: 11, lineHeight: 1.5, paragraphSpacing: 8 },
      accent: '#1F4D3A',
      footer: { text: 'Private and confidential', align: 'center', pageNumbers: 'pageOfTotal' },
    },
  },
  {
    id: 'memo',
    label: 'Internal memo',
    description: 'Banner letterhead, Inter, compact spacing',
    design: {
      ...DEFAULT_DESIGN,
      typography: { font: 'inter', headingFont: 'inter', size: 10.5, lineHeight: 1.45, paragraphSpacing: 6 },
      accent: '#7A1E2C',
      letterhead: { enabled: true, layout: 'banner', showLogo: false, showContacts: false },
      watermark: { text: 'CONFIDENTIAL', opacity: 0.06 },
    },
  },
]

// ── Normalisation ────────────────────────────────────────────────────────

const FONT_IDS = new Set<string>(DOCUMENT_FONTS.map((f) => f.id))
const HEX = /^#[0-9a-f]{6}$/i

function num(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback
}
function pick<T extends string>(v: unknown, options: readonly T[], fallback: T): T {
  return options.includes(v as T) ? (v as T) : fallback
}
function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : {}
}

/**
 * Reads a stored design defensively: unknown keys are dropped, missing or
 * out-of-range values fall back to the defaults. Documents saved before
 * designs existed (`null`) get the default design.
 */
export function normaliseDesign(raw: unknown): DocumentDesign {
  const d = obj(raw)
  const page = obj(d.page)
  const margins = obj(page.margins)
  const typo = obj(d.typography)
  const lh = obj(d.letterhead)
  const header = obj(d.header)
  const footer = obj(d.footer)
  const wm = obj(d.watermark)
  const D = DEFAULT_DESIGN
  const font = (v: unknown, f: FontId): FontId => (FONT_IDS.has(v as string) ? (v as FontId) : f)
  const margin = (k: keyof Margins) => num(margins[k], D.page.margins[k], 0, 80)

  return {
    version: 1,
    page: {
      size: pick(page.size, ['A4', 'Letter', 'Legal'] as const, D.page.size),
      orientation: pick(page.orientation, ['portrait', 'landscape'] as const, D.page.orientation),
      margins: { top: margin('top'), right: margin('right'), bottom: margin('bottom'), left: margin('left') },
    },
    typography: {
      font: font(typo.font, D.typography.font),
      headingFont: font(typo.headingFont, font(typo.font, D.typography.headingFont)),
      size: num(typo.size, D.typography.size, 6, 48),
      lineHeight: num(typo.lineHeight, D.typography.lineHeight, 0.8, 3),
      paragraphSpacing: num(typo.paragraphSpacing, D.typography.paragraphSpacing, 0, 48),
    },
    accent: typeof d.accent === 'string' && HEX.test(d.accent) ? d.accent : D.accent,
    letterhead: {
      enabled: typeof lh.enabled === 'boolean' ? lh.enabled : D.letterhead.enabled,
      layout: pick(lh.layout, ['classic', 'centered', 'banner'] as const, D.letterhead.layout),
      showLogo: typeof lh.showLogo === 'boolean' ? lh.showLogo : D.letterhead.showLogo,
      showContacts: typeof lh.showContacts === 'boolean' ? lh.showContacts : D.letterhead.showContacts,
    },
    header: {
      text: typeof header.text === 'string' ? header.text.slice(0, 200) : '',
      align: pick(header.align, ['left', 'center', 'right'] as const, D.header.align),
    },
    footer: {
      text: typeof footer.text === 'string' ? footer.text.slice(0, 200) : '',
      align: pick(footer.align, ['left', 'center', 'right'] as const, D.footer.align),
      pageNumbers: pick(footer.pageNumbers, ['none', 'page', 'pageOfTotal'] as const, D.footer.pageNumbers),
    },
    watermark: {
      text: typeof wm.text === 'string' ? wm.text.slice(0, 40) : '',
      opacity: num(wm.opacity, D.watermark.opacity, 0.02, 0.4),
    },
  }
}

// ── Geometry ─────────────────────────────────────────────────────────────

/** Paper dimensions in mm after applying orientation. */
export function pageDimensions(design: DocumentDesign): { width: number; height: number } {
  const { width, height } = PAGE_SIZES_MM[design.page.size]
  return design.page.orientation === 'landscape' ? { width: height, height: width } : { width, height }
}

/** Header/footer need room in the margin; keep at least this much. */
const RUNNING_TEXT_MIN_MARGIN_MM = 14

/** Margins actually used for printing (grown to fit header/footer). */
export function effectiveMargins(design: DocumentDesign): Margins {
  const m = design.page.margins
  return {
    ...m,
    top: hasHeader(design) ? Math.max(m.top, RUNNING_TEXT_MIN_MARGIN_MM) : m.top,
    bottom: hasFooter(design) ? Math.max(m.bottom, RUNNING_TEXT_MIN_MARGIN_MM) : m.bottom,
  }
}

export function hasHeader(design: DocumentDesign): boolean {
  return design.header.text.trim().length > 0
}
export function hasFooter(design: DocumentDesign): boolean {
  return design.footer.text.trim().length > 0 || design.footer.pageNumbers !== 'none'
}

// ── Fonts ────────────────────────────────────────────────────────────────

export function fontFamily(id: FontId): string {
  return DOCUMENT_FONTS.find((f) => f.id === id)?.family ?? DOCUMENT_FONTS[0].family
}

/**
 * Google Fonts stylesheet URL for the given font ids. `display=block`
 * makes the renderer wait for the real typeface instead of printing a
 * fallback.
 */
export function googleFontsHref(ids: Iterable<FontId>): string {
  const params = Array.from(new Set(ids))
    .map((id) => DOCUMENT_FONTS.find((f) => f.id === id)?.google)
    .filter(Boolean)
    .map((g) => `family=${g}`)
    .join('&')
  return `https://fonts.googleapis.com/css2?${params}&display=block`
}

/** Fonts a document needs: its design fonts plus any applied inline. */
export function fontsUsed(design: DocumentDesign, bodyHtml: string): FontId[] {
  const used = new Set<FontId>([design.typography.font, design.typography.headingFont])
  for (const f of DOCUMENT_FONTS) {
    const name = f.family.split(',')[0].replace(/'/g, '')
    if (bodyHtml.includes(name)) used.add(f.id)
  }
  return Array.from(used)
}

// ── HTML / CSS builders ──────────────────────────────────────────────────

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Mixes the accent with white for table-header fills. */
function tint(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const mix = (c: number) => Math.round(c + (255 - c) * amount)
  const r = mix((n >> 16) & 255)
  const g = mix((n >> 8) & 255)
  const b = mix(n & 255)
  return `rgb(${r}, ${g}, ${b})`
}

/**
 * Typography and block styles for document content, scoped under `root`
 * (the element that directly contains the body blocks). Used verbatim by
 * the editor canvas (`.ProseMirror`) and the PDF (`.ll-body`).
 */
export function buildDocumentCss(design: DocumentDesign, root: string): string {
  const t = design.typography
  const body = fontFamily(t.font)
  const heading = fontFamily(t.headingFont)
  const gap = `${t.paragraphSpacing}pt`
  const r = root
  return `
${r} { font-family: ${body}; font-size: ${t.size}pt; line-height: ${t.lineHeight}; color: #1a1a1a; overflow-wrap: break-word; }
${r} p { margin: 0 0 ${gap}; }
${r} h1, ${r} h2, ${r} h3 { font-family: ${heading}; color: ${design.accent}; line-height: 1.25; margin: 1.1em 0 0.5em; break-after: avoid; }
${r} h1 { font-size: 1.6em; font-weight: 700; }
${r} h2 { font-size: 1.3em; font-weight: 700; }
${r} h3 { font-size: 1.1em; font-weight: 700; }
${r} > :first-child { margin-top: 0; }
${r} ul, ${r} ol { margin: 0 0 ${gap}; padding-left: 1.6em; }
${r} li { margin: 0 0 0.25em; }
${r} li > p { margin: 0; }
${r} blockquote { margin: 0 0 ${gap}; padding: 0.2em 0 0.2em 1em; border-left: 3px solid ${design.accent}; color: #3a3a3a; }
${r} hr { border: 0; border-top: 1px solid #b5b5b5; margin: 1em 0; }
${r} a { color: ${design.accent}; text-decoration: underline; }
${r} mark { padding: 0 0.1em; border-radius: 0.1em; }
${r} img { max-width: 100%; height: auto; }
${r} table { width: 100%; border-collapse: collapse; table-layout: fixed; margin: 0 0 ${gap}; break-inside: auto; }
${r} tr { break-inside: avoid; }
${r} th, ${r} td { border: 1px solid #9a9a9a; padding: 4pt 6pt; vertical-align: top; text-align: left; }
${r} th { background: ${tint(design.accent, 0.88)}; font-weight: 700; }
${r} th p, ${r} td p { margin: 0; }
${r} .ll-page-break { break-after: page; height: 0; margin: 0; border: 0; }
.ll-letterhead { font-family: ${heading}; color: ${design.accent}; margin: 0 0 18pt; }
.ll-letterhead * { box-sizing: border-box; }
.ll-letterhead .ll-lh-name { font-size: 20pt; font-weight: 700; letter-spacing: 0.01em; line-height: 1.15; }
.ll-letterhead .ll-lh-meta { font-family: ${body}; font-size: 8.5pt; line-height: 1.45; color: #4a4a4a; }
.ll-letterhead img { max-height: 18mm; max-width: 45mm; object-fit: contain; }
.ll-lh-classic { display: flex; align-items: center; justify-content: space-between; gap: 12mm; padding-bottom: 6pt; border-bottom: 1.5pt solid ${design.accent}; }
.ll-lh-classic .ll-lh-meta { margin-top: 3pt; }
.ll-lh-centered { text-align: center; padding-bottom: 6pt; border-bottom: 3pt double ${design.accent}; }
.ll-lh-centered img { display: block; margin: 0 auto 6pt; }
.ll-lh-centered .ll-lh-name { text-transform: uppercase; letter-spacing: 0.12em; font-size: 16pt; }
.ll-lh-centered .ll-lh-meta { margin-top: 4pt; }
.ll-lh-banner .ll-lh-band { display: flex; align-items: center; justify-content: space-between; gap: 8mm; background: ${design.accent}; color: #ffffff; padding: 8pt 10pt; }
.ll-lh-banner .ll-lh-name { font-size: 17pt; }
.ll-lh-banner .ll-lh-meta { padding: 5pt 10pt 0; }
.ll-watermark { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 0; }
.ll-watermark span { transform: rotate(-35deg); font-family: ${heading}; font-weight: 700; font-size: 72pt; letter-spacing: 0.08em; white-space: nowrap; color: ${design.accent}; opacity: ${design.watermark.opacity}; }
`
}

/** First-page letterhead, or an empty string when switched off. */
export function buildLetterheadHtml(design: DocumentDesign, firm: LetterheadFirm | null): string {
  if (!design.letterhead.enabled || !firm?.name) return ''
  const { layout, showLogo, showContacts } = design.letterhead
  const logo = showLogo && firm.logoUrl ? `<img src="${escapeHtml(firm.logoUrl)}" alt="">` : ''
  const contacts = [firm.phone, firm.email, firm.website].filter(Boolean) as string[]
  const metaLines = showContacts
    ? [firm.addressLines.join(', '), contacts.join('  ·  ')].filter((l) => l.trim().length > 0)
    : []
  const meta = metaLines.length
    ? `<div class="ll-lh-meta">${metaLines.map(escapeHtml).join('<br>')}</div>`
    : ''
  const name = `<div class="ll-lh-name">${escapeHtml(firm.name)}</div>`

  if (layout === 'centered') {
    return `<header class="ll-letterhead ll-lh-centered">${logo}${name}${meta}</header>`
  }
  if (layout === 'banner') {
    return `<header class="ll-letterhead ll-lh-banner"><div class="ll-lh-band">${name}${logo}</div>${meta}</header>`
  }
  return `<header class="ll-letterhead ll-lh-classic"><div>${name}${meta}</div>${logo}</header>`
}

export function buildWatermarkHtml(design: DocumentDesign): string {
  const text = design.watermark.text.trim()
  return text ? `<div class="ll-watermark" aria-hidden="true"><span>${escapeHtml(text)}</span></div>` : ''
}

/**
 * Chromium header/footer templates. They render in the page margins on
 * every page and fill `pageNumber` / `totalPages` spans. Templates do not
 * inherit page styles, so everything is inline; sizes are in px because
 * Chromium scales templates against a 96 dpi page.
 */
function runningTemplate(
  design: DocumentDesign,
  text: string,
  align: Alignment,
  pageNumbers: PageNumberStyle,
): string {
  const m = effectiveMargins(design)
  const number =
    pageNumbers === 'page'
      ? '<span class="pageNumber"></span>'
      : pageNumbers === 'pageOfTotal'
        ? 'Page <span class="pageNumber"></span> of <span class="totalPages"></span>'
        : ''
  const parts = [escapeHtml(text.trim()), number].filter(Boolean)
  if (parts.length === 0) return ''
  return `<div style="width:100%;box-sizing:border-box;padding:0 ${m.right}mm 0 ${m.left}mm;font-family:${fontFamily(design.typography.font).replace(/"/g, "'")};font-size:9px;color:#555;text-align:${align};-webkit-print-color-adjust:exact;">${parts.join('&nbsp;&nbsp;·&nbsp;&nbsp;')}</div>`
}

export function buildHeaderTemplate(design: DocumentDesign): string {
  return hasHeader(design) ? runningTemplate(design, design.header.text, design.header.align, 'none') : ''
}

export function buildFooterTemplate(design: DocumentDesign): string {
  return hasFooter(design)
    ? runningTemplate(design, design.footer.text, design.footer.align, design.footer.pageNumbers)
    : ''
}

/**
 * The complete HTML document for the PDF renderer. Margins are applied by
 * the renderer (so running header/footer sit in them), which is why the
 * page box here has none.
 */
export function buildPrintHtml({
  title,
  bodyHtml,
  design,
  firm,
}: {
  title: string
  bodyHtml: string
  design: DocumentDesign
  firm: LetterheadFirm | null
}): string {
  const { width, height } = pageDimensions(design)
  const fonts = googleFontsHref(fontsUsed(design, bodyHtml))
  const csp = [
    "default-src 'none'",
    "style-src 'unsafe-inline' https://fonts.googleapis.com",
    'font-src https://fonts.gstatic.com',
    'img-src data:',
  ].join('; ')
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<title>${escapeHtml(title || 'Document')}</title>
<link rel="stylesheet" href="${fonts}">
<style>
@page { size: ${width}mm ${height}mm; }
html, body { margin: 0; padding: 0; background: #ffffff; }
body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.ll-doc { position: relative; z-index: 1; }
${buildDocumentCss(design, '.ll-body')}
</style>
</head>
<body>
${buildWatermarkHtml(design)}
<main class="ll-doc">${buildLetterheadHtml(design, firm)}<div class="ll-body">${bodyHtml}</div></main>
</body>
</html>`
}
