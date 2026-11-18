import { describe, expect, it } from 'vitest'
import { attentionItems, daysUntil, mergeDetails, parseCaseDetails, relativeDays, urgencyOf } from '../case-details'

const NOW = new Date(2026, 10, 18, 15, 30)

describe('parseCaseDetails', () => {
  it('fills defaults for missing or malformed details', () => {
    const d = parseCaseDetails('not json')
    expect(d.is_billable).toBe(true)
    expect(d.billing_method).toBe('hourly')
    expect(d.currency).toBe('GHS')
    expect(d.permissions_mode).toBe('everyone')
    expect(d.tags).toEqual([])
    expect(d.use_firm_settings_originating).toBe(true)
  })

  it('keeps stored values and drops blank list entries', () => {
    const d = parseCaseDetails(JSON.stringify({ is_billable: false, tags: ['Urgent', ''], related_contacts: [{ contact_id: '' }, { contact_id: 'c1' }] }))
    expect(d.is_billable).toBe(false)
    expect(d.tags).toEqual(['Urgent'])
    expect(d.related_contacts).toHaveLength(1)
  })

  it('mergeDetails preserves keys it does not touch', () => {
    const raw = JSON.stringify({ location: 'Accra', statute_of_limitations_satisfied: false })
    const next = JSON.parse(mergeDetails(raw, { statute_of_limitations_satisfied: true }))
    expect(next).toEqual({ location: 'Accra', statute_of_limitations_satisfied: true })
  })
})

describe('dates', () => {
  it('counts whole local days, treating YYYY-MM-DD as a local date', () => {
    expect(daysUntil('2026-11-18', NOW)).toBe(0)
    expect(daysUntil('2026-11-25', NOW)).toBe(7)
    expect(daysUntil('2026-11-15', NOW)).toBe(-3)
    expect(daysUntil(null, NOW)).toBeNull()
  })

  it('describes and buckets the distance', () => {
    expect(relativeDays(1)).toBe('tomorrow')
    expect(relativeDays(-3)).toBe('3 days ago')
    expect(urgencyOf(-1)).toBe('overdue')
    expect(urgencyOf(5)).toBe('urgent')
    expect(urgencyOf(20)).toBe('soon')
    expect(urgencyOf(90)).toBe('later')
  })
})

describe('attentionItems', () => {
  const base = { status: 'Open', statuteSatisfied: false, overdueTasks: 0, responsible: 'A. Mensah', teamSize: 1 }

  it('is empty for a closed case', () => {
    expect(attentionItems({ ...base, status: 'Closed', overdueTasks: 4 })).toEqual([])
  })

  it('flags overdue tasks, a missing owner and a lapsed unsatisfied statute', () => {
    const items = attentionItems({ ...base, overdueTasks: 2, responsible: '', teamSize: 0, statuteDate: '2020-01-01' })
    expect(items.map((i) => i.id)).toEqual(['sol-past', 'tasks', 'owner'])
  })

  it('ignores a satisfied statute', () => {
    expect(attentionItems({ ...base, statuteDate: '2020-01-01', statuteSatisfied: true })).toEqual([])
  })
})
