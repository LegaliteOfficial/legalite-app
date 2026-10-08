import { describe, it, expect } from 'vitest'
import {
  nextCaseCode,
  parseCaseCode,
  formatCaseCode,
  displayCaseCode,
} from '../case-code'

describe('parseCaseCode', () => {
  it('reads a generated code', () => {
    expect(parseCaseCode('LL-2026-0042')).toEqual({
      prefix: 'LL',
      year: 2026,
      sequence: 42,
    })
  })
  it('is case insensitive and trims', () => {
    expect(parseCaseCode('  ll-2026-0007 ')).toEqual({
      prefix: 'LL',
      year: 2026,
      sequence: 7,
    })
  })
  it('rejects anything it did not produce', () => {
    expect(parseCaseCode('Smith matter')).toBeNull()
    expect(parseCaseCode('LL-26-0042')).toBeNull()
    expect(parseCaseCode('LL-2026-42')).toBeNull()
    expect(parseCaseCode('')).toBeNull()
    expect(parseCaseCode(null)).toBeNull()
  })
})

describe('nextCaseCode', () => {
  it('starts at 0001 for a firm with no cases', () => {
    expect(nextCaseCode([], { year: 2026 })).toBe('LL-2026-0001')
  })

  it('continues from the highest existing code', () => {
    expect(
      nextCaseCode(['LL-2026-0001', 'LL-2026-0002'], { year: 2026 }),
    ).toBe('LL-2026-0003')
  })

  it('uses the highest, not the count, so deletions cannot reuse a code', () => {
    // 0002 was deleted; the next case must still be 0004.
    expect(nextCaseCode(['LL-2026-0001', 'LL-2026-0003'], { year: 2026 })).toBe(
      'LL-2026-0004',
    )
  })

  it('restarts the sequence each year', () => {
    expect(
      nextCaseCode(['LL-2025-0100', 'LL-2025-0101'], { year: 2026 }),
    ).toBe('LL-2026-0001')
  })

  it('ignores hand typed legacy codes', () => {
    expect(
      nextCaseCode(['Smith matter', 'ref/2024/8', 'LL-2026-0005'], {
        year: 2026,
      }),
    ).toBe('LL-2026-0006')
  })

  it('ignores null and empty entries', () => {
    expect(nextCaseCode([null, undefined, '', 'LL-2026-0009'], { year: 2026 })).toBe(
      'LL-2026-0010',
    )
  })

  it('keeps sequences from other prefixes separate', () => {
    expect(
      nextCaseCode(['AB-2026-0050', 'LL-2026-0002'], { year: 2026 }),
    ).toBe('LL-2026-0003')
  })

  it('honours a custom prefix', () => {
    expect(nextCaseCode(['MP-2026-0003'], { year: 2026, prefix: 'MP' })).toBe(
      'MP-2026-0004',
    )
  })

  it('pads beyond four digits without truncating', () => {
    expect(nextCaseCode(['LL-2026-9999'], { year: 2026 })).toBe('LL-2026-10000')
  })

  it('sorts as text in sequence order', () => {
    const codes = [1, 2, 10, 100].map((n) => formatCaseCode('LL', 2026, n))
    expect([...codes].sort()).toEqual(codes)
  })
})

describe('displayCaseCode', () => {
  it('returns null for a case with no code rather than inventing one', () => {
    expect(displayCaseCode(null)).toBeNull()
    expect(displayCaseCode('   ')).toBeNull()
  })
  it('passes a real code through', () => {
    expect(displayCaseCode('LL-2026-0042')).toBe('LL-2026-0042')
  })
})
