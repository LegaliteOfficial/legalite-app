import { describe, it, expect, beforeEach } from 'vitest'
import { isSampleRecord, useBillsLocalStore } from '../bills-local.store'

describe('bills-local store', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts empty outside dev bypass', () => {
    expect(Object.keys(useBillsLocalStore.getState().bills)).toHaveLength(0)
    expect(Object.keys(useBillsLocalStore.getState().fund_balances)).toHaveLength(0)
  })

  it('identifies the old sample records by their sample clients', () => {
    expect(isSampleRecord({ client_id: 'dev-client-1' })).toBe(true)
    expect(isSampleRecord({ client_id: '6f1c2a5e-1d2b-4c3d-8e9f-0a1b2c3d4e5f' })).toBe(false)
  })

  it('drops persisted sample bills on load and keeps the user\'s own', async () => {
    const own = {
      id: 'bill-own',
      bill_number: 'B-0042',
      client_id: '6f1c2a5e-1d2b-4c3d-8e9f-0a1b2c3d4e5f',
      reminders: [],
    }
    const sample = { id: 'bill-dev-1', bill_number: 'B-0001', client_id: 'dev-client-1', reminders: [] }
    localStorage.setItem(
      'll:bills-local',
      JSON.stringify({
        state: {
          bills: { [own.id]: own, [sample.id]: sample },
          payments: { 'pay-dev-1': { id: 'pay-dev-1', client_id: 'dev-client-1' } },
          fund_requests: {},
          fund_balances: { 'dev-client-1': { client_id: 'dev-client-1' } },
          fund_movements: {},
        },
        version: 0,
      }),
    )

    await useBillsLocalStore.persist.rehydrate()

    const s = useBillsLocalStore.getState()
    expect(Object.keys(s.bills)).toEqual(['bill-own'])
    expect(Object.keys(s.payments)).toHaveLength(0)
    expect(Object.keys(s.fund_balances)).toHaveLength(0)
  })
})
