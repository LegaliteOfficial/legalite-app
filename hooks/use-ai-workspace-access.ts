import { useMutation, useQuery } from '@apollo/client/react'
import {
  AiConsentEventsQueryDoc,
  AiWorkspaceAccessQueryDoc,
  RecordAiConsentMutationDoc,
  SetAiWorkspaceAccessMutationDoc,
} from '@/lib/graphql/ai-consent'
import { toast } from 'sonner'
import type { PermissionRequest, WorkspaceAccessMode, WorkspaceConsent } from '@/lib/ai/types'

export const WORKSPACE_ACCESS_LABEL: Record<WorkspaceAccessMode, string> = {
  ask: 'Ask every time',
  always: 'Always allow',
  never: 'Never allow',
}

function asMode(v: string | null | undefined): WorkspaceAccessMode {
  return v === 'always' || v === 'never' ? v : 'ask'
}

/** The user's standing workspace-access preference. */
export function useAiWorkspaceAccess() {
  const { data, loading, error, refetch } = useQuery(AiWorkspaceAccessQueryDoc, {
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
  })
  return {
    mode: asMode(data?.aiWorkspaceAccess.mode),
    isSet: data?.aiWorkspaceAccess.is_set ?? false,
    updatedAt: data?.aiWorkspaceAccess.updated_at ?? null,
    isLoading: loading && !data,
    error,
    refetch,
  }
}

export function useAiConsentEvents(limit = 20) {
  const { data, loading, error, refetch } = useQuery(AiConsentEventsQueryDoc, {
    variables: { limit },
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
  })
  return { data: data?.aiConsentEvents, isLoading: loading && !data, error, refetch }
}

export function useSetAiWorkspaceAccess() {
  const [mutate, state] = useMutation(SetAiWorkspaceAccessMutationDoc, {
    refetchQueries: [AiWorkspaceAccessQueryDoc, AiConsentEventsQueryDoc],
  })
  return {
    isPending: state.loading,
    mutateAsync: async (
      mode: WorkspaceAccessMode,
      opts: { source?: 'prompt' | 'settings'; requestId?: string } = {},
    ) => {
      const res = await mutate({
        variables: {
          input: { mode, source: opts.source ?? 'settings', request_id: opts.requestId },
        },
      })
      return asMode(res.data?.setAiWorkspaceAccess.mode)
    },
  }
}

/**
 * Record an answer to a permission card in the audit trail. Never
 * throws: a failed audit write must not block the user's request.
 */
export function useRecordAiConsent() {
  const [mutate] = useMutation(RecordAiConsentMutationDoc)
  return async (decision: 'allow_once' | 'deny', requestId: string, scopes: string[]) => {
    try {
      await mutate({ variables: { input: { decision, request_id: requestId, scopes } } })
    } catch {
      // Best effort; the AI service logs the decision as well.
    }
  }
}

/**
 * Turn a permission-card choice into the consent sent with the resend:
 * "Always allow" saves the preference (and is audited by that mutation),
 * "Allow" / "Don't allow" are recorded in the audit trail. A failure to
 * save "Always allow" still allows this one question, and says so.
 */
export function useResolveWorkspacePermission() {
  const setAccess = useSetAiWorkspaceAccess()
  const record = useRecordAiConsent()
  return async (
    choice: 'allow' | 'always' | 'deny',
    request: PermissionRequest,
  ): Promise<WorkspaceConsent> => {
    if (choice === 'always') {
      try {
        await setAccess.mutateAsync('always', { source: 'prompt', requestId: request.request_id })
        toast.success('Legalite AI will use your workspace without asking. You can change this in Settings.')
      } catch (err) {
        const reason = err instanceof Error && err.message ? `: ${err.message}` : ''
        toast.error(`Could not save "Always allow"${reason}. Allowed for this question only.`)
      }
    } else {
      void record(choice === 'allow' ? 'allow_once' : 'deny', request.request_id, request.scopes)
    }
    return { decision: choice === 'deny' ? 'deny' : 'allow', request_id: request.request_id }
  }
}
