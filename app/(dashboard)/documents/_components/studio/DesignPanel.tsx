'use client'

/**
 * Design panel — page setup, typography, letterhead, header and footer,
 * and watermark for the open document. Every change updates the design
 * object; the canvas re-styles live and the PDF uses the same values.
 */

import type { ReactNode } from 'react'
import { Check } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ACCENT_SWATCHES,
  DESIGN_PRESETS,
  DOCUMENT_FONTS,
  FONT_SIZES_PT,
  LINE_HEIGHTS,
  MARGIN_PRESETS,
  PAGE_SIZES_MM,
  WATERMARK_PRESETS,
  fontFamily,
  type Alignment,
  type DocumentDesign,
  type Margins,
} from '@/lib/documents/design'

const FONT_ITEMS = Object.fromEntries(DOCUMENT_FONTS.map((f) => [f.id, f.label]))
const SIZE_ITEMS = Object.fromEntries(FONT_SIZES_PT.map((s) => [String(s), `${s} pt`]))
const LINE_ITEMS = Object.fromEntries(LINE_HEIGHTS.map((h) => [String(h), String(h)]))
const PAGE_ITEMS = Object.fromEntries(Object.entries(PAGE_SIZES_MM).map(([k, v]) => [k, v.label]))
const SPACING_ITEMS: Record<string, string> = { '0': 'None', '4': 'Tight (4 pt)', '8': 'Normal (8 pt)', '12': 'Open (12 pt)' }
const NUMBER_ITEMS: Record<string, string> = { none: 'No page numbers', page: '1, 2, 3', pageOfTotal: 'Page 1 of 3' }

