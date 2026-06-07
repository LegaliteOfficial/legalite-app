'use client'

/**
 * ExpenseCatalogDialog
 * --------------------
 * CRUD for the expense catalog — the firm's reusable small-charge
 * templates (paper, photocopy, court filing fees, transport, etc.).
 *
 * Layout: two columns inside one wide dialog.
 *   - Left  : list of catalog items grouped by category. Click a
 *             row to edit it; an "Add new" button at the top mints
 *             a blank row in the editor.
 *   - Right : editor for the selected item — name, description,
 *             category, unit price, unit name, active toggle.
 *             Save commits to the store; Delete soft-removes
 *             (setActive false) so historical bills referencing
 *             the item still have context.
 *
 * Why a manage dialog instead of a settings page? The catalog is
 * intrinsically a billing concept; surfacing it next to "New bill"
 * keeps it discoverable. A future Gear -> Catalog screen can
 * mount the same form.
 */

import { useEffect, useMemo, useState } from 'react'
import { Archive, Check, Plus, Trash } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  listAllExpenses,
  useExpenseCatalogStore,
  type ExpenseItem,
} from '@/stores/expense-catalog-local.store'
import {
  useActiveCurrencyCode,
  useFormatCurrency,
} from '@/lib/format-currency'

interface ExpenseCatalogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type EditorState = {
  id: string | null // null = creating
  name: string
  description: string
  category: string
  unit_price: string
  unit_name: string
  active: boolean
}

const BLANK_EDITOR: EditorState = {
  id: null,
  name: '',
  description: '',
  category: '',
  unit_price: '',
  unit_name: '',
  active: true,
}

