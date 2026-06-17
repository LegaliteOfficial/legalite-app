'use client'

export function TabPlaceholder({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-3xl rounded-xl border p-10 text-center" style={{ background: 'var(--cream-white)', borderColor: 'var(--border)' }}>
      <h3 className="font-heading text-lg font-bold mb-2" style={{ color: 'var(--navy)' }}>{title}</h3>
      <p className="text-sm" style={{ color: '#6B7280' }}>{body}</p>
    </div>
  )
}
