/**
 * Regression: after an AI "fill" draft the document was not saved.
 *
 * The draft streams into the page with TipTap updates suppressed, and the
 * final version is identical to the streamed one, so TipTap emits no
 * `update` and autosave never heard about the new content. The hook must
 * hand the page content over explicitly when a fill ends.
 */

import { act, renderHook, waitFor } from '@testing-library/react'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn(), message: vi.fn() } }))

const streamEvents: { current: Array<{ event: string; data: unknown }> } = { current: [] }
vi.mock('@/lib/ai/drafting', async (orig) => {
  const actual = await orig<typeof import('@/lib/ai/drafting')>()
  return {
    ...actual,
    draftStream: async function* () {
      for (const e of streamEvents.current) yield e
    },
  }
})

import { useDraftAssistant } from '../use-draft-assistant'

const ctx = () => ({ title: 'Claim', matter: null, useAuthorities: false })

function makeEditor() {
  return new Editor({ extensions: [StarterKit], content: '' })
}

let editor: Editor | null = null
afterEach(() => {
  editor?.destroy()
  editor = null
})

describe('useDraftAssistant fill', () => {
  it('hands the finished draft to onContent even though TipTap emits no update', async () => {
    editor = makeEditor()
    const updates = vi.fn()
    editor.on('update', updates)
    const onContent = vi.fn()
    streamEvents.current = [
      { event: 'delta', data: { text: '<p>The plaintiff ' } },
      { event: 'delta', data: { text: 'claims GHS 5,000.</p>' } },
      { event: 'completed', data: { mode: 'generate', text: '<p>The plaintiff claims GHS 5,000.</p>', sources: [] } },
    ]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result } = renderHook(() => useDraftAssistant(editor as any, ctx, onContent))
    act(() => result.current.generate('Draft a claim'))

    await waitFor(() => expect(result.current.run?.phase).toBe('done'))
    expect(editor.getHTML()).toBe('<p>The plaintiff claims GHS 5,000.</p>')
    // The bug: no doc-changing update fires at the end of the stream...
    const docUpdates = updates.mock.calls.filter(([e]) => e.transaction?.docChanged)
    expect(docUpdates).toHaveLength(0)
    // ...so the hook must report the content itself.
    expect(onContent).toHaveBeenLastCalledWith('<p>The plaintiff claims GHS 5,000.</p>')
    expect(editor.isEditable).toBe(true)
  })

  it('reports partial content when the stream fails midway', async () => {
    editor = makeEditor()
    const onContent = vi.fn()
    streamEvents.current = [
      { event: 'delta', data: { text: '<p>Half a draft</p>' } },
      { event: 'error', data: { message: 'boom' } },
    ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result } = renderHook(() => useDraftAssistant(editor as any, ctx, onContent))
    act(() => result.current.generate('Draft a claim'))

    await waitFor(() => expect(result.current.run?.phase).toBe('error'))
    expect(onContent).toHaveBeenLastCalledWith('<p>Half a draft</p>')
    expect(editor.isEditable).toBe(true)
  })

  it('reports the cleared page when the draft is removed', async () => {
    editor = makeEditor()
    const onContent = vi.fn()
    streamEvents.current = [
      { event: 'completed', data: { mode: 'generate', text: '<p>Draft</p>', sources: [] } },
    ]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result } = renderHook(() => useDraftAssistant(editor as any, ctx, onContent))
    act(() => result.current.generate('Draft a claim'))
    await waitFor(() => expect(result.current.run?.phase).toBe('done'))

    act(() => result.current.undoFill())
    expect(onContent).toHaveBeenLastCalledWith('<p></p>')
  })
})
