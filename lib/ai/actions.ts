'use client'

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ReactMarkdown from 'react-markdown'

import { getApolloClient } from '@/lib/apollo'
import { CreateCalendarEventMutationDoc } from '@/lib/graphql/calendar'
import { CreateCaseMutationDoc, UpdateCaseMutationDoc } from '@/lib/graphql/cases'
import { CreateClientMutationDoc, UpdateClientMutationDoc } from '@/lib/graphql/clients'
import { CreateDeadlineMutationDoc, UpdateDeadlineMutationDoc } from '@/lib/graphql/deadlines'
import { CreateDocumentMutationDoc, UpdateDocumentMutationDoc } from '@/lib/graphql/documents'
import { CreateTaskMutationDoc, UpdateTaskMutationDoc } from '@/lib/graphql/tasks'
import type {
  CreateCalendarEventInput,
  CreateCaseInput,
  CreateClientInput,
  CreateDeadlineInput,
  CreateDocumentInput,
  CreateTaskInput,
  UpdateCaseInput,
  UpdateClientInput,
  UpdateDeadlineInput,
  UpdateTaskInput,
} from '@/types/generated/graphql'
import type { ProposedAction } from './types'

/**
 * Executes a record the assistant proposed, after the user confirmed it.
 *
 * The AI service never writes to the workspace. It returns a proposal
 * (`AskResponse.proposed_actions`); the confirmation card calls this,
 * which runs the same GraphQL mutations the rest of the app uses, with
 * the user's own session. Permissions and validation therefore stay in
 * the backend.
 */
export interface ActionResult {
  recordId: string
  href: string
  label: string
}

const REFETCH: Record<ProposedAction['type'], string[]> = {
  create_case: ['Cases', 'Clients', 'DashboardStats'],
  create_client: ['Clients', 'DashboardStats'],
  create_deadline: ['Deadlines', 'DeadlineStats', 'AttentionFeed'],
  create_task: ['Tasks', 'DashboardStats'],
  create_document: ['Documents', 'DocumentFolders', 'DashboardStats'],
  create_event: ['CalendarEvents', 'PendingDueEvents', 'AttentionFeed'],
  update_task: ['Tasks', 'DashboardStats'],
  update_deadline: ['Deadlines', 'DeadlineStats', 'AttentionFeed'],
  update_case: ['Cases', 'Case', 'DashboardStats', 'AttentionFeed'],
  update_client: ['Clients', 'Client'],
  link_documents: ['Documents', 'Case'],
}

