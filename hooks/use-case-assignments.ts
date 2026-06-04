import { useMutation, useQuery } from '@apollo/client/react'
import {
  CaseAssignmentsQueryDoc,
  SetCaseAssignmentsMutationDoc,
} from '@/lib/graphql/operations'
import type { CaseAssignmentsQuery } from '@/types/generated/graphql'


export type CaseAssignment = CaseAssignmentsQuery['caseAssignments'][number]

/** Effective ("responsible" | "originating" | "collaborator") roles. */
export const ASSIGNMENT_ROLE_LABEL: Record<string, string> = {
  responsible: 'Responsible',
  originating: 'Originating',
  collaborator: 'Collaborator',
}

export function useCaseAssignments(caseId?: string) {
  const { data, loading, error, refetch } = useQuery(CaseAssignmentsQueryDoc, {
    variables: { case_id: caseId ?? '' },
    errorPolicy: 'all',
  })
  return {
    data: data?.caseAssignments as CaseAssignment[] | undefined,
    isLoading: loading,
    error,
    refetch,
  }
}

/** Replace the full set of members assigned to a case. */
export function useSetCaseAssignments() {
  const [mutate, state] = useMutation(SetCaseAssignmentsMutationDoc, {
    refetchQueries: [CaseAssignmentsQueryDoc],
  })
  return {
    isPending: state.loading,
    mutateAsync: async (
      case_id: string,
      assignments: { member_id: string; assignment_role?: string }[],
    ) => {
      const res = await mutate({ variables: { input: { case_id, assignments } } })
      return res.data?.setCaseAssignments
    },
  }
}
