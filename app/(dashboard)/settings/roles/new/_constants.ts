import {
  Bank,
  Briefcase,
  Clock,
  CreditCard,
  Gear as SettingsIcon,
  ListChecks,
  Lock,
  Receipt,
  ShieldWarning,
  Trash,
  Users,
} from '@phosphor-icons/react'
import type { SectionDef } from './_types'

export const PERMISSION_SECTIONS: SectionDef[] = [
  {
    id: 'contacts',
    label: 'Clients & Contacts management',
    description:
      'Limits who can view, edit, create, delete or export, and set different permissions for clients and contacts.',
    note: 'Updating contact permissions may affect third-party integrations and the client portal.',
    groups: [
      {
        id: 'contacts',
        label: 'Contacts',
        Icon: Users,
        permissions: [
          { id: 'create-contacts', label: 'Create contacts' },
          { id: 'edit-contacts', label: 'Edit contacts' },
          { id: 'delete-contacts', label: 'Delete contacts' },
          { id: 'bulk-delete-contacts', label: 'Bulk delete contacts' },
          { id: 'export-contacts', label: 'Export contacts' },
          { id: 'send-review-requests', label: 'Send review requests' },
        ],
      },
    ],
  },
  {
    id: 'cases',
    label: 'Cases & Matters management',
    description:
      'Limits who can view, edit, create, delete, export, or perform bulk actions and set different permissions for cases.',
    note: 'Cases and their connected items (documents, notes, tasks, communications, and activities) are also governed by matter permissions controlled by groups.',
    groups: [
      {
        id: 'cases',
        label: 'Cases',
        Icon: Briefcase,
        permissions: [
          { id: 'create-cases', label: 'Create cases' },
          { id: 'edit-case-properties', label: 'Edit case properties' },
          { id: 'bulk-edit-cases', label: 'Bulk edit cases' },
          { id: 'delete-cases', label: 'Delete cases' },
          { id: 'bulk-delete-cases', label: 'Bulk delete cases' },
          { id: 'export-cases', label: 'Export cases' },
          { id: 'view-case-timeline', label: 'View case timeline' },
          { id: 'view-restricted-cases', label: 'View restricted cases' },
          { id: 'view-case-financials', label: 'View case financials' },
        ],
      },
    ],
  },
  {
    id: 'timekeeping',
    label: 'Timekeeping & Activities',
    description:
      'Enables access to activities, where time and expenses are tracked against cases.',
    note: 'Activities are also governed by matter permissions controlled by groups.',
    groups: [
      {
        id: 'activities',
        label: 'Activities',
        Icon: Clock,
        permissions: [
          { id: 'view-own-activities', label: 'View own activities' },
          { id: 'edit-own-activities', label: 'Edit own activities' },
          { id: 'delete-own-activities', label: 'Delete own activities' },
          {
            id: 'view-team-activities',
            label: 'View other users’ activities',
          },
          {
            id: 'edit-team-activities',
            label: 'Edit other users’ activities',
          },
        ],
      },
    ],
  },
  {
    id: 'financial',
    label: 'Billing & Financial management',
    description:
      'Provides access to financial management, including bills and client fund requests.',
    newCount: 2,
    groups: [
      {
        id: 'accounts',
        label: 'Accounts',
        Icon: Bank,
        permissions: [
          { id: 'view-accounts', label: 'View trust and operating accounts' },
          { id: 'manage-account-info', label: 'Manage account information' },
        ],
      },
      {
        id: 'transactions',
        label: 'Transactions',
        Icon: CreditCard,
        permissions: [
          { id: 'view-transactions', label: 'View transactions' },
          { id: 'create-transactions', label: 'Create transactions' },
          { id: 'manage-transactions', label: 'Manage transactions' },
        ],
      },
      {
        id: 'bills',
        label: 'Bills and client fund requests',
        Icon: Receipt,
        permissions: [
          { id: 'view-bills', label: 'View bills and trust requests' },
          { id: 'manage-bills', label: 'Manage bills and trust requests' },
          {
            id: 'create-bills',
            label: 'Create bills and client fund requests',
          },
        ],
      },
    ],
  },
  {
    id: 'firm',
    label: 'Firm settings',
    description: 'Manages firm-wide settings across objects and accounts.',
    groups: [
      {
        id: 'account-settings',
        label: 'Account settings',
        Icon: SettingsIcon,
        permissions: [
          { id: 'view-firm-feed', label: 'View account firm feed' },
          { id: 'manage-roles', label: 'Manage roles' },
          { id: 'manage-users', label: 'Manage users' },
          { id: 'manage-custom-fields', label: 'Manage custom fields' },
          {
            id: 'manage-review-location',
            label: 'Manage location for review requests',
          },
        ],
      },
    ],
  },
  {
    id: 'conflict',
    label: 'Conflict check',
    description:
      'Limits who can use conflict check and view the conflict-of-interest report.',
    groups: [
      {
        id: 'conflict',
        label: 'Conflict check',
        Icon: ShieldWarning,
        permissions: [
          { id: 'manage-conflict-checks', label: 'Manage conflict checks' },
          { id: 'view-conflict-report', label: 'View conflict check report' },
        ],
      },
    ],
  },
  {
    id: 'tasks',
    label: 'Tasks management',
    description: 'Controls who can view, edit, and bulk-delete tasks.',
    newCount: 1,
    groups: [
      {
        id: 'view-tasks',
        label: 'View tasks',
        Icon: ListChecks,
        permissions: [
          {
            id: 'view-assigned-tasks',
            label: 'View tasks from assigned matters',
          },
          { id: 'view-all-tasks', label: 'View tasks across the firm' },
        ],
      },
      {
        id: 'bulk-tasks',
        label: 'Bulk delete tasks',
        Icon: Trash,
        permissions: [
          { id: 'bulk-delete-tasks', label: 'Bulk delete tasks' },
        ],
      },
    ],
  },
  {
    id: 'non-config',
    label: 'Non-configurable permissions',
    description:
      'These permissions are always granted and cannot be modified. Listed here for visibility.',
    groups: [
      {
        id: 'non-config',
        label: 'Always granted',
        Icon: Lock,
        permissions: [
          { id: 'view-own-profile', label: 'View and edit own profile' },
          { id: 'change-password', label: 'Change own password' },
          { id: 'sign-in-out', label: 'Sign in and sign out' },
        ],
      },
    ],
  },
]

