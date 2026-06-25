/**
 * Custom fields — local persisted store
 * =====================================
 *
 * What it stores
 * --------------
 * Firm-defined extra fields that attach to the core records — a
 * Client, a Case, or a Contact. Every firm tracks something the
 * built-in form doesn't have a box for: a client's Ghana Card
 * number, the court registry a matter is filed in, the language a
 * client prefers to be addressed in. Custom fields let the firm add
 * those boxes themselves instead of waiting on a product change.
 *
 * Shape
 * -----
 * Each CustomField is the *definition* (not a stored value):
 *   - `label`     — what the lawyer sees on the record form.
 *   - `entity`    — which record the field hangs off: client / case
 *                   / contact. One field belongs to one entity.
 *   - `type`      — how the value is captured: text, textarea,
 *                   number, date, select (dropdown), checkbox.
 *   - `options`   — choices for a `select` field; ignored otherwise.
 *   - `required`  — whether the record form must have a value before
 *                   it can be saved.
 *   - `helpText`  — optional hint shown under the field.
 *   - `active`    — disabled fields stay defined (so historical
 *                   values keep their label) but drop off new forms.
 *
 * Local persistence
 * -----------------
 * Same pattern as the other -local stores: persist with
 * skipHydration, manual rehydrate on first mount. When the backend
 * adds a `custom_fields` table the read API stays the same and only
 * the writes route through GraphQL mutations.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type FieldEntity = 'client' | 'case' | 'contact'

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'checkbox'

export interface CustomField {
  id: string
  label: string
  entity: FieldEntity
  type: FieldType
  /** Choices for a `select` field. Empty for every other type. */
  options: string[]
  required: boolean
  helpText: string | null
  /** Disabled fields stay defined but drop off new record forms. */
  active: boolean
  created_at: string
  updated_at: string
}

interface CustomFieldsStore {
  fields: Record<string, CustomField>
  /** Bumps on every write — selector hooks rerender via this scalar. */
  revision: number

  /**
   * Insert or update. Pass an existing `id` to update; omit to
   * create. Returns the saved field with its id resolved.
   */
  upsertField: (
    input: Omit<CustomField, 'id' | 'created_at' | 'updated_at'> & {
      id?: string
    },
  ) => CustomField
  /** Hard delete — used for clearly-mistaken definitions. */
  deleteField: (id: string) => void
  /** Toggle a field on/off without losing its definition. */
  setActive: (id: string, active: boolean) => void
}

// ── Helpers ───────────────────────────────────────────────────────
const newId = (): string =>
  `cf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

// ── Dev seed ──────────────────────────────────────────────────────
// A handful of fields a typical Ghana law office actually tracks, so
// the page renders with something under DEV_BYPASS. Firms edit these.
const DEV_NOW = '2026-05-15T09:00:00Z'
const seed = (
  id: string,
  partial: Omit<CustomField, 'id' | 'created_at' | 'updated_at'>,
): [string, CustomField] => [
  id,
  { id, created_at: DEV_NOW, updated_at: DEV_NOW, ...partial },
]

const DEV_SEED_FIELDS: Record<string, CustomField> = Object.fromEntries([
  seed('cf-seed-1', {
    label: 'Ghana Card number',
    entity: 'client',
    type: 'text',
    options: [],
    required: true,
    helpText: 'National ID printed on the client’s Ghana Card.',
    active: true,
  }),
  seed('cf-seed-2', {
    label: 'Preferred language',
    entity: 'client',
    type: 'select',
    options: ['English', 'Twi', 'Ga', 'Ewe', 'Hausa', 'Fante'],
    required: false,
    helpText: 'Language to use when corresponding with the client.',
    active: true,
  }),
  seed('cf-seed-3', {
    label: 'Suit number',
    entity: 'case',
    type: 'text',
    options: [],
    required: false,
    helpText: 'Court-assigned suit number once the matter is filed.',
    active: true,
  }),
  seed('cf-seed-4', {
    label: 'Court registry',
    entity: 'case',
    type: 'select',
    options: [
      'High Court (Accra)',
      'High Court (Kumasi)',
      'Circuit Court',
      'District Court',
      'Court of Appeal',
      'Supreme Court',
    ],
    required: false,
    helpText: 'Registry the matter is filed in.',
    active: true,
  }),
  seed('cf-seed-5', {
    label: 'Conflict check cleared',
    entity: 'case',
    type: 'checkbox',
    options: [],
    required: false,
    helpText: 'Tick once the conflict-of-interest check is complete.',
    active: true,
  }),
  seed('cf-seed-6', {
    label: 'Relationship to client',
    entity: 'contact',
    type: 'text',
    options: [],
    required: false,
    helpText: null,
    active: false,
  }),
])

export const useCustomFieldsStore = create<CustomFieldsStore>()(
  persist(
    (set) => ({
      fields: DEV_SEED_FIELDS,
      revision: 0,

      upsertField: (input) => {
        const now = new Date().toISOString()
        const id = input.id ?? newId()
        let saved: CustomField | null = null
        set((prev) => {
          const existing = prev.fields[id]
          const next: CustomField = {
            ...input,
            // Only `select` fields keep options; clear them otherwise
            // so a type change doesn't strand stale choices.
            options: input.type === 'select' ? input.options : [],
            id,
            created_at: existing?.created_at ?? now,
            updated_at: now,
          }
          saved = next
          return {
            fields: { ...prev.fields, [id]: next },
            revision: prev.revision + 1,
          }
        })
        return saved!
      },

      deleteField: (id) =>
        set((prev) => {
          if (!(id in prev.fields)) return prev
          const { [id]: _drop, ...rest } = prev.fields
          void _drop
          return { fields: rest, revision: prev.revision + 1 }
        }),

      setActive: (id, active) =>
        set((prev) => {
          const existing = prev.fields[id]
          if (!existing) return prev
          return {
            fields: {
              ...prev.fields,
              [id]: {
                ...existing,
                active,
                updated_at: new Date().toISOString(),
              },
            },
            revision: prev.revision + 1,
          }
        }),
    }),
    {
      name: 'll:custom-fields',
      partialize: (state) => ({ fields: state.fields }),
      skipHydration: true,
    },
  ),
)

// ── Selectors ─────────────────────────────────────────────────────

/** All fields, newest-defined last within an entity, grouped-friendly. */
export function listAllCustomFields(): CustomField[] {
  return Object.values(useCustomFieldsStore.getState().fields).sort((a, b) => {
    const byEntity = a.entity.localeCompare(b.entity)
    return byEntity !== 0 ? byEntity : a.label.localeCompare(b.label)
  })
}

/** Active fields for one entity — drives the real record forms. */
export function listActiveFieldsForEntity(entity: FieldEntity): CustomField[] {
  return listAllCustomFields().filter((f) => f.active && f.entity === entity)
}
