import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mutateAsync = vi.fn(async () => ({}))
vi.mock('@/hooks/use-documents', () => ({
  useAutosaveDocument: () => ({ isPending: false, mutateAsync }),
}))

import { useAutosave, type SavedFields } from '../use-autosave'

const base: SavedFields = {
  title: 'Claim',
  content: '',
  design: { paper: 'A4' },
  case_id: '',
  status: 'draft',
}

beforeEach(() => {
  vi.useFakeTimers()
  mutateAsync.mockClear()
})
afterEach(() => vi.useRealTimers())

describe('useAutosave', () => {
  it('saves only the changed fields after the debounce', async () => {
    const { result, rerender } = renderHook((f: SavedFields) => useAutosave('doc-1', f), { initialProps: base })
    rerender({ ...base, content: '<p>Hello</p>' })
    expect(result.current.state).toBe('pending')
    expect(mutateAsync).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1300)
    })
    expect(mutateAsync).toHaveBeenCalledTimes(1)
    expect(mutateAsync).toHaveBeenCalledWith({ id: 'doc-1', data: { content: '<p>Hello</p>' } })
    expect(result.current.state).toBe('saved')
  })

  it('saveNow with explicit values saves before React re-renders', async () => {
    const { result } = renderHook((f: SavedFields) => useAutosave('doc-1', f), { initialProps: base })
    let ok = false
    await act(async () => {
      ok = await result.current.saveNow({ content: '<p>From the editor</p>' })
    })
    expect(ok).toBe(true)
    expect(mutateAsync).toHaveBeenCalledWith({ id: 'doc-1', data: { content: '<p>From the editor</p>' } })
  })

  it('reports an error state when the save fails, and recovers on retry', async () => {
    mutateAsync.mockRejectedValueOnce(new Error('offline'))
    const { result, rerender } = renderHook((f: SavedFields) => useAutosave('doc-1', f), { initialProps: base })
    rerender({ ...base, title: 'New title' })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1300)
    })
    expect(result.current.state).toBe('error')

    await act(async () => {
      await result.current.saveNow()
    })
    expect(result.current.state).toBe('saved')
    expect(mutateAsync).toHaveBeenLastCalledWith({ id: 'doc-1', data: { title: 'New title' } })
  })
})
