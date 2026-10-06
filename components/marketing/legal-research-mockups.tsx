/**
 * Light-theme product mockups for the Legal intelligence feature section.
 * Brand palette (white cards, gold accents), no external assets. They replace
 * the external Webflow images the page used to load.
 */

const card = 'rounded-xl border border-black/10 bg-white p-4 text-[#0D1B2A] shadow-lg'
const kicker = 'text-[10px] uppercase tracking-wide text-gray-400'

// Lead feature: the AI reading a case and extracting structure.
const glassKicker = 'text-[10px] uppercase tracking-wide text-gray-400'

export function CaseAnalysisMockup() {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-7 text-[#0D1B2A] shadow-[0_30px_60px_-34px_rgba(13,27,42,0.45)] md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold text-[#0D1B2A]">Case analysis</div>
          <div className="mt-0.5 text-sm text-gray-400">Ansah v. Republic</div>
        </div>
        <span className="rounded-full border border-[#C9972B]/30 bg-[#C9972B]/10 px-3 py-1 text-[11px] font-medium text-[#8C6A1E]">
          Analyzed
        </span>
      </div>

      <div className="mt-7 space-y-6">
        <div>
          <div className={glassKicker}>Issues</div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {['Breach of contract', 'Wrongful termination'].map((t) => (
              <span
                key={t}
                className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className={glassKicker}>Question of law</div>
          <p className="mt-2 text-base text-gray-700">
            Was notice validly served under section 12?
          </p>
        </div>
        <div>
          <div className={glassKicker}>Parties</div>
          <div className="mt-2.5 flex flex-wrap gap-x-8 gap-y-2 text-base">
            <span className="text-gray-700">
              <span className="text-gray-400">Plaintiff</span> Ansah
            </span>
            <span className="text-gray-700">
              <span className="text-gray-400">Defendant</span> Republic
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Card: set the preferred outcome.
export function OutcomePrefMockup() {
  return (
    <div className={card}>
      <div className={kicker}>Preferred outcome</div>
      <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50/70 p-3 text-sm text-gray-700">
        Full refund of the security deposit and early release from the lease.
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-[#8C6A1E]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#C9972B]" />
        Research tuned to this goal
      </div>
    </div>
  )
}

// Card: surfaced authorities with a relevance score.
const AUTHORITIES = [
  { name: 'Mensah v. GRA', score: '94%' },
  { name: 'Republic v. High Court', score: '88%' },
  { name: 'Adjoa v. Tetteh', score: '81%' },
]

export function PrecedentMockup() {
  return (
    <div className={card}>
      <div className={kicker}>Relevant authorities</div>
      <div className="mt-3 space-y-2">
        {AUTHORITIES.map((a) => (
          <div key={a.name} className="flex items-center gap-3">
            <span className="flex-1 truncate text-sm text-gray-700">{a.name}</span>
            <span className="rounded-full bg-[#C9972B]/10 px-2 py-0.5 text-[10px] font-semibold text-[#8C6A1E]">
              {a.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Card: transparent reasoning with sources.
export function ReasoningMockup() {
  return (
    <div className={card}>
      <div className={kicker}>Why this applies</div>
      <div className="mt-3 space-y-2">
        {['Same question of statutory notice', 'Decided by a higher court'].map((step, i) => (
          <div key={step} className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#C9972B] text-[9px] font-semibold text-white">
              {i + 1}
            </span>
            <span className="text-sm text-gray-700">{step}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {['Statute', 'Case law'].map((t) => (
          <span
            key={t}
            className="rounded-full border border-[#C9972B]/25 bg-[#C9972B]/[0.08] px-2.5 py-0.5 text-[10px] text-[#8C6A1E]"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}
