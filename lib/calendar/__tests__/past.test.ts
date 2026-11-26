import { describe, it, expect } from 'vitest'
import { isPastStart, todayInputValue } from '../past'

const NOW = new Date(2026, 10, 26, 12, 0, 0)

describe('isPastStart', () => {
  it('accepts a start later today', () => {
    expect(isPastStart(new Date(2026, 10, 26, 13, 0), NOW)).toBe(false)
  })

  it('allows a minute of leeway', () => {
    expect(isPastStart(new Date(2026, 10, 26, 11, 59, 30), NOW)).toBe(false)
  })

  it('flags a start that has passed', () => {
    expect(isPastStart(new Date(2026, 10, 26, 9, 0), NOW)).toBe(true)
    expect(isPastStart(new Date(2026, 10, 25, 13, 0), NOW)).toBe(true)
  })
})

describe('todayInputValue', () => {
  it('formats the local date for a date input', () => {
    expect(todayInputValue(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
  })
})