/** Templates pre-fill permission IDs to `true`. */
export const TEMPLATE_PERMISSIONS: Record<string, string[]> = {
  administrator: PERMISSION_SECTIONS.flatMap((s) =>
    s.groups.flatMap((g) => g.permissions.map((p) => p.id)),
  ),
  accounts: [
    'view-accounts',
    'manage-account-info',
    'view-transactions',
    'create-transactions',
    'manage-transactions',
  ],
  reports: ['view-own-activities', 'view-team-activities', 'view-bills'],
  billing: [
    'view-bills',
    'manage-bills',
    'create-bills',
    'view-transactions',
  ],
  'general-access': [
    'create-contacts',
    'edit-contacts',
    'send-review-requests',
    'create-cases',
    'edit-case-properties',
    'view-case-timeline',
    'view-own-activities',
    'edit-own-activities',
    'view-assigned-tasks',
  ],
}

/** Permissions enabled by default even without a template. */
export const DEFAULT_ENABLED = new Set([
  'view-own-activities',
  'view-assigned-tasks',
])

/** Non-configurable section permissions — always on, locked. */
export const ALWAYS_ON = new Set(
  PERMISSION_SECTIONS.find((s) => s.id === 'non-config')!.groups.flatMap((g) =>
    g.permissions.map((p) => p.id),
  ),
)

export const TEMPLATE_OPTIONS = [
  { value: '', label: 'Without a role as a template' },
  { value: 'administrator', label: 'Administrator' },
  { value: 'accounts', label: 'Accounts' },
  { value: 'reports', label: 'Reports' },
  { value: 'billing', label: 'Billing' },
  { value: 'general-access', label: 'General Access' },
]

export const SIDEBAR_ITEMS = [
  { id: 'role-details', label: 'Role details' },
  { id: 'template', label: 'Choose a role template' },
  ...PERMISSION_SECTIONS.map((s) => ({ id: s.id, label: s.label })),
]
