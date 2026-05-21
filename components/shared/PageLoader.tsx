'use client'

export function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--cream)' }}>
      <div className="flex flex-col items-center gap-4">
        {/* Animated scales of justice */}
        <div className="relative w-16 h-16">
          <svg viewBox="0 0 64 64" className="w-full h-full animate-pulse" style={{ color: 'var(--gold)' }}>
            <circle cx="32" cy="8" r="4" fill="currentColor" opacity="0.3" />
            <line x1="32" y1="12" x2="32" y2="52" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <line x1="12" y1="24" x2="52" y2="24" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            {/* Left pan */}
            <g className="origin-[32px_24px]" style={{ animation: 'scaleLeft 1.5s ease-in-out infinite' }}>
              <line x1="12" y1="24" x2="8" y2="36" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
              <line x1="12" y1="24" x2="16" y2="36" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
              <path d="M6 36 Q12 42 18 36" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
            </g>
            {/* Right pan */}
            <g className="origin-[32px_24px]" style={{ animation: 'scaleRight 1.5s ease-in-out infinite' }}>
              <line x1="52" y1="24" x2="48" y2="36" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
              <line x1="52" y1="24" x2="56" y2="36" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
              <path d="M46 36 Q52 42 58 36" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
            </g>
            {/* Base */}
            <line x1="22" y1="52" x2="42" y2="52" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          </svg>
        </div>
        {/* Progress bar */}
        <div className="w-32 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(201,151,43,0.1)' }}>
          <div
            className="h-full rounded-full"
            style={{
              background: 'var(--gold)',
              animation: 'loadProgress 1.2s ease-in-out infinite',
            }}
          />
        </div>
        <p className="text-[11px] font-medium" style={{ color: '#9CA3AF' }}>Loading...</p>
      </div>
      <style>{`
        @keyframes loadProgress {
          0% { width: 0%; margin-left: 0; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
        @keyframes scaleLeft {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-8deg); }
        }
        @keyframes scaleRight {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(8deg); }
        }
      `}</style>
    </div>
  )
}