export async function executeProposedAction(action: ProposedAction): Promise<ActionResult> {
  const client = getApolloClient()
  const refetchQueries = REFETCH[action.type]
  const payload = { ...action.payload }

  switch (action.type) {
    case 'create_client': {
      const res = await client.mutate({
        mutation: CreateClientMutationDoc,
        variables: { input: payload as CreateClientInput },
        refetchQueries,
      })
      const id = res.data?.createClient.id
      if (!id) throw new Error('The client was not created.')
      return { recordId: id, href: `/clients/${id}`, label: 'Open client' }
    }
    case 'create_case': {
      // A proposal may carry a brand-new client; create it first.
      const newClient = payload.new_client as CreateClientInput | undefined
      delete payload.new_client
      if (newClient) {
        const res = await client.mutate({
          mutation: CreateClientMutationDoc,
          variables: { input: { status: 'Active', ...newClient } },
        })
        const clientId = res.data?.createClient.id
        if (!clientId) throw new Error('The client for this case was not created.')
        payload.client_id = clientId
      }
      const res = await client.mutate({
        mutation: CreateCaseMutationDoc,
        variables: { input: payload as CreateCaseInput },
        refetchQueries,
      })
      const id = res.data?.createCase.id
      if (!id) throw new Error('The case was not created.')
      return { recordId: id, href: `/cases/${id}`, label: 'Open case' }
    }
    case 'create_deadline': {
      const res = await client.mutate({
        mutation: CreateDeadlineMutationDoc,
        variables: { input: payload as CreateDeadlineInput },
        refetchQueries,
      })
      const id = res.data?.createDeadline.id
      if (!id) throw new Error('The deadline was not created.')
      const caseId = payload.case_id as string | undefined
      return caseId
        ? { recordId: id, href: `/cases/${caseId}`, label: 'Open case' }
        : { recordId: id, href: '/calendar', label: 'Open calendar' }
    }
    case 'create_task': {
      const res = await client.mutate({
        mutation: CreateTaskMutationDoc,
        variables: { input: payload as CreateTaskInput },
        refetchQueries,
      })
      const id = res.data?.createTask.id
      if (!id) throw new Error('The task was not created.')
      return { recordId: id, href: '/tasks', label: 'Open tasks' }
    }
    case 'create_event': {
      const res = await client.mutate({
        mutation: CreateCalendarEventMutationDoc,
        variables: { input: payload as CreateCalendarEventInput },
        refetchQueries,
      })
      const id = res.data?.createCalendarEvent.id
      if (!id) throw new Error('The event was not created.')
      return { recordId: id, href: '/calendar', label: 'Open calendar' }
    }
    case 'update_task': {
      const res = await client.mutate({
        mutation: UpdateTaskMutationDoc,
        variables: { id: String(payload.id), input: payload.input as UpdateTaskInput },
        refetchQueries,
      })
      const id = res.data?.updateTask.id
      if (!id) throw new Error('The task was not updated.')
      return { recordId: id, href: '/tasks', label: 'Open tasks' }
    }
    case 'update_deadline': {
      const res = await client.mutate({
        mutation: UpdateDeadlineMutationDoc,
        variables: { id: String(payload.id), input: payload.input as UpdateDeadlineInput },
        refetchQueries,
      })
      const id = res.data?.updateDeadline.id
      if (!id) throw new Error('The deadline was not updated.')
      return { recordId: id, href: '/calendar', label: 'Open calendar' }
    }
    case 'update_case': {
      const id = String(payload.id)
      const res = await client.mutate({
        mutation: UpdateCaseMutationDoc,
        variables: { id, input: payload.input as UpdateCaseInput },
        refetchQueries,
      })
      if (!res.data?.updateCase.id) throw new Error('The case was not updated.')
      return { recordId: id, href: `/cases/${id}`, label: 'Open case' }
    }
    case 'update_client': {
      const id = String(payload.id)
      const res = await client.mutate({
        mutation: UpdateClientMutationDoc,
        variables: { id, input: payload.input as UpdateClientInput },
        refetchQueries,
      })
      if (!res.data?.updateClient.id) throw new Error('The client was not updated.')
      return { recordId: id, href: `/clients/${id}`, label: 'Open client' }
    }
    case 'link_documents': {
      const caseId = String(payload.case_id)
      const ids = Array.isArray(payload.document_ids) ? payload.document_ids.map(String) : []
      if (ids.length === 0) throw new Error('No documents to file.')
      // One mutation per document; report a partial result honestly
      // rather than claiming all were filed.
      const results = await Promise.allSettled(
        ids.map((id) =>
          client.mutate({
            mutation: UpdateDocumentMutationDoc,
            variables: { id, input: { case_id: caseId } },
          }),
        ),
      )
      await client.refetchQueries({ include: refetchQueries })
      const failed = results.filter((r) => r.status === 'rejected').length
      if (failed === ids.length) throw new Error('The documents could not be filed under this case.')
      if (failed > 0) {
        throw new Error(
          `${ids.length - failed} of ${ids.length} documents were filed; ${failed} could not be moved. Try again for the rest.`,
        )
      }
      return { recordId: caseId, href: `/cases/${caseId}?tab=documents`, label: 'Open case documents' }
    }
    case 'create_document': {
      // The assistant writes markdown; the document editor stores HTML.
      if (payload.content_format === 'markdown' && typeof payload.content === 'string') {
        payload.content = markdownToHtml(payload.content)
      }
      delete payload.content_format
      const res = await client.mutate({
        mutation: CreateDocumentMutationDoc,
        variables: { input: payload as CreateDocumentInput },
        refetchQueries,
      })
      const id = res.data?.createDocument.id
      if (!id) throw new Error('The document was not saved.')
      return { recordId: id, href: `/documents/${id}`, label: 'Open document' }
    }
  }
}

export function markdownToHtml(markdown: string): string {
  return renderToStaticMarkup(createElement(ReactMarkdown, null, markdown))
}

// ── Per-browser memory of what the user did with each proposal ──────────
// Conversations live in localStorage (lib/ai/sessions.ts); proposal
// outcomes sit beside them so a reloaded thread shows "Created" rather
// than offering to create the same record twice.

export type ActionState =
  | { status: 'confirmed'; result: ActionResult }
  | { status: 'dismissed' }

const STORE_KEY = 'll:ai-action-state'

function readAll(): Record<string, ActionState> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, ActionState>) : {}
  } catch {
    return {}
  }
}

export function getActionState(id: string): ActionState | null {
  return readAll()[id] ?? null
}

export function setActionState(id: string, state: ActionState): void {
  if (typeof window === 'undefined') return
  try {
    const all = readAll()
    all[id] = state
    // Keep the map bounded; drop the oldest entries first.
    const keys = Object.keys(all)
    for (const k of keys.slice(0, Math.max(0, keys.length - 500))) delete all[k]
    window.localStorage.setItem(STORE_KEY, JSON.stringify(all))
  } catch {
    // storage full or blocked: the card still works for this session
  }
}
