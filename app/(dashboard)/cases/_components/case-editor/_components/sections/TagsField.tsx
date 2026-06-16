'use client'

import { useState } from 'react'
import { X } from '@phosphor-icons/react'
import { useTagsStore } from '@/stores/tags.store'
import { FieldLabel } from '../primitives/FieldLabel'

/**
 * Tags input — picks from the tag store (firm-defined tags created via
 * TagSettingsDialog). Selected tags render with their stored colour;
 * unknown tag names (typed but never created) fall back to neutral
 * styling so old form data doesn't break visually.
 */
export function TagsField({
  value,
  onChange,
  onOpenSettings,
}: {
  value: string[]
  onChange: (next: string[]) => void
  onOpenSettings: () => void
}) {
  const tags = useTagsStore((s) => s.tags)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const colourFor = (name: string): string => {
    const match = tags.find((t) => t.name.toLowerCase() === name.toLowerCase())
    return match?.color ?? '#94A3B8' // slate fallback for unknown tags
  }

  const suggestions = tags.filter(
    (t) =>
      !value.includes(t.name) &&
      (!query.trim() ||
        t.name.toLowerCase().includes(query.trim().toLowerCase())),
  )

  const addTagByName = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed || value.includes(trimmed)) return
    onChange([...value, trimmed])
    setQuery('')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <FieldLabel>Tags</FieldLabel>
        <button
          type="button"
          onClick={onOpenSettings}
          className="text-[11.5px] font-medium cursor-pointer"
          style={{ color: 'var(--gold-dark)' }}
        >
          Manage tags
        </button>
      </div>
      <div className="relative">
        <div
          className="flex flex-wrap items-center gap-1.5 rounded-lg border px-2 py-2 min-h-[40px]"
          style={{
            borderColor: 'var(--border-default)',
            background: 'var(--surface-card)',
          }}
        >
          {value.map((tagName) => (
            <span
              key={tagName}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11.5px] font-medium"
              style={{
                background: `${colourFor(tagName)}1A`, // 10% alpha tint
                color: colourFor(tagName),
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: colourFor(tagName) }}
                aria-hidden
              />
              {tagName}
              <button
                type="button"
                onClick={() => onChange(value.filter((t) => t !== tagName))}
                className="cursor-pointer"
                aria-label={`Remove tag ${tagName}`}
              >
                <X size={11} strokeWidth={1.75} />
              </button>
            </span>
          ))}
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              // Delay so a click on a suggestion can land before we close.
              setTimeout(() => setOpen(false), 150)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (suggestions[0]) addTagByName(suggestions[0].name)
                else if (query.trim()) addTagByName(query)
              }
              if (e.key === 'Backspace' && !query && value.length) {
                onChange(value.slice(0, -1))
              }
            }}
            placeholder={value.length === 0 ? 'Search tags' : ''}
            className="flex-1 min-w-[120px] outline-none bg-transparent text-[13px] px-1"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
        {open && (suggestions.length > 0 || (tags.length === 0 && !query)) && (
          <div
            className="absolute z-20 left-0 right-0 top-full mt-1 rounded-lg border max-h-[220px] overflow-y-auto"
            style={{
              background: 'var(--surface-card)',
              borderColor: 'var(--border-default)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {tags.length === 0 && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onOpenSettings()
                }}
                className="block w-full text-left px-3 py-2 text-[12.5px] cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                No tags yet — click{' '}
                <span style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>
                  Manage tags
                </span>{' '}
                to create one.
              </button>
            )}
            {suggestions.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  addTagByName(tag.name)
                }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 text-[13px] transition-colors cursor-pointer"
                style={{ color: 'var(--text-primary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface-sunken)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ background: tag.color }}
                  aria-hidden
                />
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="mt-1 text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
        Pick from your firm&rsquo;s tag list, or create new tags from{' '}
        <button
          type="button"
          onClick={onOpenSettings}
          className="cursor-pointer underline"
          style={{ color: 'var(--gold-dark)' }}
        >
          Manage tags
        </button>
        .
      </p>
    </div>
  )
}
