import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WorkspacePermissionCard } from '../WorkspacePermissionCard'
import { ProposedActionCard } from '../ProposedActionCard'
import { historyForRequest, type Turn } from '@/lib/ai/sessions'
import type { AskResponse, PermissionRequest } from '@/lib/ai/types'

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}))

afterEach(cleanup)

const request = (over: Partial<PermissionRequest> = {}): PermissionRequest => ({
  request_id: 'wsc_1',
  scopes: ['Search your cases for “Mensah”', 'Read your invoices'],
  tools: ['find_cases', 'list_invoices'],
  expires_at: Math.floor(Date.now() / 1000) + 600,
  reason: 'workspace',
  ...over,
})

describe('WorkspacePermissionCard', () => {
  it('lists what the assistant wants and reports each choice', async () => {
    const onDecide = vi.fn().mockResolvedValue(undefined)
    render(<WorkspacePermissionCard request={request()} onDecide={onDecide} />)
    expect(screen.getByText('Search your cases for “Mensah”')).toBeInTheDocument()
    expect(screen.getByText('Read your invoices')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Allow' }))
    await waitFor(() => expect(onDecide).toHaveBeenCalledWith('allow'))
    fireEvent.click(screen.getByRole('button', { name: 'Always allow' }))
    await waitFor(() => expect(onDecide).toHaveBeenCalledWith('always'))
    fireEvent.click(screen.getByRole('button', { name: /Don.t allow/ }))
    await waitFor(() => expect(onDecide).toHaveBeenCalledWith('deny'))
  })

  it('is read-only without a handler and says when the request expired', () => {
    render(<WorkspacePermissionCard request={request({ expires_at: 1 })} />)
    expect(screen.getByRole('button', { name: 'Allow' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('expired')
  })
})

describe('ProposedActionCard', () => {
  it('shows a before/after list for an edit', () => {
    render(
      <ProposedActionCard
        action={{
          id: 'a1',
          type: 'update_case',
          summary: 'Close case “Mensah v Owusu”',
          payload: { id: 'c1', input: { status: 'Closed' } },
          display: { case: 'Mensah v Owusu' },
          changes: [{ field: 'status', label: 'Status', from: 'Open', to: 'Closed' }],
        }}
      />,
    )
    const list = screen.getByRole('list', { name: 'Changes' })
    expect(list).toHaveTextContent('Status')
    expect(list).toHaveTextContent('Open')
    expect(list).toHaveTextContent('Closed')
    expect(screen.getByRole('button', { name: 'Apply changes' })).toBeInTheDocument()
  })
})

describe('historyForRequest', () => {
  it('leaves out turns that only asked for permission', () => {
    const paused = {
      answer: 'To answer this I need to look at your Legalite workspace.',
      answer_mode: 'permission_required',
      structured_answer: null,
    } as unknown as AskResponse
    const turns: Turn[] = [
      { role: 'user', content: 'Close the Mensah case', created_at: '' },
      { role: 'assistant', response: paused, created_at: '' },
    ] as Turn[]
    expect(historyForRequest(turns)).toEqual([{ role: 'user', content: 'Close the Mensah case' }])
  })
})
