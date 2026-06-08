import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react'
import {
  ConflictCheckQueryDoc,
  ConflictChecksQueryDoc,
  RecordConflictCheckMutationDoc,
} from '@/lib/graphql/conflicts'
import type { ConflictCheckQuery, ConflictChecksQuery } from '@/types/generated/graphql'

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

export type ConflictMatch = ConflictCheckQuery['conflictCheck'][number]
export type ConflictRecord = ConflictChecksQuery['conflictChecks'][number]

/**
 * On-demand conflict search. Call `run(query)` to search contacts + matters;
 * `data` holds the latest matches, `loading` flips while the search runs.
 */
export function useConflictSearch() {
  const [run, { data, loading, error }] = useLazyQuery(ConflictCheckQueryDoc, {
    fetchPolicy: 'network-only',
  })
  return {
    run: (query: string) => run({ variables: { query } }),
    matches: (data?.conflictCheck as ConflictMatch[] | undefined) ?? [],
    isLoading: loading,
    error,
  }
}

/** Past conflict-check runs (audit history). */
export function useConflictChecks() {
  const { data, loading, error, refetch } = useQuery(ConflictChecksQueryDoc, {
    skip: DEV_BYPASS,
    errorPolicy: DEV_BYPASS ? 'all' : 'none',
  })
  return {
    data: (DEV_BYPASS ? [] : (data?.conflictChecks as ConflictRecord[] | undefined)) ?? [],
    isLoading: DEV_BYPASS ? false : loading,
    error: DEV_BYPASS ? undefined : error,
    refetch,
  }
}

/** Run + persist a conflict check, returning the recorded result. */
export function useRecordConflictCheck() {
  const [mutate, state] = useMutation(RecordConflictCheckMutationDoc, {
    refetchQueries: [ConflictChecksQueryDoc],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async (query: string, notes?: string) => {
      const res = await mutate({ variables: { input: { query, notes } } })
      return res.data?.recordConflictCheck
    },
  }
}
