import { useEffect } from 'react'
import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react'
import {
  ArchiveDownloadUrlQueryDoc,
  ArchiveEntriesQueryDoc,
  ArchiveEntryQueryDoc,
  DeleteArchiveEntryMutationDoc,
  ReprocessArchiveEntryMutationDoc,
  UpdateArchiveEntryMutationDoc,
} from '@/lib/graphql/archive'
import type {
  ArchiveEntriesQuery,
  ArchiveEntryQuery,
  UpdateArchiveEntryInput,
} from '@/types/generated/graphql'

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

export type ArchiveListEntry = ArchiveEntriesQuery['archiveEntries'][number]
export type ArchiveEntryDetail = ArchiveEntryQuery['archiveEntry']

/** How often the list refreshes while documents are still being read. */
const PROCESSING_POLL_MS = 4000

/**
 * The firm archive list. Polls while any entry is still being read so
 * statuses flip to ready / failed without a manual refresh.
 */
export function useArchiveEntries(search: string, documentType: string | null) {
  const { data, loading, error, refetch, startPolling, stopPolling } = useQuery(
    ArchiveEntriesQueryDoc,
    {
      variables: { search: search || null, documentType, limit: 200 },
      skip: DEV_BYPASS,
      notifyOnNetworkStatusChange: false,
    },
  )
  const entries = data?.archiveEntries ?? []
  const processing = entries.some((e) => e.status === 'processing')
  useEffect(() => {
    if (DEV_BYPASS) return
    if (processing) startPolling(PROCESSING_POLL_MS)
    else stopPolling()
    return () => stopPolling()
  }, [processing, startPolling, stopPolling])
  return {
    entries,
    isLoading: loading && !data,
    error,
    refetch,
    processingCount: entries.filter((e) => e.status === 'processing').length,
  }
}

export function useArchiveEntry(id: string | null) {
  const { data, loading, error, refetch } = useQuery(ArchiveEntryQueryDoc, {
    variables: { id: id ?? '' },
    skip: !id || DEV_BYPASS,
  })
  return { entry: data?.archiveEntry ?? null, isLoading: loading, error, refetch }
}

export function useArchiveDownload() {
  const [exec, state] = useLazyQuery(ArchiveDownloadUrlQueryDoc, { fetchPolicy: 'network-only' })
  return {
    isPending: state.loading,
    mutateAsync: async (id: string) => {
      const res = await exec({ variables: { id } })
      const url = res.data?.archiveDownloadUrl.url
      if (!url) throw new Error('No download URL returned')
      return url
    },
  }
}

export function useReprocessArchiveEntry() {
  const [mutate, state] = useMutation(ReprocessArchiveEntryMutationDoc, {
    refetchQueries: [ArchiveEntriesQueryDoc],
  })
  return {
    isPending: state.loading,
    mutateAsync: async (id: string) => {
      await mutate({ variables: { id } })
    },
  }
}

export function useUpdateArchiveEntry() {
  const [mutate, state] = useMutation(UpdateArchiveEntryMutationDoc, {
    refetchQueries: [ArchiveEntriesQueryDoc, ArchiveEntryQueryDoc],
  })
  return {
    isPending: state.loading,
    mutateAsync: async (id: string, input: UpdateArchiveEntryInput) => {
      const res = await mutate({ variables: { id, input } })
      return res.data?.updateArchiveEntry
    },
  }
}

export function useDeleteArchiveEntry() {
  const [mutate, state] = useMutation(DeleteArchiveEntryMutationDoc, {
    refetchQueries: [ArchiveEntriesQueryDoc],
  })
  return {
    isPending: state.loading,
    mutateAsync: async (id: string) => {
      await mutate({ variables: { id } })
    },
  }
}
