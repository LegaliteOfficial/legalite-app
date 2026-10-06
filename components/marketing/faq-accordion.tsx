'use client'

import { useState } from 'react'
import { CaretDown } from '@phosphor-icons/react'

interface FAQItem {
  question: string
  answer: string
}

export function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="flex flex-col">
      {items.map((item, i) => {
        const isOpen = openIndex === i
        return (
          <div key={i} className="border-b border-[#0D1B2A]/10 last:border-b-0">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 py-5 text-left"
            >
              <strong className="text-base font-semibold text-[#0D1B2A] [font-family:Inter,Arial,sans-serif]">
                {item.question}
              </strong>
              <CaretDown
                size={18}
                className={`shrink-0 text-[#A67A1C] transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
              <div className="overflow-hidden">
                <p className="pb-5 pr-10 text-sm leading-relaxed text-[#0D1B2A]/65">{item.answer}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
