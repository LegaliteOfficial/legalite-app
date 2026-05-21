import { describe, it, expect } from 'vitest'
import {
  clientSchema,
  caseSchema,
  taskSchema,
  invoiceSchema,
  documentSchema,
  loginSchema,
} from '../index'

// ── clientSchema ────────────────────────────────────────────────────────

describe('clientSchema', () => {
  it('accepts valid client data with all fields', () => {
    const result = clientSchema.safeParse({
      full_name: 'Kwame Asante',
      email: 'kwame@example.com',
      phone: '+233201234567',
      ghana_card: 'GHA-123456789-0',
      address: 'Accra, Ghana',
      status: 'Active',
      notes: 'VIP client',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty full_name', () => {
    const result = clientSchema.safeParse({
      full_name: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nameError = result.error.issues.find((i) => i.path.includes('full_name'))
      expect(nameError).toBeDefined()
    }
  })

  it('accepts optional fields omitted', () => {
    const result = clientSchema.safeParse({
      full_name: 'Ama Mensah',
    })
    expect(result.success).toBe(true)
  })

  it('defaults status to Active when not provided', () => {
    const result = clientSchema.safeParse({
      full_name: 'Kofi Boateng',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('Active')
    }
  })

  it('accepts empty strings for optional fields', () => {
    const result = clientSchema.safeParse({
      full_name: 'Test Client',
      email: '',
      phone: '',
      ghana_card: '',
      address: '',
      notes: '',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email format', () => {
    const result = clientSchema.safeParse({
      full_name: 'Test',
      email: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid status value', () => {
    const result = clientSchema.safeParse({
      full_name: 'Test',
      status: 'Unknown',
    })
    expect(result.success).toBe(false)
  })
})

// ── caseSchema ──────────────────────────────────────────────────────────

describe('caseSchema', () => {
  it('accepts valid case data', () => {
    const result = caseSchema.safeParse({
      title: 'Land dispute case',
      client_id: 'uuid-123',
      court: 'High Court',
      suit_number: 'HC/2024/001',
    })
    expect(result.success).toBe(true)
  })

  it('requires title', () => {
    const result = caseSchema.safeParse({
      title: '',
      client_id: 'uuid-123',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('title'))).toBe(true)
    }
  })

  it('requires client_id', () => {
    const result = caseSchema.safeParse({
      title: 'Some case',
      client_id: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('client_id'))).toBe(true)
    }
  })

  it('defaults status to Active', () => {
    const result = caseSchema.safeParse({
      title: 'Test case',
      client_id: 'uuid-456',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('Active')
    }
  })

  it('accepts optional fields', () => {
    const result = caseSchema.safeParse({
      title: 'Minimal case',
      client_id: 'uuid-789',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.court).toBeUndefined()
      expect(result.data.suit_number).toBeUndefined()
    }
  })
})

// ── taskSchema ──────────────────────────────────────────────────────────

describe('taskSchema', () => {
  it('accepts valid task data', () => {
    const result = taskSchema.safeParse({
      title: 'Draft motion for summary judgment',
      priority: 'High',
      status: 'In Progress',
    })
    expect(result.success).toBe(true)
  })

  it('requires title', () => {
    const result = taskSchema.safeParse({
      title: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('title'))).toBe(true)
    }
  })

  it('defaults priority to Medium', () => {
    const result = taskSchema.safeParse({
      title: 'Review documents',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.priority).toBe('Medium')
    }
  })

  it('defaults status to Pending', () => {
    const result = taskSchema.safeParse({
      title: 'File brief',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('Pending')
    }
  })

  it('rejects invalid priority', () => {
    const result = taskSchema.safeParse({
      title: 'Task',
      priority: 'Urgent',
    })
    expect(result.success).toBe(false)
  })
})

// ── invoiceSchema ───────────────────────────────────────────────────────

describe('invoiceSchema', () => {
  it('accepts valid invoice data', () => {
    const result = invoiceSchema.safeParse({
      client_id: 'uuid-inv-1',
      amount_ghs: 500.0,
      due_date: '2025-06-15',
      description: 'Legal consultation',
      status: 'Draft',
    })
    expect(result.success).toBe(true)
  })

  it('requires client_id', () => {
    const result = invoiceSchema.safeParse({
      client_id: '',
      amount_ghs: 100,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('client_id'))).toBe(true)
    }
  })

  it('requires amount_ghs >= 0.01', () => {
    const result = invoiceSchema.safeParse({
      client_id: 'uuid-inv-2',
      amount_ghs: 0.01,
    })
    expect(result.success).toBe(true)
  })

  it('rejects zero amount', () => {
    const result = invoiceSchema.safeParse({
      client_id: 'uuid-inv-3',
      amount_ghs: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative amount', () => {
    const result = invoiceSchema.safeParse({
      client_id: 'uuid-inv-4',
      amount_ghs: -50,
    })
    expect(result.success).toBe(false)
  })

  it('coerces string amounts to numbers', () => {
    const result = invoiceSchema.safeParse({
      client_id: 'uuid-inv-5',
      amount_ghs: '250.50',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.amount_ghs).toBe(250.5)
    }
  })

  it('defaults status to Draft', () => {
    const result = invoiceSchema.safeParse({
      client_id: 'uuid-inv-6',
      amount_ghs: 100,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('Draft')
    }
  })
})

// ── documentSchema ──────────────────────────────────────────────────────

describe('documentSchema', () => {
  it('accepts valid document data', () => {
    const result = documentSchema.safeParse({
      title: 'Affidavit of Service',
      case_id: 'case-1',
      client_id: 'client-1',
      template_type: 'affidavit',
      content: 'Document body here',
    })
    expect(result.success).toBe(true)
  })

  it('requires title', () => {
    const result = documentSchema.safeParse({
      title: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('title'))).toBe(true)
    }
  })

  it('accepts all other fields as optional', () => {
    const result = documentSchema.safeParse({
      title: 'Minimal document',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.case_id).toBeUndefined()
      expect(result.data.client_id).toBeUndefined()
      expect(result.data.template_type).toBeUndefined()
    }
  })
})

// ── loginSchema ─────────────────────────────────────────────────────────

describe('loginSchema', () => {
  it('accepts valid login data', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'secret123',
    })
    expect(result.success).toBe(true)
  })

  it('requires email', () => {
    const result = loginSchema.safeParse({
      email: '',
      password: 'secret123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-valid',
      password: 'secret123',
    })
    expect(result.success).toBe(false)
  })

  it('requires password with min 6 characters', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '12345',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const pwError = result.error.issues.find((i) => i.path.includes('password'))
      expect(pwError?.message).toBe('Password must be at least 6 characters')
    }
  })

  it('accepts exactly 6 character password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '123456',
    })
    expect(result.success).toBe(true)
  })
})
