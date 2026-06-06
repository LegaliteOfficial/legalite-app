import { z } from 'zod'

// ── Auth schemas ─────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

// Owner registration — the public signup form. Every signup creates a firm;
// solo practitioners simply name their own practice. There is no
// "individual lawyer" signup path; lawyers without a firm join through an
// invitation (see acceptInviteSchema). See docs/TENANCY.md §1, §5.
export const registerOwnerSchema = z
  .object({
    name: z.string().min(1, 'Full name is required'),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    firm_name: z
      .string()
      .min(1, 'Firm or practice name is required')
      .max(120),
    firm_type: z
      .enum(['sole_practice', 'partnership', 'chamber', 'corporate_firm'])
      .optional(),
    professional_title: z
      .enum([
        'senior_partner',
        'partner',
        'managing_partner',
        'lawyer',
        'associate',
        'paralegal',
      ])
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// Kept as an alias so old import paths keep working during the transition.
export const registerSchema = registerOwnerSchema

// Invitation acceptance — invitee sets name + password. Email + firm +
// role come from the invitation row, not the form.
export const acceptInviteSchema = z
  .object({
    token: z.string().min(1),
    name: z.string().min(1, 'Full name is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// Ghana lawyer profile (post-signup completion / settings).
export const lawyerProfileSchema = z.object({
  first_name: z.string().min(1).optional(),
  middle_name: z.string().optional(),
  last_name: z.string().min(1).optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),

  gba_number: z.string().max(64).optional(),
  supreme_court_enrollment_no: z.string().max(64).optional(),
  year_called_to_bar: z.coerce
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear())
    .optional(),
  practising_license_no: z.string().max(64).optional(),
  practising_license_year: z.coerce
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional(),
  ghana_card_no: z.string().max(32).optional(),
  passport_no: z.string().max(32).optional(),

  bio: z.string().max(2000).optional(),
  practice_type: z.enum(['solo', 'firm_associated']).optional(),

  office_address: z.string().optional(),
  // GhanaPost GPS: e.g. GA-123-4567 — letters-digits-digits.
  digital_address: z
    .string()
    .regex(/^[A-Z]{2}-\d{3,4}-\d{3,4}$/, 'Use GhanaPost format, e.g. GA-123-4567')
    .optional()
    .or(z.literal('')),
  city: z.string().optional(),
  region: z.string().optional(),
  work_email: z.string().email().optional().or(z.literal('')),
  work_phone: z.string().optional(),
  phone: z.string().optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
})

// Invite a teammate (admin console). role_ids are the custom firm roles to
// grant on acceptance (the granular permission layer); firm_role is the coarse
// compatibility value.
export const inviteMemberSchema = z.object({
  email: z.string().email(),
  firm_role: z.enum(['admin', 'member']).default('member'),
  professional_title: z
    .enum([
      'senior_partner',
      'partner',
      'managing_partner',
      'lawyer',
      'associate',
      'paralegal',
      'support_staff',
      'secretary',
    ])
    .default('lawyer'),
  role_ids: z.array(z.string().uuid()).default([]),
})

// Create / edit a custom firm role. Permissions are catalog slugs; the backend
// validates them against its permission catalog.
export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(80),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()).default([]),
})

export type CreateRoleFormData = z.infer<typeof createRoleSchema>

// Owner-only: hand the firm over to another active member.
export const transferOwnershipSchema = z.object({
  new_owner_profile_id: z.string().uuid(),
  new_role_for_outgoing_owner: z.enum(['admin', 'member']).default('admin'),
  reason: z.string().max(500).optional(),
})

// Practice areas selection.
export const setPracticeAreasSchema = z
  .object({
    practice_area_ids: z.array(z.string().uuid()).max(20),
    primary_practice_area_id: z.string().uuid().optional(),
  })
  .refine(
    (d) =>
      !d.primary_practice_area_id ||
      d.practice_area_ids.includes(d.primary_practice_area_id),
    {
      message: 'Primary area must be one of the selected areas',
      path: ['primary_practice_area_id'],
    },
  )

