import { z } from 'zod'

// ── Auth schemas ─────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z
  .object({
    name: z.string().min(1, 'Full name is required'),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    firm: z.string().optional(),
    role: z.enum(['lawyer', 'senior_partner', 'associate', 'paralegal']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// ── Business schemas (match actual DB column names) ──────────────────────

export const clientSchema = z.object({
  full_name: z.string().min(1, 'Client name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  ghana_card: z.string().optional().or(z.literal('')),
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
  matter_type: z.string().optional().or(z.literal('')),
  assigned_lawyer: z.string().optional().or(z.literal('')),
  status: z.enum(['Active', 'Pending', 'Closed']).default('Active'),
  next_court_date: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
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
export type ClientFormData = z.infer<typeof clientSchema>
export type CaseFormData = z.infer<typeof caseSchema>
export type TaskFormData = z.infer<typeof taskSchema>
export type DocumentFormData = z.infer<typeof documentSchema>
export type InvoiceFormData = z.infer<typeof invoiceSchema>
