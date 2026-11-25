import { NextResponse } from 'next/server'

/**
 * Calendar subscribe links are served by the backend
 * (GET /calendar/feed/<token>.ics), where the link's secret is verified
 * against real deadlines. This route used to serve a placeholder feed; it now
 * only tells callers where to get a link, so nothing here can leak or invent
 * data.
 */
export async function GET() {
  return new NextResponse(
    'Create a private subscribe link under Calendar > Feeds.',
    { status: 410, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  )
}