export function ExpenseCatalogDialog({
  open,
  onOpenChange,
}: ExpenseCatalogDialogProps) {
  const revision = useExpenseCatalogStore((s) => s.revision)
  const upsertExpense = useExpenseCatalogStore((s) => s.upsertExpense)
  const setActive = useExpenseCatalogStore((s) => s.setActive)
  const deleteExpense = useExpenseCatalogStore((s) => s.deleteExpense)

  const fmt = useFormatCurrency()
  const currencyCode = useActiveCurrencyCode()

  // List of all catalog items, grouped by category, reactive via
  // revision scalar.
  const allItems = useMemo(
    () => listAllExpenses(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [revision],
  )
  const grouped = useMemo(() => {
    const map = new Map<string, ExpenseItem[]>()
    for (const it of allItems) {
      const arr = map.get(it.category) ?? []
      arr.push(it)
      map.set(it.category, arr)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [allItems])

  const [editor, setEditor] = useState<EditorState>(BLANK_EDITOR)

  useEffect(() => {
    if (!open) return
    void useExpenseCatalogStore.persist.rehydrate()
    // Reset to a blank editor on open so the dialog starts in a
    // predictable state rather than mid-edit from last session.
    setEditor(BLANK_EDITOR)
  }, [open])

  const beginEdit = (item: ExpenseItem) => {
    setEditor({
      id: item.id,
      name: item.name,
      description: item.description ?? '',
      category: item.category,
      unit_price: String(item.unit_price),
      unit_name: item.unit_name,
      active: item.active,
    })
  }

  const beginCreate = () => setEditor(BLANK_EDITOR)

  const handleSave = () => {
    // Trim + validate. Name + unit_name + unit_price are required;
    // category falls back to "Uncategorised" so the catalog isn't
    // crowded with prompts on every save.
    const name = editor.name.trim()
    const unitName = editor.unit_name.trim()
    const unitPriceParsed = Number(editor.unit_price)
    const category = editor.category.trim() || 'Uncategorised'

    if (!name) {
      toast.error('Add a name for the expense.')
      return
    }
    if (!unitName) {
      toast.error('Add a unit label (page, copy, trip, etc.).')
      return
    }
    if (!Number.isFinite(unitPriceParsed) || unitPriceParsed < 0) {
      toast.error('Enter a valid unit price.')
      return
    }

    const saved = upsertExpense({
      id: editor.id ?? undefined,
      name,
      description: editor.description.trim() || null,
      category,
      unit_price: Math.round(unitPriceParsed * 100) / 100,
      unit_name: unitName,
      active: editor.active,
    })
    toast.success(
      editor.id
        ? `Updated “${saved.name}”.`
        : `Added “${saved.name}” to the catalog.`,
    )
    // Keep the form focused on the just-saved item so edits chain.
    beginEdit(saved)
  }

  const handleDelete = () => {
    if (!editor.id) return
    if (
      !window.confirm(
        'Delete this catalog item permanently? Historical bills that referenced it will keep their line-item details but the picker will no longer offer it.',
      )
    ) {
      return
    }
    deleteExpense(editor.id)
    toast.success('Catalog item deleted.')
    beginCreate()
  }

  const handleArchive = () => {
    if (!editor.id) return
    const next = !editor.active
    setActive(editor.id, next)
    setEditor((e) => ({ ...e, active: next }))
    toast.success(next ? 'Item re-activated.' : 'Item archived.')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
       * Wide-and-tall dialog so both panes fit at-a-glance without
       * scrolling. We override Base UI's default ~640px max-width
       * by passing a large explicit max-w + width pegged to the
       * viewport. The two-pane grid is fixed (no responsive
       * collapse) because the partner explicitly wants the catalog
       * list and editor side-by-side at all times.
       */}
      <DialogContent
        className="overflow-hidden"
        style={{
          maxWidth: 'min(1280px, 96vw)',
          width: '96vw',
          maxHeight: '90vh',
        }}
      >
        <DialogHeader>
          <DialogTitle
            style={{
              fontFamily:
                'var(--font-heading, "Playfair Display", serif)',
            }}
          >
            Expense catalog
            <span
              className="ml-2 text-[12px] font-normal"
              style={{ color: 'var(--text-muted)' }}
            >
              Reusable line items for bills · prices shown in {currencyCode}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div
          className="grid gap-5 mt-2"
          style={{
            // Two columns side-by-side. minmax(0, …) lets each
            // column collapse to its content if needed instead of
            // forcing the grid to its intrinsic minimum width.
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.5fr)',
          }}
        >
          {/* ── Left column: list ───────────────────────────── */}
          {/* Capped to fit comfortably inside the dialog. Only
              scrolls when the firm grows the catalog past ~12 items
              — for the typical 6-10 disbursement firm everything is
              visible without touching the scrollbar. */}
          <div
            className="rounded-xl border overflow-y-auto min-w-0"
            style={{
              borderColor: 'var(--border-soft)',
              background: 'var(--surface-card)',
              maxHeight: 'calc(90vh - 140px)',
            }}
          >
            <div
              className="sticky top-0 z-10 px-3 py-2 border-b flex items-center justify-between"
              style={{
                background: 'var(--surface-sunken)',
                borderColor: 'var(--border-soft)',
              }}
            >
              <span
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Catalog
              </span>
              <button
                type="button"
                onClick={beginCreate}
                className="inline-flex items-center gap-1.5 h-7 px-2 rounded-md text-[12px] font-semibold cursor-pointer"
                style={{
                  background: 'var(--accent-today-tint, rgba(201,151,43,0.12))',
                  color: 'var(--accent-today)',
                }}
              >
                <Plus size={11} strokeWidth={2.25} />
                Add new
              </button>
            </div>
            {grouped.length === 0 ? (
              <div
                className="px-4 py-6 text-center text-[12.5px]"
                style={{ color: 'var(--text-muted)' }}
              >
                No catalog items yet. Click&nbsp;
                <strong>Add new</strong>&nbsp;to start.
              </div>
            ) : (
              grouped.map(([category, items]) => (
                <div key={category}>
                  <div
                    className="px-3 pt-3 pb-1 text-[10.5px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {category}
                  </div>
                  {items.map((it) => {
                    const active = editor.id === it.id
                    return (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => beginEdit(it)}
                        className="w-full text-left px-3 py-2 cursor-pointer transition-colors border-l-2"
                        style={{
                          borderColor: active
                            ? 'var(--gold)'
                            : 'transparent',
                          background: active
                            ? 'rgba(201,151,43,0.06)'
                            : 'transparent',
                          opacity: it.active ? 1 : 0.55,
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="text-[13px] font-medium truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {it.name}
                            {!it.active && (
                              <span
                                className="ml-1.5 text-[10.5px] font-semibold"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                (archived)
                              </span>
                            )}
                          </span>
                          <span
                            className="text-[12px] font-semibold tabular-nums shrink-0"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {fmt(it.unit_price)} / {it.unit_name}
                          </span>
                        </div>
                        {it.description && (
                          <span
                            className="block text-[11.5px] mt-0.5 truncate"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {it.description}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* ── Right column: editor ────────────────────────── */}
          {/* Editor cap matches the list — both panes share the
              same vertical budget so they balance visually. */}
          <div
            className="rounded-xl border p-5 overflow-y-auto min-w-0"
            style={{
              borderColor: 'var(--border-soft)',
              background: 'var(--surface-card)',
              maxHeight: 'calc(90vh - 140px)',
            }}
          >
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="ec-name" className="text-[12.5px] font-semibold">
                  Name
                </Label>
                <Input
                  id="ec-name"
                  value={editor.name}
                  onChange={(e) =>
                    setEditor((s) => ({ ...s, name: e.target.value }))
                  }
                  placeholder="e.g. Paper (A4)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="ec-cat" className="text-[12.5px] font-semibold">
                    Category
                  </Label>
                  <Input
                    id="ec-cat"
                    value={editor.category}
                    onChange={(e) =>
                      setEditor((s) => ({ ...s, category: e.target.value }))
                    }
                    placeholder="Stationery / Court costs / Travel"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ec-unit" className="text-[12.5px] font-semibold">
                    Unit label
                  </Label>
                  <Input
                    id="ec-unit"
                    value={editor.unit_name}
                    onChange={(e) =>
                      setEditor((s) => ({ ...s, unit_name: e.target.value }))
                    }
                    placeholder="page / copy / trip / filing"
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="ec-price" className="text-[12.5px] font-semibold">
                  Unit price ({currencyCode})
                </Label>
                <div className="grid grid-cols-[80px_1fr] gap-2 items-center">
                  <div
                    className="h-10 rounded-md border flex items-center justify-center text-[12.5px] font-semibold tabular-nums"
                    style={{
                      borderColor: 'var(--border-soft)',
                      background: 'var(--surface-sunken)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {currencyCode}
                  </div>
                  <Input
                    id="ec-price"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={0.01}
                    value={editor.unit_price}
                    onChange={(e) =>
                      setEditor((s) => ({ ...s, unit_price: e.target.value }))
                    }
                    placeholder="e.g. 0.20"
                  />
                </div>
                <p
                  className="text-[11px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Prices are expressed in the firm&rsquo;s billing currency.
                  Changing the currency under Billing settings will re-label
                  these amounts but not re-convert them — partners should
                  adjust the numbers themselves if needed.
                </p>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="ec-desc" className="text-[12.5px] font-semibold">
                  Internal note (optional)
                </Label>
                <Textarea
                  id="ec-desc"
                  rows={2}
                  value={editor.description}
                  onChange={(e) =>
                    setEditor((s) => ({ ...s, description: e.target.value }))
                  }
                  placeholder="Context for the team. Does not appear on bills."
                />
              </div>

              {/* Footer actions — vary by create vs edit. */}
              <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                {editor.id ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={handleArchive}
                      style={{
                        borderColor: 'var(--border-soft)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <Archive size={13} strokeWidth={1.75} />
                      {editor.active ? 'Archive' : 'Re-activate'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDelete}
                      style={{
                        borderColor: 'var(--accent-danger)',
                        color: 'var(--accent-danger)',
                      }}
                    >
                      <Trash size={13} strokeWidth={1.75} />
                      Delete
                    </Button>
                  </div>
                ) : (
                  <span
                    className="text-[11.5px]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    New catalog item — fill in the fields and save.
                  </span>
                )}
                <Button
                  onClick={handleSave}
                  style={{ background: 'var(--gold)', color: 'var(--navy)' }}
                >
                  <Check size={13} strokeWidth={2} />
                  {editor.id ? 'Save changes' : 'Add to catalog'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
