import type {
  FieldEntity,
  FieldType,
} from '@/stores/custom-fields-local.store'
import type { EntityTabId } from './_types'

export const TABS: { id: EntityTabId; label: string }[] = [
  { id: 'all', label: 'All fields' },
  { id: 'client', label: 'Clients' },
  { id: 'case', label: 'Cases' },
  { id: 'contact', label: 'Contacts' },
]

/** Singular label for each entity — used in the table and dialog. */
export const ENTITY_LABEL: Record<FieldEntity, string> = {
  client: 'Client',
  case: 'Case',
  contact: 'Contact',
}

/** Field types offered in the dialog, in the order they appear. */
export const FIELD_TYPES: { id: FieldType; label: string; hint: string }[] = [
  { id: 'text', label: 'Text', hint: 'Single line of text' },
  { id: 'textarea', label: 'Paragraph', hint: 'Multiple lines of text' },
  { id: 'number', label: 'Number', hint: 'Numeric value' },
  { id: 'date', label: 'Date', hint: 'Calendar date' },
  { id: 'select', label: 'Dropdown', hint: 'Pick one of several options' },
  { id: 'checkbox', label: 'Checkbox', hint: 'A yes / no toggle' },
]

export const FIELD_TYPE_LABEL: Record<FieldType, string> = Object.fromEntries(
  FIELD_TYPES.map((t) => [t.id, t.label]),
) as Record<FieldType, string>
