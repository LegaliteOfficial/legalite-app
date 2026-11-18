import { describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

import { parseFrame } from '@/lib/ai/drafting'
import { normaliseStatus } from '@/lib/documents/status'
import { clip, countWords, htmlToText, sanitizeAiHtml } from '@/lib/documents/text'
import { relativeTime } from '@/app/(dashboard)/documents/_components/StatusBadge'
import { buildMatter } from '@/app/(dashboard)/documents/_components/studio/Studio'
import { titleFromInstruction } from '@/app/(dashboard)/documents/_hooks/use-start-document'
import type { Case } from '@/types'

describe('htmlToText', () => {
  it('keeps paragraph breaks and decodes entities', () => {
    expect(htmlToText('<h2>Claim</h2><p>A &amp; B</p><ul><li>one</li><li>two</li></ul>')).toBe(
      'Claim\nA & B\none\ntwo',
    )
  })
})

describe('clip', () => {
  it('returns short text untouched', () => {
    expect(clip('abc', 10)).toEqual({ text: 'abc', clipped: false })
  })
  it('cuts at a nearby paragraph break', () => {
    const text = `${'a'.repeat(90)}\n${'b'.repeat(50)}`
    expect(clip(text, 100)).toEqual({ text: 'a'.repeat(90), clipped: true })
  })
})

describe('sanitizeAiHtml', () => {
  it('keeps allowed tags without attributes and drops the rest', () => {
    expect(
      sanitizeAiHtml('<p onclick="x()" class="a">Hi <a href="javascript:1">there</a></p><script>bad()</script><img src=x onerror=y>'),
    ).toBe('<p>Hi there</p>')
  })
  it('normalises br', () => {
    expect(sanitizeAiHtml('<p>a<br/>b</p>')).toBe('<p>a<br>b</p>')
  })
})

describe('countWords', () => {
  it('counts whitespace-separated words', () => {
    expect(countWords('  The plaintiff  claims\nGHS 5,000 ')).toBe(5)
    expect(countWords('')).toBe(0)
  })
})

describe('parseFrame', () => {
  it('parses an SSE frame', () => {
    expect(parseFrame('event: delta\ndata: {"text":"<p>Hi"}')).toEqual({ event: 'delta', data: { text: '<p>Hi' } })
  })
  it('ignores malformed frames', () => {
    expect(parseFrame('event: delta\ndata: {broken')).toBeNull()
    expect(parseFrame(': keep-alive')).toBeNull()
  })
})

describe('normaliseStatus', () => {
  it('falls back to draft', () => {
    expect(normaliseStatus('final')).toBe('final')
    expect(normaliseStatus('bogus')).toBe('draft')
    expect(normaliseStatus(null)).toBe('draft')
  })
})

describe('titleFromInstruction', () => {
  it('drops the drafting verb and capitalises', () => {
    expect(titleFromInstruction('please draft a statement of claim for unpaid rent')).toBe(
      'Statement of claim for unpaid rent',
    )
  })
  it('caps the length', () => {
    expect(titleFromInstruction('x'.repeat(200)).length).toBeLessThanOrEqual(70)
  })
})

describe('relativeTime', () => {
  const now = new Date('2026-11-18T12:00:00Z').getTime()
  it('describes recent edits', () => {
    expect(relativeTime('2026-11-18T11:59:50Z', now)).toBe('just now')
    expect(relativeTime('2026-11-18T11:30:00Z', now)).toBe('30 min ago')
    expect(relativeTime('2026-11-17T10:00:00Z', now)).toBe('Yesterday')
  })
  it('is empty for missing or invalid dates', () => {
    expect(relativeTime(null, now)).toBe('')
    expect(relativeTime('not a date', now)).toBe('')
  })
})

describe('buildMatter', () => {
  const kase = {
    id: 'c1',
    title: 'Mensah v. Owusu',
    client_name: 'Ama Mensah',
    opposing_party: 'Kofi Owusu',
    court: 'High Court, Accra',
    suit_number: 'CM/0001/2026',
  } as Case

  it('combines case facts with document fields, preferring the document', () => {
    const m = buildMatter({ court: '', suit_number: 'CM/0002/2026', parties: null, judge: null }, kase)
    expect(m).toContain('Case: Mensah v. Owusu')
    expect(m).toContain('Opposing party: Kofi Owusu')
    expect(m).toContain('Court: High Court, Accra')
    expect(m).toContain('Suit number: CM/0002/2026')
  })

  it('is null when nothing is known', () => {
    expect(buildMatter({ court: null, suit_number: null, parties: null, judge: null }, undefined)).toBeNull()
  })
})
