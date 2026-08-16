/**
 * GET /api/keep-alive
 * -------------------
 * Daily heartbeat that keeps the Supabase project from idling into an
 * auto-pause. Free-tier Supabase projects pause after ~7 days of no
 * activity, which takes down auth (login/signup) even though the app
 * and API stay up. A single lightweight read a day is enough to reset
 * that inactivity timer.
 *
 * Triggered by the Vercel Cron entry in vercel.json. The route issues
 * one trivial PostgREST query against the live database so the ping
 * counts as real DB activity — RLS may return zero rows, which is fine;
 * the query still executes against Postgres.
 *
 * If CRON_SECRET is set (recommended), Vercel Cron sends it as a bearer
 * token and the route rejects anything else, so the endpoint can't be
 * hammered by outside traffic.
 */

import { NextResponse } from 'next/server'

// Must run on every invocation and never be statically cached — the
// whole point is to actually reach Supabase each time it fires.
export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: Request) {
  // When a CRON_SECRET is configured, Vercel Cron attaches it as
  // `Authorization: Bearer <secret>`. Reject requests that don't carry
  // it so only the scheduled job (or someone who knows the secret) can
  // trigger the DB hit.
  if (CRON_SECRET) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { ok: false, error: 'Supabase env vars are not configured' },
      { status: 500 },
    )
  }

  // A minimal select against a real table exercises Postgres. `limit=1`
  // and `select=id` keep it as cheap as possible.
  const url = `${SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`
  try {
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      cache: 'no-store',
    })
    return NextResponse.json({
      ok: res.ok,
      supabaseStatus: res.status,
      at: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'unknown error',
        at: new Date().toISOString(),
      },
      { status: 502 },
    )
  }
}
