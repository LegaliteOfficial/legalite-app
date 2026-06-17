'use client'

export function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold tracking-[3px] uppercase mb-3" style={{ color: 'var(--navy)' }}>
      {children}
    </div>
  )
}