// ── Business schemas (match actual DB column names) ──────────────────────

export const clientSchema = z.object({
  // Firm-defined ID. Some firms auto-generate (LL-0001 style), others
  // type their own. Optional so quick-create stays one field.
  client_code: z.string().optional().or(z.literal('')),
  full_name: z.string().min(1, 'Client name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  ghana_card: z.string().optional().or(z.literal('')),
  // ISO yyyy-mm-dd (HTML <input type="date"> output format). Backend
  // column lands with the contact-detail screen migration.
  date_of_birth: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  status: z.enum(['Active', 'Inactive']).default('Active'),
  notes: z.string().optional().or(z.literal('')),
})

export const caseSchema = z.object({
  title: z.string().min(1, 'Case title is required'),
  client_id: z.string().min(1, 'Select a client'),
  court: z.string().optional().or(z.literal('')),
  suit_number: z.string().optional().or(z.literal('')),
  opposing_party: z.string().optional().or(z.literal('')),
  // Renamed from matter_type — also relabelled as "Practice area" in the UI.
  case_type: z.string().optional().or(z.literal('')),
  // Workflow stage within the case (Discovery / Trial prep / etc.).
  // Free-text for now; we'll constrain to a configurable list once
  // "Stages" admin screen lands.
  case_stage: z.string().optional().or(z.literal('')),
  assigned_lawyer: z.string().optional().or(z.literal('')),
  originating_lawyer: z.string().optional().or(z.literal('')),
  status: z.enum(['Open', 'Pending', 'Closed']).default('Open'),
  next_court_date: z.string().optional().or(z.literal('')),
  date_opened: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  // JSON blob of the extended new-case form fields (reminders, statute, tags,
  // billing, permissions, …). Owned by the case editor; opaque to the backend.
  details: z.string().optional(),
  // Firm members assigned to the case (they're notified by email on create).
  assignments: z
    .array(
      z.object({
        member_id: z.string(),
        assignment_role: z.string().optional(),
      }),
    )
    .optional(),
})

export const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  client_id: z.string().optional().or(z.literal('')),
  case_id: z.string().optional().or(z.literal('')),
  priority: z.enum(['High', 'Medium', 'Low']).default('Medium'),
  status: z.enum(['Pending', 'In Progress', 'Done']).default('Pending'),
  due_date: z.string().optional().or(z.literal('')),
  assigned_to: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

export const documentSchema = z.object({
  title: z.string().min(1, 'Document title is required'),
  case_id: z.string().optional().or(z.literal('')),
  client_id: z.string().optional().or(z.literal('')),
  template_type: z.string().optional().or(z.literal('')),
  court: z.string().optional().or(z.literal('')),
  suit_number: z.string().optional().or(z.literal('')),
  parties: z.string().optional().or(z.literal('')),
  judge: z.string().optional().or(z.literal('')),
  content: z.string().optional().or(z.literal('')),
})

export const invoiceSchema = z.object({
  client_id: z.string().min(1, 'Select a client'),
  amount_ghs: z.coerce.number().min(0.01, 'Enter a valid amount'),
  due_date: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  status: z.enum(['Draft', 'Sent', 'Paid', 'Overdue']).default('Draft'),
})

// ── Inferred form types ──────────────────────────────────────────────────

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type RegisterOwnerFormData = z.infer<typeof registerOwnerSchema>
export type AcceptInviteFormData = z.infer<typeof acceptInviteSchema>
export type LawyerProfileFormData = z.infer<typeof lawyerProfileSchema>
export type InviteMemberFormData = z.infer<typeof inviteMemberSchema>
export type TransferOwnershipFormData = z.infer<typeof transferOwnershipSchema>
export type SetPracticeAreasFormData = z.infer<typeof setPracticeAreasSchema>
export type ClientFormData = z.infer<typeof clientSchema>
export type CaseFormData = z.infer<typeof caseSchema>
export type TaskFormData = z.infer<typeof taskSchema>
export type DocumentFormData = z.infer<typeof documentSchema>
export type InvoiceFormData = z.infer<typeof invoiceSchema>
