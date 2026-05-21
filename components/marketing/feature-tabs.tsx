'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

const TABS = [
  {
    id: 'tab-1',
    name: 'Legal research',
    title: 'AI-Powered Document Drafting',
    body: 'Draft legal documents faster with AI trained on Ghanaian law. From contracts to court filings, get accurate, context-aware drafts in seconds.',
  },
  {
    id: 'tab-2',
    name: 'Document drafting',
    title: 'AI-Powered Document Drafting',
    body: 'Draft legal documents faster with AI trained on Ghanaian law. From contracts to court filings, get accurate, context-aware drafts in seconds.',
  },
  {
    id: 'tab-3',
    name: 'Digitize documents',
    title: 'AI-Powered Document Drafting',
    body: 'Draft legal documents faster with AI trained on Ghanaian law. From contracts to court filings, get accurate, context-aware drafts in seconds.',
  },
  {
    id: 'tab-4',
    name: 'Outcome driven insights',
    title: 'AI-Powered Document Drafting',
    body: 'Draft legal documents faster with AI trained on Ghanaian law. From contracts to court filings, get accurate, context-aware drafts in seconds.',
  },
]

const ROTATION_MS = 5000

export function FeatureTabs() {
  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(0)
  const startRef = useRef<number>(Date.now())

  useEffect(() => {
    startRef.current = Date.now()
    setProgress(0)
    const tick = setInterval(() => {
      const elapsed = Date.now() - startRef.current
      const pct = Math.min(100, (elapsed / ROTATION_MS) * 100)
      setProgress(pct)
      if (elapsed >= ROTATION_MS) {
        setActive((a) => (a + 1) % TABS.length)
      }
    }, 50)
    return () => clearInterval(tick)
  }, [active])

  const current = TABS[active]

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-10">
      <div role="tablist" className="flex flex-col">
        {TABS.map((tab, i) => {
          const selected = i === active
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(i)}
              className="relative w-full text-left py-4 border-b border-white/15 group"
            >
              <span
                className={`text-xs uppercase tracking-[2px] transition-opacity ${
                  selected ? 'opacity-100 text-white' : 'opacity-40 text-white'
                }`}
              >
                {tab.name}
              </span>
              {selected && (
                <span
                  className="absolute bottom-0 left-0 h-px bg-[#03f7eb]"
                  style={{ width: `${progress}%` }}
                />
              )}
            </button>
          )
        })}
      </div>

      <div className="relative">
        <div className="rounded-xl overflow-hidden">
          <Image
            src="/marketing/tab-background.jpg"
            alt=""
            width={1621}
            height={900}
            sizes="100vw"
            className="w-full h-auto"
          />
        </div>
        <div className="mt-8 max-w-2xl">
          <h3 className="text-2xl md:text-3xl text-white [font-family:Literata,'Times_New_Roman',serif] font-semibold tracking-tight leading-tight">
            {current.title}
          </h3>
          <p className="mt-4 text-base text-white/60 leading-relaxed">{current.body}</p>
        </div>
      </div>
    </div>
  )
}
