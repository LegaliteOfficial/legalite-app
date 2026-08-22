/**
 * Light-theme product mockups for the case management feature rows. Pure markup
 * in the brand palette (white cards, gold accents) so they read as real product
 * screenshots and stay on brand. No external assets.
 */

const cardClass =
  'rounded-2xl border border-black/10 bg-white p-5 text-[#0D1B2A] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)]'

function Avatar({ initials, tone }: { initials: string; tone: string }) {
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
      style={{ background: tone }}
    >
      {initials}
    </span>
  )
}

// 2a — collaboration / comments
const COMMENTS = [
  {
    who: 'JP',
    tone: '#C9972B',
    name: 'James Puplampu',
    time: '2h',
    text: 'The precedent in section 4 strengthens our position. Worth citing it up front.',
  },
  {
    who: 'AM',
    tone: '#2F6BFF',
    name: 'Akua Mensah',
    time: '1h',
    text: 'Agreed. Let us file the reply before Friday’s deadline.',
  },
]

export function CollaborationMockup() {
  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">Ansah Family Trust</div>
          <div className="mt-0.5 text-xs text-gray-400">Draft reply · shared with 3</div>
        </div>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
          In review
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {COMMENTS.map((c) => (
          <div key={c.name} className="flex gap-3">
            <Avatar initials={c.who} tone={c.tone} />
            <div className="flex-1 rounded-lg border border-gray-100 bg-gray-50/70 p-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium text-[#0D1B2A]">{c.name}</span>
                <span className="text-gray-400">commented</span>
                <span className="ml-auto text-gray-300">{c.time}</span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{c.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
        <span className="text-xs text-gray-400">Add a comment</span>
        <button className="ml-auto rounded-md bg-gradient-to-b from-[#C9972B] to-[#8C6A1E] px-3 py-1.5 text-xs font-medium text-white">
          Send
        </button>
      </div>
    </div>
  )
}

// 2b — documents list
const DOCS = [
  { name: 'Statement of Claim.pdf', type: 'PDF', date: '12 May', shared: ['KA', 'FM'] },
  { name: 'Witness Statement.docx', type: 'DOCX', date: '10 May', shared: ['AO'] },
  { name: 'Exhibit A, Contract.pdf', type: 'PDF', date: '08 May', shared: ['KA', 'DK', 'FM'] },
  { name: 'Bundle index.xlsx', type: 'XLSX', date: '02 May', shared: ['DK'] },
]

const TONES: Record<string, string> = {
  KA: '#C9972B',
  FM: '#2F6BFF',
  AO: '#0D1B2A',
  DK: '#4B5563',
}

export function DocumentsMockup() {
  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">Documents</div>
          <div className="mt-0.5 text-xs text-gray-400">Republic v. Osei · 24 files</div>
        </div>
        <button className="rounded-md bg-gradient-to-b from-[#C9972B] to-[#8C6A1E] px-3 py-1.5 text-xs font-medium text-white">
          Upload
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
        {DOCS.map((d) => (
          <div
            key={d.name}
            className="flex items-center gap-3 border-b border-gray-50 px-4 py-3 last:border-0"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-[9px] font-semibold text-gray-500">
              {d.type}
            </span>
            <div className="flex-1 truncate text-sm font-medium text-[#0D1B2A]">{d.name}</div>
            <div className="hidden items-center sm:flex">
              {d.shared.map((s, i) => (
                <span
                  key={s + i}
                  className="-ml-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[9px] font-semibold text-white first:ml-0"
                  style={{ background: TONES[s] ?? '#4B5563' }}
                >
                  {s}
                </span>
              ))}
            </div>
            <div className="w-14 text-right text-xs text-gray-400">{d.date}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 2c — case lifecycle + tasks
const STAGES = [
  { label: 'Intake', state: 'done' },
  { label: 'Filed', state: 'done' },
  { label: 'Discovery', state: 'active' },
  { label: 'Hearing', state: 'todo' },
  { label: 'Judgment', state: 'todo' },
]

const TASKS = [
  { label: 'File statement of defence', done: true, due: '' },
  { label: 'Serve interrogatories', done: false, due: 'Due 22 May' },
  { label: 'Prepare witness bundle', done: false, due: 'Due 29 May' },
]

export function CaseLifecycleMockup() {
  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">Mensah v. GRA</div>
          <div className="mt-0.5 text-xs text-gray-400">Case lifecycle</div>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
          On track
        </span>
      </div>

      {/* Stages */}
      <div className="mt-5 flex items-center">
        {STAGES.map((s, i) => (
          <div key={s.label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${
                  s.state === 'done'
                    ? 'bg-[#C9972B] text-white'
                    : s.state === 'active'
                      ? 'bg-white text-[#8C6A1E] ring-2 ring-[#C9972B]'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {s.state === 'done' ? '✓' : i + 1}
              </span>
              <span
                className={`text-[10px] ${s.state === 'todo' ? 'text-gray-400' : 'text-[#0D1B2A]'}`}
              >
                {s.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div
                className={`mx-1 mb-4 h-px flex-1 ${
                  s.state === 'done' ? 'bg-[#C9972B]' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Tasks */}
      <div className="mt-5 space-y-2">
        {TASKS.map((t) => (
          <div
            key={t.label}
            className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2.5"
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded border text-[9px] ${
                t.done
                  ? 'border-[#C9972B] bg-[#C9972B] text-white'
                  : 'border-gray-300 bg-white text-transparent'
              }`}
            >
              ✓
            </span>
            <span
              className={`flex-1 text-sm ${t.done ? 'text-gray-400 line-through' : 'text-[#0D1B2A]'}`}
            >
              {t.label}
            </span>
            {t.due && <span className="text-[11px] text-amber-600">{t.due}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