export function DesignPanel({
  design,
  onChange,
  firmName,
  className,
}: {
  design: DocumentDesign
  onChange: (next: DocumentDesign) => void
  firmName: string | null
  className?: string
}) {
  const set = <K extends keyof DocumentDesign>(key: K, value: DocumentDesign[K]) =>
    onChange({ ...design, [key]: value })

  const marginPreset =
    MARGIN_PRESETS.find((p) =>
      (Object.keys(p.margins) as (keyof Margins)[]).every((k) => p.margins[k] === design.page.margins[k]),
    )?.id ?? 'custom'

  const watermarkMode = !design.watermark.text
    ? 'none'
    : WATERMARK_PRESETS.includes(design.watermark.text)
      ? design.watermark.text
      : 'custom'

  return (
    <aside
      className={className ?? 'w-[300px] shrink-0 overflow-y-auto border-l'}
      style={{ borderColor: 'var(--border-soft)', background: 'var(--surface-card)' }}
      aria-label="Document design"
    >
      <Section title="Start from a style">
        <div className="grid grid-cols-2 gap-2">
          {DESIGN_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.design)}
              title={p.description}
              className="rounded-lg border px-2.5 py-2 text-left transition-colors hover:border-[var(--gold)]"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <span className="block text-[12px] font-semibold" style={{ color: 'var(--text-primary)', fontFamily: fontFamily(p.design.typography.font) }}>
                {p.label}
              </span>
              <span className="mt-0.5 block h-1 w-8 rounded-full" style={{ background: p.design.accent }} />
            </button>
          ))}
        </div>
      </Section>

      <Section title="Page">
        <Field label="Paper size">
          <Select
            items={PAGE_ITEMS}
            value={design.page.size}
            onValueChange={(v) => v && set('page', { ...design.page, size: v as DocumentDesign['page']['size'] })}
          >
            <SelectTrigger size="sm" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(PAGE_ITEMS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Orientation">
          <Segmented
            value={design.page.orientation}
            options={[{ value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }]}
            onChange={(v) => set('page', { ...design.page, orientation: v })}
          />
        </Field>
        <Field label="Margins">
          <Select
            items={{ ...Object.fromEntries(MARGIN_PRESETS.map((p) => [p.id, p.label])), custom: 'Custom' }}
            value={marginPreset}
            onValueChange={(v) => {
              const preset = MARGIN_PRESETS.find((p) => p.id === v)
              if (preset) set('page', { ...design.page, margins: preset.margins })
            }}
          >
            <SelectTrigger size="sm" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MARGIN_PRESETS.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
              <SelectItem value="custom" disabled>Custom</SelectItem>
            </SelectContent>
          </Select>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
              <label key={side} className="block">
                <span className="mb-0.5 block text-[10.5px] capitalize" style={{ color: 'var(--text-muted)' }}>{side}</span>
                <Input
                  type="number"
                  min={0}
                  max={80}
                  step={0.5}
                  value={design.page.margins[side]}
                  onChange={(e) => {
                    const n = Math.min(80, Math.max(0, Number(e.target.value) || 0))
                    set('page', { ...design.page, margins: { ...design.page.margins, [side]: n } })
                  }}
                  className="h-8 px-2 text-[12px]"
                  aria-label={`${side} margin in millimetres`}
                />
              </label>
            ))}
          </div>
          <p className="mt-1 text-[10.5px]" style={{ color: 'var(--text-muted)' }}>Millimetres</p>
        </Field>
      </Section>

      <Section title="Text">
        <Field label="Body font">
          <FontSelect value={design.typography.font} onChange={(v) => set('typography', { ...design.typography, font: v })} />
        </Field>
        <Field label="Heading font">
          <FontSelect value={design.typography.headingFont} onChange={(v) => set('typography', { ...design.typography, headingFont: v })} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Size">
            <Select
              items={SIZE_ITEMS}
              value={String(design.typography.size)}
              onValueChange={(v) => v && set('typography', { ...design.typography, size: Number(v) })}
            >
              <SelectTrigger size="sm" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FONT_SIZES_PT.filter((s) => s <= 16).map((s) => <SelectItem key={s} value={String(s)}>{s} pt</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Line spacing">
            <Select
              items={LINE_ITEMS}
              value={String(design.typography.lineHeight)}
              onValueChange={(v) => v && set('typography', { ...design.typography, lineHeight: Number(v) })}
            >
              <SelectTrigger size="sm" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LINE_HEIGHTS.map((h) => <SelectItem key={h} value={String(h)}>{h}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Space after paragraphs">
          <Select
            items={SPACING_ITEMS}
            value={String(design.typography.paragraphSpacing)}
            onValueChange={(v) => v && set('typography', { ...design.typography, paragraphSpacing: Number(v) })}
          >
            <SelectTrigger size="sm" className="w-full"><SelectValue placeholder="Custom" /></SelectTrigger>
            <SelectContent>
              {Object.entries(SPACING_ITEMS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Accent colour">
          <div className="flex flex-wrap items-center gap-1.5">
            {ACCENT_SWATCHES.map((s) => (
              <button
                key={s.value}
                type="button"
                title={s.label}
                aria-label={s.label}
                aria-pressed={design.accent === s.value}
                onClick={() => set('accent', s.value)}
                className="flex h-6 w-6 items-center justify-center rounded-full"
                style={{ background: s.value, boxShadow: design.accent === s.value ? '0 0 0 2px #fff, 0 0 0 4px var(--gold)' : undefined }}
              >
                {design.accent === s.value && <Check size={12} weight="bold" color="#fff" />}
              </button>
            ))}
            <label
              className="relative flex h-6 w-6 cursor-pointer items-center justify-center overflow-hidden rounded-full border text-[10px] font-semibold"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}
              title="Custom colour"
            >
              +
              <input
                type="color"
                value={design.accent}
                onChange={(e) => set('accent', e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="Custom accent colour"
              />
            </label>
          </div>
        </Field>
      </Section>

      <Section title="Letterhead">
        <Segmented
          value={design.letterhead.enabled ? 'on' : 'off'}
          options={[{ value: 'off', label: 'None' }, { value: 'on', label: 'Firm letterhead' }]}
          onChange={(v) => set('letterhead', { ...design.letterhead, enabled: v === 'on' })}
        />
        {design.letterhead.enabled && (
          <>
            <Field label="Layout">
              <Segmented
                value={design.letterhead.layout}
                options={[
                  { value: 'classic', label: 'Classic' },
                  { value: 'centered', label: 'Centred' },
                  { value: 'banner', label: 'Banner' },
                ]}
                onChange={(v) => set('letterhead', { ...design.letterhead, layout: v })}
              />
            </Field>
            <Toggle
              label="Show logo"
              checked={design.letterhead.showLogo}
              onChange={(c) => set('letterhead', { ...design.letterhead, showLogo: c })}
            />
            <Toggle
              label="Show address and contacts"
              checked={design.letterhead.showContacts}
              onChange={(c) => set('letterhead', { ...design.letterhead, showContacts: c })}
            />
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {firmName
                ? `Uses ${firmName}'s details from Settings.`
                : 'Add your firm details in Settings to fill the letterhead.'}
            </p>
          </>
        )}
      </Section>

      <Section title="Header and footer">
        <Field label="Header text">
          <Input
            value={design.header.text}
            maxLength={200}
            onChange={(e) => set('header', { ...design.header, text: e.target.value })}
            placeholder="e.g. Suit No. HC/COM/2026/0114"
            className="h-8 text-[12.5px]"
          />
        </Field>
        {design.header.text && (
          <AlignPicker value={design.header.align} onChange={(a) => set('header', { ...design.header, align: a })} />
        )}
        <Field label="Footer text">
          <Input
            value={design.footer.text}
            maxLength={200}
            onChange={(e) => set('footer', { ...design.footer, text: e.target.value })}
            placeholder="e.g. Private and confidential"
            className="h-8 text-[12.5px]"
          />
        </Field>
        <Field label="Page numbers">
          <Select
            items={NUMBER_ITEMS}
            value={design.footer.pageNumbers}
            onValueChange={(v) => v && set('footer', { ...design.footer, pageNumbers: v as DocumentDesign['footer']['pageNumbers'] })}
          >
            <SelectTrigger size="sm" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(NUMBER_ITEMS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        {(design.footer.text || design.footer.pageNumbers !== 'none') && (
          <AlignPicker value={design.footer.align} onChange={(a) => set('footer', { ...design.footer, align: a })} />
        )}
      </Section>

      <Section title="Watermark" last>
        <Select
          items={{ none: 'None', ...Object.fromEntries(WATERMARK_PRESETS.map((w) => [w, w])), custom: 'Custom text' }}
          value={watermarkMode}
          onValueChange={(v) => {
            if (v === 'none') set('watermark', { ...design.watermark, text: '' })
            else if (v === 'custom') set('watermark', { ...design.watermark, text: design.watermark.text && watermarkMode === 'custom' ? design.watermark.text : 'COPY FOR' })
            else if (v) set('watermark', { ...design.watermark, text: v })
          }}
        >
          <SelectTrigger size="sm" className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {WATERMARK_PRESETS.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
            <SelectItem value="custom">Custom text</SelectItem>
          </SelectContent>
        </Select>
        {watermarkMode === 'custom' && (
          <Input
            value={design.watermark.text}
            maxLength={40}
            onChange={(e) => set('watermark', { ...design.watermark, text: e.target.value.toUpperCase() })}
            className="mt-2 h-8 text-[12.5px]"
            aria-label="Watermark text"
          />
        )}
        {design.watermark.text && (
          <Field label={`Strength ${Math.round(design.watermark.opacity * 100)}%`}>
            <input
              type="range"
              min={0.03}
              max={0.25}
              step={0.01}
              value={design.watermark.opacity}
              onChange={(e) => set('watermark', { ...design.watermark, opacity: Number(e.target.value) })}
              className="w-full accent-[var(--gold)]"
              aria-label="Watermark strength"
            />
          </Field>
        )}
      </Section>
    </aside>
  )
}

// ── Pieces ───────────────────────────────────────────────────────────────

function Section({ title, children, last }: { title: string; children: ReactNode; last?: boolean }) {
  return (
    <section className="space-y-3 px-4 py-4" style={{ borderBottom: last ? 'none' : '1px solid var(--border-soft)' }}>
      <h3 className="font-heading text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {children}
    </div>
  )
}

function FontSelect({ value, onChange }: { value: DocumentDesign['typography']['font']; onChange: (v: DocumentDesign['typography']['font']) => void }) {
  return (
    <Select items={FONT_ITEMS} value={value} onValueChange={(v) => v && onChange(v as typeof value)}>
      <SelectTrigger size="sm" className="w-full"><SelectValue /></SelectTrigger>
      <SelectContent>
        {DOCUMENT_FONTS.map((f) => (
          <SelectItem key={f.id} value={f.id}><span style={{ fontFamily: fontFamily(f.id) }}>{f.label}</span></SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function Segmented<T extends string>({
  value, options, onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div role="radiogroup" className="flex rounded-lg p-0.5" style={{ background: 'var(--surface-sunken)' }}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className="h-7 flex-1 rounded-md px-2 text-[11.5px] font-semibold transition-colors"
            style={{
              background: active ? 'var(--surface-card)' : 'transparent',
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: active ? 'var(--shadow-xs)' : 'none',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function AlignPicker({ value, onChange }: { value: Alignment; onChange: (a: Alignment) => void }) {
  return (
    <Segmented
      value={value}
      options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centre' }, { value: 'right', label: 'Right' }]}
      onChange={onChange}
    />
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between text-[12.5px]"
      style={{ color: 'var(--text-secondary)' }}
    >
      {label}
      <span
        className="relative h-[18px] w-8 rounded-full transition-colors"
        style={{ background: checked ? 'var(--gold)' : 'var(--border-strong)' }}
      >
        <span
          className="absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white transition-all"
          style={{ left: checked ? 16 : 2 }}
        />
      </span>
    </button>
  )
}
