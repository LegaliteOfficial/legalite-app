import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Browser-side Supabase client for the LegaLite app.
 *
 * Uses the bare `@supabase/supabase-js` client (NOT @supabase/ssr) so that:
 *  - PKCE flow stores the code-verifier in localStorage (default), which
 *    survives the OAuth round-trip through Google reliably.
 *  - The /auth/callback page (also a client component) creates the same
 *    flavour of client and reads the verifier from the same localStorage.
 *  - We're not relying on cookies to ferry the verifier from browser to
 *    a server route — that round-trip kept failing on production with
 *    "PKCE code verifier not found in storage" because @supabase/ssr's
 *    cookie writes for the verifier weren't reliably persisting on
 *    redirect.
 *
 * Use a singleton so signInWithOAuth and exchangeCodeForSession share
 * the same in-memory state too (extra safety net in case the user clicks
 * Continue with Google twice).
 */
let cached: SupabaseClient | null = null

export function createSupabaseClient(): SupabaseClient {
  if (cached) return cached

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is not set. Add it to .env and restart the dev server.',
    )
  }
  if (!anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Add it to .env and restart the dev server.',
    )
  }

  cached = createClient(
    url,
    anonKey,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // we handle the OAuth code exchange manually in /auth/callback
      },
    },
  )
  return cached
}
