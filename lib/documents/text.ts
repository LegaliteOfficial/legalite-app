/**
 * Plain-text helpers for sending editor content to the AI service. The
 * model reads prose, not markup, and plain text is far cheaper in tokens.
 */

/** Strips tags and collapses whitespace, keeping paragraph breaks. */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Trims to `max` characters, cutting at a paragraph break when one is near. */
export function clip(text: string, max: number): { text: string; clipped: boolean } {
  if (text.length <= max) return { text, clipped: false }
  const cut = text.lastIndexOf('\n', max)
  return { text: text.slice(0, cut > max * 0.8 ? cut : max), clipped: true }
}

/** Word count for the studio status bar. */
export function countWords(text: string): number {
  const m = text.match(/\S+/g)
  return m ? m.length : 0
}

const AI_ALLOWED_TAGS = new Set(['p', 'h2', 'h3', 'ol', 'ul', 'li', 'strong', 'em', 'u', 'blockquote', 'br'])

/**
 * Reduces AI output to the small tag set the drafting service promises,
 * with no attributes. The service already cleans it; this is the second
 * line, because the preview renders it as HTML.
 */
export function sanitizeAiHtml(html: string): string {
  return html
    .replace(/<(script|style|iframe|object)[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<\/?\s*([a-zA-Z0-9]+)[^>]*>/g, (tag, name: string) => {
      const n = name.toLowerCase()
      if (!AI_ALLOWED_TAGS.has(n)) return ''
      if (n === 'br') return '<br>'
      return tag.startsWith('</') ? `</${n}>` : `<${n}>`
    })
}
