import { describe, expect, it } from 'vitest'

import { canCancelEvent } from '@/hooks/use-calendar'

const ORGANISER = 'profile-organiser'
const future = () => new Date(Date.now() + 60 * 60_000).toISOString()

const event = (overrides: Partial<Parameters<typeof canCancelEvent>[0]> = {}) => ({
  created_by: ORGANISER,
  status: 'confirmed',
  end_time: future(),
  outcome_status: null,
  ...overrides,
})

describe('canCancelEvent', () => {
  it('lets the organiser cancel their upcoming event', () => {
    expect(canCancelEvent(event(), ORGANISER, 'member')).toBe(true)
  })

  it('lets a firm owner or admin cancel anyone’s event', () => {
    expect(canCancelEvent(event(), 'someone-else', 'owner')).toBe(true)
    expect(canCancelEvent(event(), 'someone-else', 'admin')).toBe(true)
  })

  it('hides it from other members', () => {
    expect(canCancelEvent(event(), 'someone-else', 'member')).toBe(false)
    expect(canCancelEvent(event(), undefined, undefined)).toBe(false)
  })

  it('hides it once the event is cancelled, resolved, or over', () => {
    expect(canCancelEvent(event({ status: 'cancelled' }), ORGANISER, 'owner')).toBe(false)
    expect(canCancelEvent(event({ outcome_status: 'completed' }), ORGANISER, 'owner')).toBe(false)
    const past = new Date(Date.now() - 60_000).toISOString()
    expect(canCancelEvent(event({ end_time: past }), ORGANISER, 'owner')).toBe(false)
  })
})
