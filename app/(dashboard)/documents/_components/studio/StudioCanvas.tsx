'use client'

/**
 * The paper the user writes on. Sized in real millimetres from the design
 * (page size, orientation, margins) and styled with the same stylesheet
 * the PDF uses, so what is on screen is what prints. The letterhead,
 * running header/footer and watermark are previews: they are not part of
 * the editable body.
 *
 * Exact pagination is shown by "Preview PDF"; the canvas is one long
 * sheet, with forced page breaks drawn as labelled rules.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { EditorContent, type Editor } from '@tiptap/react'
import {
  DOCUMENT_FONTS,
  buildDocumentCss,
  buildLetterheadHtml,
  buildWatermarkHtml,
  effectiveMargins,
  googleFontsHref,
  hasFooter,
  hasHeader,
  pageDimensions,
  type DocumentDesign,
  type LetterheadFirm,
} from '@/lib/documents/design'

/** Every studio font, so switching fonts in the toolbar is instant. */
const ALL_FONTS_HREF = googleFontsHref(DOCUMENT_FONTS.map((f) => f.id))

const ROOT = '.ll-sheet .ProseMirror'

export function StudioCanvas({
  editor,
  design,
  firm,
}: {
  editor: Editor
  design: DocumentDesign
  firm: LetterheadFirm | null
}) {
  const { width, height } = pageDimensions(design)
  const m = effectiveMargins(design)

  // On screens narrower than the paper, shrink the whole sheet to fit
  // rather than scroll sideways; the document itself stays true to size.
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [available, setAvailable] = useState<number | null>(null)
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const sheetPx = (width * 96) / 25.4
  const fit = available ? Math.min(1, available / sheetPx) : 1

  const css = useMemo(
    () => `${buildDocumentCss(design, ROOT)}
${ROOT} { outline: none; min-height: 60mm; }
${ROOT} p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #9ca3af; float: left; height: 0; pointer-events: none; }
${ROOT} .ll-page-break { position: relative; height: 0; margin: 16pt -${m.right}mm 16pt -${m.left}mm; border-top: 1px dashed #c9972b; }
${ROOT} .ll-page-break::after { content: 'Page break'; position: absolute; left: 50%; top: -0.75em; transform: translateX(-50%); background: #fff; padding: 0 8px; font: 600 9.5px var(--font-euclid, system-ui), sans-serif; letter-spacing: 0.08em; text-transform: uppercase; color: #a07a1e; }
${ROOT} .ProseMirror-selectednode { outline: 2px solid #c9972b; outline-offset: 2px; }
${ROOT} td, ${ROOT} th { position: relative; }
${ROOT} .selectedCell::after { content: ''; position: absolute; inset: 0; background: rgba(201, 151, 43, 0.14); pointer-events: none; }
.ll-sheet .ll-watermark { position: absolute; overflow: hidden; }
`,
    [design, m.left, m.right],
  )

  const letterhead = useMemo(() => buildLetterheadHtml(design, firm), [design, firm])
  const watermark = useMemo(() => buildWatermarkHtml(design), [design])
  const pageNumberSample =
    design.footer.pageNumbers === 'page' ? '1' : design.footer.pageNumbers === 'pageOfTotal' ? 'Page 1 of 3' : ''

  return (
    <div ref={scrollerRef} className="min-w-0 flex-1 overflow-auto px-3 py-4 sm:px-6 sm:py-8" style={{ background: 'var(--surface-sunken)' }}>
      <link rel="stylesheet" href={ALL_FONTS_HREF} precedence="default" />
      <style>{css}</style>

      <div
        className="ll-sheet relative mx-auto bg-white"
        style={{
          width: `${width}mm`,
          minHeight: `${height}mm`,
          padding: `${m.top}mm ${m.right}mm ${m.bottom}mm ${m.left}mm`,
          zoom: fit < 1 ? fit : undefined,
          boxShadow: '0 2px 4px rgba(13,27,42,0.04), 0 12px 28px -8px rgba(13,27,42,0.12)',
        }}
      >
        {watermark && <div aria-hidden dangerouslySetInnerHTML={{ __html: watermark }} />}

        {hasHeader(design) && (
          <RunningText position="top" offsetMm={m.top} margins={m} align={design.header.align}>
            {design.header.text}
          </RunningText>
        )}

        <div className="relative z-[1]">
          {letterhead && <div dangerouslySetInnerHTML={{ __html: letterhead }} />}
          <EditorContent editor={editor} />
        </div>

        {hasFooter(design) && (
          <RunningText position="bottom" offsetMm={m.bottom} margins={m} align={design.footer.align}>
            {[design.footer.text.trim(), pageNumberSample].filter(Boolean).join('  ·  ')}
          </RunningText>
        )}
      </div>
    </div>
  )
}

/** Greyed preview of the running header/footer, placed in the margin. */
function RunningText({
  position, offsetMm, margins, align, children,
}: {
  position: 'top' | 'bottom'
  offsetMm: number
  margins: { left: number; right: number }
  align: 'left' | 'center' | 'right'
  children: string
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute select-none"
      style={{
        [position]: `${Math.max(4, offsetMm / 2 - 2)}mm`,
        left: `${margins.left}mm`,
        right: `${margins.right}mm`,
        textAlign: align,
        fontSize: '9px',
        color: '#8a8f99',
        whiteSpace: 'pre',
      }}
    >
      {children}
    </div>
  )
}
