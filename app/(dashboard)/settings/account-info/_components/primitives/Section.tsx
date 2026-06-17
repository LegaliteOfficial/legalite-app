'use client'

export function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-10">
      <h3
        className="font-heading text-base font-bold mb-3"
        style={{ color: 'var(--navy)' }}
      >
        {title}
      </h3>
      {children}
    </div>
  )
}
