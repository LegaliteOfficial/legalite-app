'use client'

/**
 * ExpensePickerDialog
 * -------------------
 * Quick picker the BillComposer opens from its "Add expense" button.
 * Lists active catalog items grouped by category. Each row has a
 * quantity stepper and an Add button so the partner can drop a
 * line item ("Paper × 32") onto the bill in two clicks.
 *
 * Multiple picks in one open: the dialog stays open as the partner
 * adds items. Closing returns control to the BillComposer; nothing
 * about the catalog has changed (additions happen inside the
 * composer's local items state).
 */

import { useEffect, useMemo, useState } from 'react'
import { Minus, Plus, Receipt } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  listActiveExpenses,
  useExpenseCatalogStore,
  type ExpenseItem,
} from '@/stores/expense-catalog-local.store'
import { useFormatCurrency } from '@/lib/format-currency'

interface ExpensePickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * Callback fired when the partner adds an item. The BillComposer
   * receives the catalog item + quantity and appends a matching
   * line item. We don't pass back a fully-formed BillLineItem so
   * the composer keeps full control over id minting + amount
   * recomputation.
   */
  onAdd: (item: ExpenseItem, quantity: number) => void
}

export function ExpensePickerDialog({
  open,
  onOpenChange,
  onAdd,
}: ExpensePickerDialogProps) {
  const revision = useExpenseCatalogStore((s) => s.revision)
  const fmt = useFormatCurrency()

  const items = useMemo(
    () => listActiveExpenses(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [revision],
  )
  const grouped = useMemo(() => {
    const map = new Map<string, ExpenseItem[]>()
    for (const it of items) {
      const arr = map.get(it.category) ?? []
      arr.push(it)
      map.set(it.category, arr)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [items])

  // Per-row quantity state; keyed by item id. We start every row at
  // 1 on each fresh open so the dialog doesn't remember stale
  // counts from previous sessions.
  const [qty, setQty] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!open) return
    void useExpenseCatalogStore.persist.rehydrate()
    const seeded: Record<string, number> = {}
    for (const it of items) seeded[it.id] = 1
    setQty(seeded)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const bumpQty = (id: string, delta: number) => {
    setQty((s) => {
      const next = Math.max(1, (s[id] ?? 1) + delta)
      return { ...s, [id]: next }
    })
  }
  const setQtyExact = (id: string, value: string) => {
    const parsed = Number(value)
    setQty((s) => ({
      ...s,
      [id]: Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1,
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle
            className="flex items-center gap-2"
            style={{
              fontFamily:
                'var(--font-heading, "Playfair Display", serif)',
            }}
          >
            <Receipt size={16} strokeWidth={1.75} />
            Add expense from catalog
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto -mx-2 px-2">
          {grouped.length === 0 ? (
            <div
              className="text-center px-4 py-10 text-[13px]"
              style={{ color: 'var(--text-muted)' }}
            >
              The catalog is empty. Open <strong>Expense catalog</strong> on
              the billing toolbar to add reusable line items.
            </div>
          ) : (
            grouped.map(([category, group]) => (
              <div key={category} className="mb-3">
                <div
                  className="px-1 py-1.5 text-[10.5px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {category}
                </div>
                <div
                  className="rounded-md border overflow-hidden"
                  style={{
                    borderColor: 'var(--border-soft)',
                    background: 'var(--surface-card)',
                  }}
                >
                  {group.map((it, i) => {
                    const itemQty = qty[it.id] ?? 1
                    const lineTotal = itemQty * it.unit_price
                    return (
                      <div
                        key={it.id}
                        className="grid items-center gap-3 px-3 py-2 border-t first:border-t-0"
                        style={{
                          gridTemplateColumns: '1fr 110px 100px 70px',
                          borderColor: 'var(--border-soft)',
                        }}
                      >
                        <div className="min-w-0">
                          <div
                            className="text-[13px] font-medium truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {it.name}
                            <span
                              className="ml-1.5 text-[11.5px] font-normal"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              · {fmt(it.unit_price)} / {it.unit_name}
                            </span>
                          </div>
                          {it.description && (
                            <div
                              className="text-[11px] truncate"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              {it.description}
                            </div>
                          )}
                        </div>
                        {/* Quantity stepper. Plus/Minus + direct
                            number input so partners can type "32" for
                            "32 pages" without spamming the +. */}
                        <div
                          className="flex items-center gap-1"
                          style={{
                            background: 'var(--surface-sunken)',
                            borderRadius: 6,
                            padding: 2,
                          }}
                        >
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => bumpQty(it.id, -1)}
                            className="h-6 w-6 inline-flex items-center justify-center rounded cursor-pointer"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            <Minus size={11} strokeWidth={2} />
                          </button>
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            value={itemQty}
                            onChange={(e) => setQtyExact(it.id, e.target.value)}
                            className="h-6 w-12 text-[12.5px] text-center tabular-nums border-none focus-visible:ring-0"
                            style={{ background: 'transparent' }}
                          />
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => bumpQty(it.id, 1)}
                            className="h-6 w-6 inline-flex items-center justify-center rounded cursor-pointer"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            <Plus size={11} strokeWidth={2} />
                          </button>
                        </div>
                        <div
                          className="text-[12.5px] text-right tabular-nums font-semibold"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {fmt(lineTotal)}
                        </div>
                        <button
                          type="button"
                          onClick={() => onAdd(it, itemQty)}
                          className="h-7 inline-flex items-center justify-center rounded-md text-[11.5px] font-semibold cursor-pointer"
                          style={{
                            background: 'var(--gold)',
                            color: 'var(--navy)',
                          }}
                        >
                          Add
                        </button>
                        {/* visual divider between rows — done via border-t on next row */}
                        <span
                          style={{ display: i === group.length - 1 ? 'none' : undefined }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between pt-2 mt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
          <span
            className="text-[11.5px]"
            style={{ color: 'var(--text-muted)' }}
          >
            Add items one at a time, then close when done.
          </span>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
