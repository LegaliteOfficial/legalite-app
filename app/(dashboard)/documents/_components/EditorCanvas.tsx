'use client'

import { forwardRef } from 'react'

/**
 * The contentEditable "page" that holds the document body. Sits inside
 * a gray "desk" so the white paper visually stands out. US-Letter
 * width + 0.75″ × 1″ margins read like a real document; Times New
 * Roman / 13pt / 1.7 line-height matches legal-drafting convention.
 *
 * Class `.document-editor` is styled in globals.css so headings, lists,
 * and blockquotes from execCommand all render consistently.
 *
 * Ref is forwarded so the parent hook can read `innerHTML`/`innerText`
 * at save/export/print time without going through React state.
 */
export const EditorCanvas = forwardRef<
  HTMLDivElement,
  {
    initialHTML: string
    onInput: (html: string) => void
  }
>(function EditorCanvas({ initialHTML, onInput }, ref) {
  return (
    <div
      className="flex-1 overflow-y-auto px-6 py-8"
      style={{ background: 'var(--surface-sunken)' }}
    >
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onInput((e.target as HTMLDivElement).innerHTML)}
        className="document-editor mx-auto rounded-md focus:outline-none"
        style={{
          background: '#FFFFFF',
          color: '#1A1A1A',
          fontFamily: "'Times New Roman', Georgia, serif",
          fontSize: '13pt',
          lineHeight: 1.7,
          minHeight: 'calc(11in * 0.92)',
          maxWidth: '8.5in',
          padding: '0.75in 1in',
          boxShadow:
            '0 2px 4px rgba(13,27,42,0.04), 0 12px 28px -8px rgba(13,27,42,0.10)',
        }}
        dangerouslySetInnerHTML={{
          __html:
            initialHTML ||
            '<p style="color:#9CA3AF;font-family:var(--font-euclid,system-ui,sans-serif);font-size:13px;">Start typing your legal document here, or switch to the Templates tab to use a template.</p>',
        }}
      />
    </div>
  )
})
