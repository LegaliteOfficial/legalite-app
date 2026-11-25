import { describe, it, expect } from 'vitest'
import { hasPermission } from '../access'
import { NAV_ITEMS, visibleNavItems } from '@/components/layout/nav'

const ids = (perms: string[]) =>
  visibleNavItems(NAV_ITEMS, (s) => hasPermission(perms, s)).map((i) => i.id)

describe('hasPermission', () => {
  it('grants everything to the wildcard and nothing to an empty set', () => {
    expect(hasPermission(['*'], 'delete-tasks')).toBe(true)
    expect(hasPermission([], 'view-documents')).toBe(false)
  })
  it('matches exact slugs only', () => {
    expect(hasPermission(['view-documents'], 'view-documents')).toBe(true)
    expect(hasPermission(['view-documents'], 'edit-documents')).toBe(false)
  })
})

describe('navigation visibility', () => {
  it('shows everything to an owner or administrator', () => {
    const all = ids(['*'])
    for (const id of ['tasks', 'documents', 'billing']) expect(all).toContain(id)
  })
  it('hides Documents, Tasks and Billing from a member with none of those permissions', () => {
    const shown = ids(['create-cases'])
    for (const id of ['tasks', 'documents', 'billing']) expect(shown).not.toContain(id)
    expect(shown).toContain('cases')
  })
  it('shows Tasks for either task view permission', () => {
    expect(ids(['view-assigned-tasks'])).toContain('tasks')
    expect(ids(['view-all-tasks'])).toContain('tasks')
  })
  it('ties Documents to view-documents and Billing to view-bills', () => {
    expect(ids(['view-documents'])).toContain('documents')
    expect(ids(['view-bills'])).toContain('billing')
    expect(ids(['view-bills'])).not.toContain('documents')
  })
})
