import { useMutation, useQuery } from '@apollo/client/react'
import {
  CreateTagMutationDoc,
  DeleteTagMutationDoc,
  SetContactTagsMutationDoc,
  TagContactsMutationDoc,
  TagsQueryDoc,
  UpdateTagMutationDoc,
} from '@/lib/graphql/tags'
import { ClientsQueryDoc } from '@/lib/graphql/clients'
import type { TagsQuery } from '@/types/generated/graphql'

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

export type Tag = TagsQuery['tags'][number]

/** Preset palette shown in the colour picker on the Tag settings dialog. */
export const TAG_COLOURS = [
  '#0EA5E9', // sky
  '#22C55E', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#6B7280', // gray
  '#C9972B', // brand gold
] as const

export function useTags() {
  const { data, loading, error, refetch } = useQuery(TagsQueryDoc, {
    skip: DEV_BYPASS,
    errorPolicy: DEV_BYPASS ? 'all' : 'none',
  })
  return {
    data: (DEV_BYPASS ? [] : (data?.tags as Tag[] | undefined)) ?? [],
    isLoading: DEV_BYPASS ? false : loading,
    error: DEV_BYPASS ? undefined : error,
    refetch,
  }
}

export function useCreateTag() {
  const [mutate, state] = useMutation(CreateTagMutationDoc, {
    refetchQueries: [TagsQueryDoc],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async (input: { name: string; color?: string }) => {
      const res = await mutate({ variables: { input } })
      return res.data?.createTag
    },
  }
}

export function useUpdateTag() {
  const [mutate, state] = useMutation(UpdateTagMutationDoc, {
    // Tag colour/name change ripples into every contact chip.
    refetchQueries: [TagsQueryDoc, ClientsQueryDoc],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async (id: string, input: { name?: string; color?: string }) => {
      const res = await mutate({ variables: { id, input } })
      return res.data?.updateTag
    },
  }
}

export function useDeleteTag() {
  const [mutate, state] = useMutation(DeleteTagMutationDoc, {
    // Deleting a tag removes it from every contact it was on.
    refetchQueries: [TagsQueryDoc, ClientsQueryDoc],
  })
  return {
    isPending: state.loading,
    mutateAsync: async (id: string) => {
      await mutate({ variables: { id } })
    },
  }
}

/** Replace the full tag set on one contact. */
export function useSetContactTags() {
  const [mutate, state] = useMutation(SetContactTagsMutationDoc, {
    refetchQueries: [ClientsQueryDoc],
  })
  return {
    isPending: state.loading,
    error: state.error,
    mutateAsync: async (client_id: string, tag_ids: string[]) => {
      const res = await mutate({ variables: { input: { client_id, tag_ids } } })
      return res.data?.setContactTags
    },
  }
}

/** Bulk-add one tag to many contacts (list "tag selected" action). */
export function useTagContacts() {
  const [mutate, state] = useMutation(TagContactsMutationDoc, {
    refetchQueries: [ClientsQueryDoc],
  })
  return {
    isPending: state.loading,
    mutateAsync: async (client_ids: string[], tag_id: string) => {
      const res = await mutate({ variables: { input: { client_ids, tag_id } } })
      return res.data?.tagContacts ?? 0
    },
  }
}
