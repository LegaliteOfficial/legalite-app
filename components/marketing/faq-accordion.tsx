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
          <div key={i} className="border-b border-white/10">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 py-5 text-left"
            >
              <strong className="text-white text-base [font-family:Inter,Arial,sans-serif] font-medium">
                {item.question}
              </strong>
              <CaretDown
                size={18}
                className={`text-white/60 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
              <div className="overflow-hidden">
                <p className="text-white/60 text-sm leading-relaxed pb-5 pr-10">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
