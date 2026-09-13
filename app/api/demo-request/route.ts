/**
 * POST /api/demo-request
 * ----------------------
 * Handles the public "Request a demo" form on the marketing site.
 *
 * Step one of the onboarding flow: a firm submits their details, we email
 * them an invitation to meet the LegaLite team (online or in person) and a
 * button that starts account setup. A separate notification goes to the
 * team so a new lead is visible without checking a dashboard.
 *
 * The account itself is NOT created here yet. The button currently points at
 * the signup page with the firm details prefilled. Once the backend issues
 * real firm_invitations tokens (see docs/TENANCY.md), swap buildLoginUrl to
 * produce /accept-invite?token=... instead, and the same email keeps working.
 *
 * Runs on the Node runtime because the Resend SDK is not edge compatible.
 */

import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { demoRequestSchema } from '@/schemas'
import {
  prospectEmail,
  teamNotificationEmail,
  type DemoRequestDetails,
} from '@/lib/email/templates'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RESEND_API_KEY = process.env.RESEND_API_KEY
// Must be an address on a domain verified in Resend, or delivery fails.
const FROM = process.env.DEMO_REQUEST_FROM ?? 'LegaLite <team@legalite.app>'
// Where the internal notification lands.
const TEAM_INBOX = process.env.DEMO_REQUEST_TEAM_INBOX ?? 'contact@legalite.app'

/**
 * The destination of the "Log in to the application" button. Prefilling the
 * signup form means the recipient confirms or edits their firm name and
 * email rather than retyping them, which is the behaviour we want on day one
 * and stays true once real invitation tokens replace this.
 */
function buildLoginUrl(origin: string, details: DemoRequestDetails): string {
  const url = new URL('/signup', origin)
  url.searchParams.set('email', details.email)
  url.searchParams.set('firm', details.company)
  url.searchParams.set('name', details.name)
  return url.toString()
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 })
  }

  // Validate server side as well as in the form: the route is public.
  const parsed = demoRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Please check the details you entered.',
        issues: parsed.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      },
      { status: 422 },
    )
  }

  if (!RESEND_API_KEY) {
    // Surfaced as a generic failure to the form; the detail is for our logs.
    console.error('[demo-request] RESEND_API_KEY is not configured')
    return NextResponse.json(
      { ok: false, error: 'Email is not configured on the server.' },
      { status: 500 },
    )
  }

  const details: DemoRequestDetails = {
    ...parsed.data,
    email: parsed.data.email.trim().toLowerCase(),
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin
  const resend = new Resend(RESEND_API_KEY)

  const prospect = prospectEmail(details, buildLoginUrl(origin, details))
  const internal = teamNotificationEmail(details)

  // The prospect email is the one that must land. The team notification is
  // useful but never a reason to tell the firm their request failed, so the
  // two are settled independently.
  const [prospectResult, teamResult] = await Promise.allSettled([
    resend.emails.send({
      from: FROM,
      to: details.email,
      replyTo: TEAM_INBOX,
      subject: prospect.subject,
      html: prospect.html,
      text: prospect.text,
    }),
    resend.emails.send({
      from: FROM,
      to: TEAM_INBOX,
      replyTo: details.email,
      subject: internal.subject,
      html: internal.html,
      text: internal.text,
    }),
  ])

  // Resend resolves with an `error` field rather than throwing on API errors,
  // so a fulfilled promise is not by itself a delivered email.
  const prospectFailed =
    prospectResult.status === 'rejected' || Boolean(prospectResult.value?.error)

  if (prospectFailed) {
    const reason =
      prospectResult.status === 'rejected'
        ? prospectResult.reason
        : prospectResult.value.error
    console.error('[demo-request] failed to email prospect', reason)
    return NextResponse.json(
      { ok: false, error: 'We could not send your confirmation email. Please try again.' },
      { status: 502 },
    )
  }

  if (teamResult.status === 'rejected' || teamResult.value?.error) {
    const reason =
      teamResult.status === 'rejected' ? teamResult.reason : teamResult.value.error
    console.error('[demo-request] failed to notify team', reason)
  }

  return NextResponse.json({ ok: true })
}
