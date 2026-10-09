'use client'

/**
 * Data hooks for the client profile page. Each section calls the hook for
 * its own query and suspends inside its own <Suspense> boundary, so the
 * header, cases and conversation load and refetch independently. All
 * reads are skipped until hydration (see `useHydrated`) and fall back to
 * the shared dev samples in dev bypass.
 */

import { useMemo } from 'react'
import { skipToken, useMutation, useSuspenseQuery } from '@apollo/client/react'
import { ClientQueryDoc } from '@/lib/graphql/clients'
import { CasesQueryDoc } from '@/lib/graphql/cases'
import { MessagesQueryDoc, SendClientMessageMutationDoc } from '@/lib/graphql/comms'
import { DEV_SAMPLE_CLIENTS } from '@/hooks/use-clients'
import { DEV_SAMPLE_CASES, toCase, type WireCase } from '@/hooks/use-cases'
import { useHydrated } from '@/hooks/use-hydrated'
import type { Case, Client } from '@/types'
import type { MessagesQuery } from '@/types/generated/graphql'
import { useClientProfileStore, type MessageChannel } from '@/stores/client-profile.store'

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

export type ClientMessage = MessagesQuery['messages'][number]
export type { MessageChannel }

/** The client record. Suspends while loading. */
export function useClientRecord(id: string): { client: Client | undefined; ready: boolean } {
  const hydrated = useHydrated()
  const retryNonce = useClientProfileStore((s) => s.retryNonce)
  const { data } = useSuspenseQuery(
    ClientQueryDoc,
    hydrated && !DEV_BYPASS ? { variables: { id }, queryKey: ['client-profile', retryNonce] } : skipToken,
  )
  if (DEV_BYPASS) {
    return { client: DEV_SAMPLE_CLIENTS.find((c) => c.id === id), ready: hydrated }
  }
  return { client: data?.client as Client | undefined, ready: hydrated }
}

/**
 * Cases where this client is the primary client, open matters first and
 * then most recently opened. Reads the firm's cases query, which other
 * pages keep warm in the cache.
 */
export function useClientCases(clientId: string): { cases: Case[]; ready: boolean } {
  const hydrated = useHydrated()
  const retryNonce = useClientProfileStore((s) => s.retryNonce)
  const { data } = useSuspenseQuery(
    CasesQueryDoc,
    hydrated && !DEV_BYPASS ? { queryKey: ['client-profile', retryNonce] } : skipToken,
  )

  const cases = useMemo(() => {
    const all = DEV_BYPASS
      ? DEV_SAMPLE_CASES
      : ((data?.cases ?? []) as WireCase[]).map(toCase)
    const rank = (c: Case) => (c.status === 'Open' ? 0 : c.status === 'Pending' ? 1 : 2)
    return all
      .filter((c) => c.client_id === clientId)
      .sort(
        (a, b) =>
          rank(a) - rank(b) ||
          (b.date_opened ?? b.created_at).localeCompare(a.date_opened ?? a.created_at),
      )
  }, [data, clientId])

  return { cases, ready: hydrated }
}

/** Messages exchanged with this client, newest first. Suspends while loading. */
export function useClientMessages(clientId: string): { messages: ClientMessage[]; ready: boolean } {
  const hydrated = useHydrated()
  const retryNonce = useClientProfileStore((s) => s.retryNonce)
  const { data } = useSuspenseQuery(
    MessagesQueryDoc,
    hydrated && !DEV_BYPASS
      ? { variables: { clientId, channel: null }, queryKey: ['client-profile', retryNonce] }
      : skipToken,
  )
  return { messages: data?.messages ?? [], ready: hydrated }
}

/**
 * Sends an email (delivered by the backend) or prepares a WhatsApp
 * hand-off (returns a click-to-chat link). Either way the message is
 * recorded on the client's history.
 */
export function useSendClientMessage() {
  const [mutate, state] = useMutation(SendClientMessageMutationDoc, {
    refetchQueries: [MessagesQueryDoc],
  })
  return {
    isPending: state.loading,
    send: async (input: {
      client_id: string
      channel: MessageChannel
      subject?: string
      body: string
    }): Promise<{ whatsappUrl: string | null }> => {
      if (DEV_BYPASS) {
        // No backend in dev bypass. Mirror the WhatsApp hand-off so the
        // flow can still be exercised; email has nothing to deliver to.
        return { whatsappUrl: input.channel === 'whatsapp' ? 'https://wa.me/' : null }
      }
      const res = await mutate({ variables: { input } })
      return { whatsappUrl: res.data?.sendClientMessage.whatsapp_url ?? null }
    },
  }
}
