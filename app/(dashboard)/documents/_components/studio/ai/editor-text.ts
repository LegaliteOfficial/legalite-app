/**
 * Locating text in the TipTap document. The AI review quotes the draft
 * verbatim; to jump to an issue (or apply its fix) we need the document
 * positions of that quote. Whitespace is normalised on both sides, since
 * the model may collapse line breaks or double spaces.
 */

import type { Editor } from '@tiptap/react'

interface Segment {
  /** Offset of this segment in the flattened text. */
  start: number
  /** Document position of its first character. */
  pos: number
  text: string
}

function flatten(editor: Editor): { text: string; segments: Segment[] } {
  const segments: Segment[] = []
  let text = ''
  let lastBlockEnd = -1
  editor.state.doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      segments.push({ start: text.length, pos, text: node.text })
      text += node.text
      return
    }
    if (node.isBlock && pos > lastBlockEnd && text.length > 0 && !text.endsWith(' ')) {
      // Block boundary reads as a space so quotes spanning paragraphs match.
      text += ' '
      lastBlockEnd = pos
    }
  })
  return { text, segments }
}

function offsetToPos(segments: Segment[], offset: number): number | null {
  for (const s of segments) {
    if (offset >= s.start && offset <= s.start + s.text.length) return s.pos + (offset - s.start)
  }
  return null
}

const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()

/**
 * Returns the document range of `quote`, or null when it is not in the
 * document. Falls back to the quote's first 60 characters, because a
 * long quote is likelier to differ in a word or two.
 */
export function findQuote(editor: Editor, quote: string): { from: number; to: number } | null {
  const target = norm(quote)
  if (target.length < 3) return null
  const { text, segments } = flatten(editor)

  // Map normalised offsets back to raw offsets.
  const rawIndex: number[] = []
  let normalised = ''
  let prevSpace = true
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (/\s/.test(ch)) {
      if (prevSpace) continue
      normalised += ' '
      rawIndex.push(i)
      prevSpace = true
    } else {
      normalised += ch.toLowerCase()
      rawIndex.push(i)
      prevSpace = false
    }
  }

  for (const needle of [target, target.slice(0, 60)]) {
    const at = normalised.indexOf(needle)
    if (at === -1) continue
    const from = offsetToPos(segments, rawIndex[at])
    const to = offsetToPos(segments, rawIndex[at + needle.length - 1] + 1)
    if (from !== null && to !== null && to > from) return { from, to }
  }
  return null
}

/** Selects a range and scrolls it into view. */
export function revealRange(editor: Editor, range: { from: number; to: number }) {
  editor.chain().focus().setTextSelection(range).scrollIntoView().run()
}
