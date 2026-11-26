import { describe, it, expect } from 'vitest'
import { sanitizeHtml, htmlToText } from '@/lib/security/sanitize-html'

describe('sanitizeHtml', () => {
  it('removes script tags', () => {
    const out = sanitizeHtml('<p>Hi</p><script>alert(1)</script>')
    expect(out).toBe('<p>Hi</p>')
  })

  it('removes event handler attributes', () => {
    const out = sanitizeHtml('<img src="x" onerror="fetch(\'//evil\')">')
    expect(out).not.toMatch(/onerror/i)
    expect(out).toContain('<img')
  })

  it('removes javascript: links', () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">click</a>')
    expect(out).not.toMatch(/javascript:/i)
  })

  it('removes iframes, forms and inputs', () => {
    const out = sanitizeHtml(
      '<iframe src="https://evil"></iframe><form action="//evil"><input name="p"></form><p>ok</p>',
    )
    expect(out).toBe('<p>ok</p>')
  })

  it('removes svg script vectors', () => {
    const out = sanitizeHtml('<svg><script>alert(1)</script></svg><svg onload="alert(1)"></svg>')
    expect(out).not.toMatch(/script|onload/i)
  })

  it('keeps ordinary document formatting', () => {
    const html =
      '<h1>IN THE HIGH COURT</h1><p style="text-align: center"><strong>Suit No.</strong> <em>A1/2026</em></p>' +
      '<table><tbody><tr><td>Plaintiff</td></tr></tbody></table><ul><li>One</li></ul>'
    expect(sanitizeHtml(html)).toBe(html)
  })

  it('adds rel=noopener to links that open a new tab', () => {
    const out = sanitizeHtml('<a href="https://example.com" target="_blank">x</a>')
    expect(out).toContain('rel="noopener noreferrer"')
  })

  it('returns an empty string for empty input', () => {
    expect(sanitizeHtml(null)).toBe('')
    expect(sanitizeHtml(undefined)).toBe('')
    expect(sanitizeHtml('')).toBe('')
  })
})

describe('htmlToText', () => {
  it('extracts text without running handlers', () => {
    let ran = false
    ;(window as unknown as { __xss: () => void }).__xss = () => {
      ran = true
    }
    const text = htmlToText('<p>Hello <b>there</b></p><img src="x" onerror="window.__xss()">')
    expect(text).toBe('Hello there')
    expect(ran).toBe(false)
  })
})
