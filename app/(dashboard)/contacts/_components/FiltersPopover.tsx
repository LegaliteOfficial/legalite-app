'use client'

import { useEffect, useRef, useState } from 'react'
import { CaretDown, Funnel, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { useTags } from '@/hooks/use-tags'
import type { ContactRoleFilter } from '../_types'

/**
 * Filters popover — three sections (Contact type radio, Contact tags
 * multi-picker, Custom fields stub) plus Apply / Clear actions.
 *
 * Uses the same staged-changes pattern as ColumnsPicker: edits live in
 * local `draftRole` / `draftTags` state, and only "Apply filters"
 * commits them up via `onApply`. Clicking outside discards the draft;
 * "Clear filters" resets the draft AND commits an empty state.
 */
export function FiltersPopover({
  role,
  tags,
  onApply,
  onClear,
}: {
  role: ContactRoleFilter
  tags: string[]
  onApply: (role: ContactRoleFilter, tags: string[]) => void
  onClear: () => void
}) {
  const { data: storeTags } = useTags()
  const [open, setOpen] = useState(false)
  const [draftRole, setDraftRole] = useState<ContactRoleFilter>(role)
  const [draftTags, setDraftTags] = useState<string[]>(tags)
  const [tagQuery, setTagQuery] = useState('')
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const activeFacetCount = (role !== null ? 1 : 0) + tags.length

  const openPopover = () => {
    setDraftRole(role)
    setDraftTags(tags)
    setTagQuery('')
    setOpen(true)
  }
  const cancel = () => setOpen(false)
  const apply = () => {
    onApply(draftRole, draftTags)
    setOpen(false)
  }
  const clear = () => {
    setDraftRole(null)
    setDraftTags([])
    setTagQuery('')
    onClear()
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const toggleTag = (name: string) => {
    setDraftTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name],
    )
  }

  const tagSuggestions = storeTags.filter(
    (t) =>
      !draftTags.includes(t.name) &&
      (!tagQuery.trim() ||
        t.name.toLowerCase().includes(tagQuery.trim().toLowerCase())),
  )

  const colourFor = (name: string): string => {
    const t = storeTags.find((x) => x.name.toLowerCase() === name.toLowerCase())
    return t?.color ?? '#94A3B8'
  }

  // Radio behaviour: clicking the currently-selected option clears it
  // (so the user can go back to "no filter").
  const selectRole = (val: 'none' | 'client') => {
    setDraftRole((prev) => (prev === val ? null : val))
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => (open ? cancel() : openPopover())}
      >
        <Funnel size={13} strokeWidth={1.75} />
        Filters
        {activeFacetCount > 0 && (
          <span
            className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10.5px] font-semibold tabular-nums"
            style={{
              background: 'var(--gold)',
              color: 'var(--navy)',
            }}
            aria-label={`${activeFacetCount} active filters`}
          >
            {activeFacetCount}
          </span>
        )}
        <CaretDown size={12} strokeWidth={1.75} />
      </Button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 rounded-xl border"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--border-default)',
            boxShadow: 'var(--shadow-lg)',
            width: 360,
          }}
        >
          <div className="p-4 space-y-5 max-h-[480px] overflow-y-auto">
            {/* Contact type radio. */}
            <div>
              <div
                className="text-[11.5px] uppercase tracking-wider font-semibold mb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                Contact type
              </div>
              <div className="space-y-1.5">
                {(
                  [
                    { value: 'none' as const, label: 'None' },
                    { value: 'client' as const, label: 'Client' },
                  ]
                ).map((opt) => {
                  const checked = draftRole === opt.value
                  return (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 cursor-pointer select-none text-[13px]"
                      onClick={(e) => {
                        e.preventDefault()
                        selectRole(opt.value)
                      }}
                    >
                      <span
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full border"
                        style={{
                          borderColor: checked
                            ? 'var(--gold)'
                            : 'var(--border-default)',
                          background: 'transparent',
                        }}
                        aria-hidden
                      >
                        {checked && (
                          <span
                            className="block h-2 w-2 rounded-full"
                            style={{ background: 'var(--gold)' }}
                          />
                        )}
                      </span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {opt.label}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Contact tags — chip-style multi-picker. */}
            <div>
              <div
                className="text-[11.5px] uppercase tracking-wider font-semibold mb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                Contact tags
              </div>
              <div
                className="flex flex-wrap items-center gap-1.5 rounded-lg border px-2 py-2 min-h-[36px]"
                style={{
                  borderColor: 'var(--border-default)',
                  background: 'var(--surface-card)',
                }}
              >
                {draftTags.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11.5px] font-medium"
                    style={{
                      background: `${colourFor(name)}1A`,
                      color: colourFor(name),
                    }}
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => toggleTag(name)}
                      className="cursor-pointer"
                      aria-label={`Remove tag ${name} from filter`}
                    >
                      <X size={11} strokeWidth={1.75} />
                    </button>
                  </span>
                ))}
                <input
                  value={tagQuery}
                  onChange={(e) => setTagQuery(e.target.value)}
                  placeholder={
                    draftTags.length === 0 ? 'Select contact tags' : ''
                  }
                  className="flex-1 min-w-[100px] outline-none bg-transparent text-[12.5px] px-1"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
              {tagSuggestions.length > 0 && (
                <div
                  className="mt-1 rounded-lg border max-h-[160px] overflow-y-auto"
                  style={{
                    background: 'var(--surface-card)',
                    borderColor: 'var(--border-soft)',
                  }}
                >
                  {tagSuggestions.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        toggleTag(t.name)
                        setTagQuery('')
                      }}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-[12.5px] cursor-pointer hover:bg-[var(--surface-sunken)]"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: t.color }}
                        aria-hidden
                      />
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
              {storeTags.length === 0 && (
                <p
                  className="mt-2 text-[11.5px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  No tags yet. Create some via Manage tags.
                </p>
              )}
            </div>

            {/* Custom Fields stub. */}
            <div>
              <div
                className="text-[11.5px] uppercase tracking-wider font-semibold mb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                Custom Fields
              </div>
              <p
                className="text-[12px] leading-relaxed"
                style={{ color: 'var(--text-muted)' }}
              >
                Customise and speed up your workflow by creating Custom
                Fields. Available once the firm settings screen ships.
              </p>
            </div>
          </div>

          <div
            className="flex items-center justify-start gap-2 px-4 py-3 border-t"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <Button size="sm" onClick={apply}>
              Apply filters
            </Button>
            <Button variant="ghost" size="sm" onClick={clear}>
              Clear filters
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
