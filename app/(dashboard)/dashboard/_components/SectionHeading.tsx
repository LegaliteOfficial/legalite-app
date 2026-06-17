'use client'

export function SectionHeading({ title }: { title: string }) {
  return (
    <h2
      className="font-heading text-lg font-semibold tracking-tight"
      style={{ color: 'var(--text-primary)' }}
    >
      {title}
    </h2>
  )
}
