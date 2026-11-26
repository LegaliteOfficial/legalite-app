'use client'

import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  Observable,
  from,
} from '@apollo/client'
import { CombinedGraphQLErrors } from '@apollo/client/errors'
import { SetContextLink } from '@apollo/client/link/context'
import { ErrorLink } from '@apollo/client/link/error'
import { useAuthStore } from '@/stores/auth.store'
import { getAccessToken, refreshAccessToken } from '@/lib/auth/session-client'

// Backend defaults to port 3001 (see legalite-backend/src/main.ts). The
// GraphQL endpoint is at /graphql because the GraphQLModule opts out of
// useGlobalPrefix; if you re-enable that flag, change this to /api/graphql.
const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'https://legalite-backend-production.up.railway.app/graphql'

/**
 * The access token currently held in memory, without refreshing it. Prefer
 * `getAccessToken()` from lib/auth/session-client in async code: it renews a
 * token that is about to expire.
 */
export function readToken(): string | null {
  if (typeof window === 'undefined') return null
  return useAuthStore.getState().token
}

function withBearer(headers: unknown, token: string | null): Record<string, string> {
  const prev = (headers ?? {}) as Record<string, string>
  const next = { ...prev }
  delete next.Authorization
  if (token) next.Authorization = `Bearer ${token}`
  return next
}

// Apollo v4 swapped the SetContextLink argument order: it's now
// (prevContext, operation) — headers live on prevContext. Async, so a token
// that is about to expire is renewed before the request goes out.
const authLink = new SetContextLink(async (prevContext) => {
  const token = typeof window === 'undefined' ? null : await getAccessToken()
  return { headers: withBearer(prevContext.headers, token) }
})

// If the API still says the token is no good (revoked, clock skew), renew it
// once and retry the operation. A second failure goes to the caller.
const retryLink = new ErrorLink(({ error, operation, forward }) => {
  if (typeof window === 'undefined') return
  const unauthenticated =
    CombinedGraphQLErrors.is(error) &&
    error.errors.some((e) => e.extensions?.code === 'UNAUTHENTICATED')
  if (!unauthenticated) return
  const ctx = operation.getContext() as { authRetried?: boolean }
  if (ctx.authRetried || !useAuthStore.getState().isAuthenticated) return
  return new Observable((observer) => {
    let inner: { unsubscribe(): void } | null = null
    let closed = false
    void refreshAccessToken().then((outcome) => {
      if (closed) return
      if (outcome !== 'ok') {
        observer.error(error)
        return
      }
      operation.setContext((prev: { headers?: unknown }) => ({
        authRetried: true,
        headers: withBearer(prev.headers, useAuthStore.getState().token),
      }))
      inner = forward(operation).subscribe(observer)
    })
    return () => {
      closed = true
      inner?.unsubscribe()
    }
  })
})

const httpLink = new HttpLink({ uri: GRAPHQL_URL })

let _client: ApolloClient | null = null

export function getApolloClient(): ApolloClient {
  if (_client) return _client
  _client = new ApolloClient({
    link: from([retryLink, authLink, httpLink]),
    cache: new InMemoryCache(),
  })
  return _client
}
