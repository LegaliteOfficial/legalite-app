'use client'

import { SidebarSimple, Sidebar } from '@phosphor-icons/react'

export function ChatHeader({
  sidebarOpen,
  onToggleSidebar,
}: {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}) {
  return (
    <div
      className="px-6 py-4 border-b"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="h-8 w-8 rounded-lg flex items-center justify-center border transition-colors"
          style={{
            borderColor: 'var(--border-default)',
            color: 'var(--text-secondary)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-overlay)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen ? <SidebarSimple size={14} strokeWidth={1.75} /> : <Sidebar size={14} strokeWidth={1.75} />}
        </button>
        <h1
          className="font-heading text-lg font-semibold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          LegaLite AI
        </h1>
        <span
          className="text-[11px] font-medium px-2 py-0.5 rounded"
          style={{ background: 'var(--surface-sunken)', color: 'var(--text-muted)' }}
        >
          Ghana legal Q&amp;A
        </span>
      </div>
    </div>
  )
}
