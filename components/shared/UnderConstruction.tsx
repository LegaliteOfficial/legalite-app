import Link from 'next/link'
import { ArrowLeft, Wrench } from '@phosphor-icons/react/dist/ssr'

/**
 * Placeholder shown for routes that are linked in the UI but not built
 * yet. Replaces the bare 404 so an unfinished link reads as "coming
 * soon" rather than "broken". `backHref` defaults to Settings since
 * that's where most pending links live.
 */
export function UnderConstruction({
  path,
  backHref = '/settings',
  backLabel = 'Back to settings',
}: {
  path?: string
  backHref?: string
  backLabel?: string
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: 'var(--gold-muted)' }}
        >
          <Wrench size={30} weight="duotone" style={{ color: 'var(--gold-dark)' }} />
        </div>
        <h1
          className="font-heading text-2xl font-extrabold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Page under construction
        </h1>
        <p className="text-sm leading-relaxed mb-1" style={{ color: 'var(--text-secondary)' }}>
          We’re still building this part of LegaLite. It’ll be ready soon —
          thanks for your patience.
        </p>
        {path && (
          <p
            className="text-[12px] font-mono mb-6"
            style={{ color: 'var(--text-muted)' }}
          >
            {path}
          </p>
        )}
        <div className={path ? '' : 'mt-6'}>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--gold)' }}
          >
            <ArrowLeft size={15} weight="bold" /> {backLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}
