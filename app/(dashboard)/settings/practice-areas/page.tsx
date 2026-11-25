'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery } from '@apollo/client/react'
import { ArrowLeft, CheckSquare, Square, Star } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/shared/Spinner'
import {
  MyPracticeAreasQueryDoc,
  PracticeAreasQueryDoc,
  SetMyPracticeAreasMutationDoc,
} from '@/lib/graphql/practice-areas'
import { errorMessage } from '@/lib/errors'

/**
 * The areas of law the signed-in lawyer practises, with one marked as their
 * main area. Saved to their profile and used to tailor Legalite to their work.
 */
export default function PracticeAreasPage() {
  const catalog = useQuery(PracticeAreasQueryDoc)
  const mine = useQuery(MyPracticeAreasQueryDoc)
  const [save, { loading: saving }] = useMutation(SetMyPracticeAreasMutationDoc, {
    refetchQueries: [MyPracticeAreasQueryDoc],
    awaitRefetchQueries: true,
  })

  const savedIds = useMemo(
    () => (mine.data?.myPracticeAreas ?? []).map((a) => a.practice_area_id),
    [mine.data],
  )
  const savedPrimary = mine.data?.myPracticeAreas.find((a) => a.is_primary)?.practice_area_id ?? null

  // Edits stay null until the user changes something, so the saved values show.
  const [picked, setPicked] = useState<string[] | null>(null)
  const [primary, setPrimary] = useState<string | null | undefined>(undefined)
  const [filter, setFilter] = useState('')

  const selected = picked ?? savedIds
  const primaryId = primary === undefined ? savedPrimary : primary
  const effectivePrimary = primaryId && selected.includes(primaryId) ? primaryId : (selected[0] ?? null)

  const dirty =
    picked !== null &&
    (selected.length !== savedIds.length ||
      selected.some((id) => !savedIds.includes(id)) ||
      effectivePrimary !== savedPrimary)
  const primaryChanged = primary !== undefined && effectivePrimary !== savedPrimary

  const areas = (catalog.data?.practiceAreas ?? []).filter((a) =>
    a.name.toLowerCase().includes(filter.trim().toLowerCase()),
  )

  const toggle = (id: string) => {
    setPicked(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])
  }

  const makePrimary = (id: string) => {
    if (!selected.includes(id)) setPicked([...selected, id])
    else if (picked === null) setPicked(selected)
    setPrimary(id)
  }

  const submit = async () => {
    const id = toast.loading('Saving your practice areas...')
    try {
      await save({
        variables: {
          input: { practice_area_ids: selected, primary_practice_area_id: effectivePrimary },
        },
      })
      setPicked(null)
      setPrimary(undefined)
      toast.success('Practice areas saved.', { id })
    } catch (err) {
      toast.error(errorMessage(err, 'Your practice areas could not be saved.'), { id })
    }
  }

  const loading = (catalog.loading && !catalog.data) || (mine.loading && !mine.data)
  const loadError = catalog.error ?? mine.error

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <Link href="/settings" className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={14} /> Settings
        </Link>
        <h1 className="font-heading text-2xl font-bold" style={{ color: 'var(--navy)' }}>
          Practice areas
        </h1>
        <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Choose the areas of law you practise and mark your main one. Legalite uses them to tailor suggestions,
          templates and research to your work.
        </p>

        <section className="mt-6 rounded-2xl border bg-white p-5" style={{ borderColor: 'var(--border)' }}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              {selected.length === 0
                ? 'No areas selected yet.'
                : `${selected.length} selected`}
            </p>
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter areas"
              className="h-9 w-full sm:w-56"
              aria-label="Filter practice areas"
            />
          </div>

          {loadError ? (
            <p className="py-10 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              {errorMessage(loadError, 'Practice areas could not be loaded.')}
            </p>
          ) : loading ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : areas.length === 0 ? (
            <p className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              No practice area matches that filter.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {areas.map((a) => {
                const on = selected.includes(a.id)
                const isPrimary = on && effectivePrimary === a.id
                return (
                  <li key={a.id}>
                    <div
                      className="flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors"
                      style={{
                        borderColor: on ? 'var(--gold)' : 'var(--border)',
                        background: on ? 'rgba(201,151,43,0.06)' : 'white',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggle(a.id)}
                        className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5 text-left"
                        aria-pressed={on}
                      >
                        {on ? (
                          <CheckSquare size={18} weight="fill" className="mt-0.5 shrink-0" style={{ color: 'var(--gold-dark)' }} />
                        ) : (
                          <Square size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                        )}
                        <span className="min-w-0">
                          <span className="block text-[13.5px] font-semibold" style={{ color: 'var(--navy)' }}>
                            {a.name}
                          </span>
                          {a.description && (
                            <span className="mt-0.5 block text-[12px] leading-snug" style={{ color: 'var(--text-muted)' }}>
                              {a.description}
                            </span>
                          )}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => makePrimary(a.id)}
                        className="shrink-0 cursor-pointer rounded-md p-1"
                        title={isPrimary ? 'Your main practice area' : 'Make this your main practice area'}
                        aria-label={isPrimary ? `${a.name} is your main area` : `Make ${a.name} your main area`}
                      >
                        <Star
                          size={16}
                          weight={isPrimary ? 'fill' : 'regular'}
                          style={{ color: isPrimary ? 'var(--gold)' : 'var(--text-muted)' }}
                        />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <div className="mt-5 flex items-center justify-end gap-2">
          {(dirty || primaryChanged) && (
            <Button
              variant="outline"
              onClick={() => {
                setPicked(null)
                setPrimary(undefined)
              }}
              disabled={saving}
            >
              Discard
            </Button>
          )}
          <Button onClick={() => void submit()} disabled={saving || !(dirty || primaryChanged)}>
            {saving && <Spinner size={14} />}
            {saving ? 'Saving...' : 'Save practice areas'}
          </Button>
        </div>
      </div>
    </div>
  )
}
