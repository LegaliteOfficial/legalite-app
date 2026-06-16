'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, X } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { TagSettingsDialog } from '@/components/shared/TagSettingsDialog'
import { useClient } from '@/hooks/use-clients'
import { useSetContactTags, useTags } from '@/hooks/use-tags'

/**
 * Roles + tags row underneath the page header. Roles render as
 * read-only green pills; tags render as toggleable coloured chips with
 * an inline "+ Tag" popover for adding more.
 */
export function ContactTagsBar({
  contact,
}: {
  contact: NonNullable<ReturnType<typeof useClient>['data']>
}) {
  const { data: palette } = useTags()
  const setContactTags = useSetContactTags()
  const [open, setOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const selected = useMemo(
    () => new Set((contact.tags ?? []).map((t) => t.id)),
    [contact.tags],
  )

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

  const commit = async (nextIds: string[]) => {
    try {
      await setContactTags.mutateAsync(contact.id, nextIds)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update tags.')
    }
  }

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    void commit(Array.from(next))
  }
  const removeTag = (id: string) => {
    void commit(Array.from(selected).filter((x) => x !== id))
  }

  return (
    <div
      className="border-b px-6 py-2.5 flex items-center gap-2 flex-wrap"
      style={{
        borderColor: 'var(--border-soft)',
        background: 'var(--surface-card)',
      }}
    >
      {(contact.roles ?? []).map((r) => (
        <span
          key={r}
          className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-semibold"
          style={{ background: 'rgba(34,197,94,0.12)', color: '#16A34A' }}
        >
          {r}
        </span>
      ))}

      <span
        className="mx-0.5 h-4 w-px"
        style={{ background: 'var(--border-default)' }}
        aria-hidden
      />

      {(contact.tags ?? []).map((t) => (
        <span
          key={t.id}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium"
          style={{ background: `${t.color}1F`, color: t.color }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: t.color }}
            aria-hidden
          />
          {t.name}
          <button
            type="button"
            onClick={() => removeTag(t.id)}
            className="cursor-pointer ml-0.5"
            aria-label={`Remove ${t.name}`}
          >
            <X size={10} strokeWidth={2.5} />
          </button>
        </span>
      ))}

      <div className="relative" ref={wrapperRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11.5px] font-medium border border-dashed cursor-pointer transition-colors"
          style={{
            borderColor: 'var(--border-default)',
            color: 'var(--text-secondary)',
          }}
        >
          <Plus size={11} strokeWidth={2.25} />
          Tag
        </button>
        {open && (
          <div
            className="absolute left-0 top-full mt-1 z-50 w-60 rounded-xl border overflow-hidden"
            style={{
              background: 'var(--surface-card)',
              borderColor: 'var(--border-default)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div className="max-h-[240px] overflow-y-auto py-1">
              {palette.length === 0 ? (
                <p
                  className="px-3 py-3 text-[12.5px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  No tags yet.
                </p>
              ) : (
                palette.map((t) => {
                  const checked = selected.has(t.id)
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggle(t.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] cursor-pointer transition-colors hover:bg-[var(--surface-sunken)]"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <span
                        className="inline-flex h-4 w-4 items-center justify-center rounded-[4px] border shrink-0"
                        style={{
                          borderColor: checked
                            ? t.color
                            : 'var(--border-default)',
                          background: checked ? t.color : 'transparent',
                        }}
                      >
                        {checked && (
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2 6.5L5 9.5L10 3.5"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: t.color }}
                        aria-hidden
                      />
                      <span className="flex-1 truncate">{t.name}</span>
                    </button>
                  )
                })
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setManageOpen(true)
              }}
              className="w-full px-3 py-2 text-left text-[12.5px] font-medium border-t cursor-pointer"
              style={{
                borderColor: 'var(--border-soft)',
                color: 'var(--gold-dark)',
              }}
            >
              Manage tags…
            </button>
          </div>
        )}
      </div>

      <TagSettingsDialog open={manageOpen} onOpenChange={setManageOpen} />
    </div>
  )
}
