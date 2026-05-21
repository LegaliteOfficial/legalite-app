'use client'

import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  from,
} from '@apollo/client'
import { SetContextLink } from '@apollo/client/link/context'

const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:3001/graphql'

// Lifts the JWT off the persisted zustand store (key `ll:auth`, same shape
// the old axios interceptor read) and attaches it as a bearer token. Reading
// it per-request means token refresh / logout takes effect on the next call
// without re-creating the client.
function readToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem('ll:auth')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { state?: { token?: string } }
    return parsed?.state?.token ?? null
  } catch {
    return null
  }
}

// Apollo v4 swapped the SetContextLink argument order: it's now
// (prevContext, operation) — headers live on prevContext.
const authLink = new SetContextLink((prevContext) => {
  const token = readToken()
  const prevHeaders = (prevContext.headers ?? {}) as Record<string, string>
  return {
    headers: {
      ...prevHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }
})

const httpLink = new HttpLink({ uri: GRAPHQL_URL })

let _client: ApolloClient | null = null

export function getApolloClient(): ApolloClient {
  if (_client) return _client
  _client = new ApolloClient({
    link: from([authLink, httpLink]),
    cache: new InMemoryCache(),
  })
  return _client
}
