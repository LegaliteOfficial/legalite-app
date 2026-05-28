// Ghana Legal Document Templates
// Each template includes metadata and a content generator function

export interface DocumentTemplate {
  id: string
  name: string
  category: 'litigation' | 'corporate' | 'conveyancing' | 'family' | 'criminal'
  description: string
  fields: TemplateField[]
  /**
   * Maps template field keys to a function that derives the value from
   * the selected case + client. Returning '' or null leaves the field empty.
   * Only present on templates that support case-based auto-fill (v1: top 3).
   */
  caseFieldMap?: Record<string, (ctx: CaseContext) => string>
}

export interface TemplateField {
  key: string
  label: string
  type: 'text' | 'date' | 'select' | 'textarea'
  placeholder?: string
  required?: boolean
  options?: string[]
}

/** Context passed to caseFieldMap functions. Plain types only — no React. */
export interface CaseContext {
  client: {
    full_name: string
    email?: string | null
    phone?: string | null
    address?: string | null
    ghana_card?: string | null
  }
  case: {
    title: string
    court?: string | null
    suit_number?: string | null
    opposing_party?: string | null
    case_type?: string | null
    next_court_date?: string | null
    notes?: string | null
  }
}

export const GHANA_COURTS = [
  'Supreme Court of Ghana',
  'Court of Appeal',
  'High Court (General Division)',
  'High Court (Commercial Division)',
  'High Court (Land Division)',
  'High Court (Human Rights Division)',
  'High Court (Financial and Economic Division)',
  'Circuit Court',
  'District Court',
  'Magistrate Court',
  'Juvenile Court',
  'Family Tribunal',
] as const

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'writ-of-summons',
    name: 'Writ of Summons',
    category: 'litigation',
    description: 'Commences a civil action in the High Court or Circuit Court.',
    fields: [
      { key: 'plaintiff', label: 'Plaintiff', type: 'text', placeholder: 'Full name of plaintiff', required: true },
      { key: 'defendant', label: 'Defendant', type: 'text', placeholder: 'Full name of defendant', required: true },
      { key: 'claim', label: 'Nature of Claim', type: 'textarea', placeholder: 'Brief description of the claim', required: true },
      { key: 'reliefs', label: 'Reliefs Sought', type: 'textarea', placeholder: 'List the reliefs sought', required: true },
    ],
    caseFieldMap: {
      plaintiff: (ctx) => ctx.client.full_name,
      defendant: (ctx) => ctx.case.opposing_party ?? '',
    },
  },
  {
    id: 'statement-of-claim',
    name: 'Statement of Claim',
    category: 'litigation',
    description: 'Sets out the facts and legal basis for a civil claim.',
    fields: [
      { key: 'plaintiff', label: 'Plaintiff', type: 'text', required: true },
      { key: 'defendant', label: 'Defendant', type: 'text', required: true },
      { key: 'facts', label: 'Statement of Facts', type: 'textarea', placeholder: 'Detailed facts of the case', required: true },
      { key: 'legal_basis', label: 'Legal Basis', type: 'textarea', placeholder: 'Laws and precedents relied upon' },
      { key: 'reliefs', label: 'Reliefs Sought', type: 'textarea', required: true },
    ],
    caseFieldMap: {
      plaintiff: (ctx) => ctx.client.full_name,
      defendant: (ctx) => ctx.case.opposing_party ?? '',
    },
  },
  {
    id: 'statement-of-defence',
    name: 'Statement of Defence',
    category: 'litigation',
    description: 'Defendant\'s response to a Statement of Claim.',
    fields: [
      { key: 'plaintiff', label: 'Plaintiff', type: 'text', required: true },
      { key: 'defendant', label: 'Defendant', type: 'text', required: true },
      { key: 'defence', label: 'Defence', type: 'textarea', placeholder: 'Response to each paragraph of the claim', required: true },
      { key: 'counterclaim', label: 'Counterclaim (if any)', type: 'textarea' },
    ],
  },
  {
    id: 'motion-on-notice',
    name: 'Motion on Notice',
    category: 'litigation',
    description: 'Application to the court with prior notice to the opposing party.',
    fields: [
      { key: 'applicant', label: 'Applicant', type: 'text', required: true },
      { key: 'respondent', label: 'Respondent', type: 'text', required: true },
      { key: 'grounds', label: 'Grounds of Application', type: 'textarea', required: true },
      { key: 'orders_sought', label: 'Orders Sought', type: 'textarea', required: true },
    ],
    caseFieldMap: {
      applicant: (ctx) => ctx.client.full_name,
      respondent: (ctx) => ctx.case.opposing_party ?? '',
    },
  },
  {
    id: 'motion-ex-parte',
    name: 'Motion Ex Parte',
    category: 'litigation',
    description: 'Urgent application to the court without notice to the other party.',
    fields: [
      { key: 'applicant', label: 'Applicant', type: 'text', required: true },
      { key: 'respondent', label: 'Respondent', type: 'text', required: true },
      { key: 'urgency', label: 'Reason for Urgency', type: 'textarea', required: true },
      { key: 'orders_sought', label: 'Orders Sought', type: 'textarea', required: true },
    ],
  },
  {
    id: 'affidavit',
    name: 'Affidavit',
    category: 'litigation',
    description: 'Sworn statement of facts in support of a motion or application.',
    fields: [
      { key: 'deponent', label: 'Deponent (Person Swearing)', type: 'text', required: true },
      { key: 'occupation', label: 'Occupation', type: 'text' },
      { key: 'address', label: 'Address', type: 'text' },
      { key: 'facts', label: 'Facts Deposed To', type: 'textarea', required: true },
    ],
  },
  {
    id: 'notice-of-appeal',
    name: 'Notice of Appeal',
    category: 'litigation',
    description: 'Initiates an appeal against a court decision.',
    fields: [
      { key: 'appellant', label: 'Appellant', type: 'text', required: true },
      { key: 'respondent', label: 'Respondent', type: 'text', required: true },
      { key: 'decision_date', label: 'Date of Decision', type: 'date', required: true },
      { key: 'judge', label: 'Judge/Panel', type: 'text' },
      { key: 'grounds', label: 'Grounds of Appeal', type: 'textarea', required: true },
    ],
  },
  {
    id: 'witness-statement',
    name: 'Witness Statement',
    category: 'litigation',
    description: 'Written testimony of a witness for use at trial.',
    fields: [
      { key: 'witness_name', label: 'Witness Name', type: 'text', required: true },
      { key: 'relationship', label: 'Relationship to Parties', type: 'text' },
      { key: 'testimony', label: 'Witness Testimony', type: 'textarea', required: true },
    ],
  },
  {
    id: 'power-of-attorney',
    name: 'Power of Attorney',
    category: 'corporate',
    description: 'Grants legal authority to act on behalf of another person.',
    fields: [
      { key: 'grantor', label: 'Grantor', type: 'text', required: true },
      { key: 'attorney', label: 'Attorney-in-Fact', type: 'text', required: true },
      { key: 'powers', label: 'Powers Granted', type: 'textarea', required: true },
      { key: 'duration', label: 'Duration', type: 'text', placeholder: 'e.g. Until revoked / 12 months' },
    ],
  },
  {
    id: 'lease-agreement',
    name: 'Lease Agreement',
    category: 'conveyancing',
    description: 'Agreement for the lease of property in Ghana.',
    fields: [
      { key: 'lessor', label: 'Lessor (Landlord)', type: 'text', required: true },
      { key: 'lessee', label: 'Lessee (Tenant)', type: 'text', required: true },
      { key: 'property', label: 'Property Description', type: 'textarea', required: true },
      { key: 'term', label: 'Lease Term', type: 'text', placeholder: 'e.g. 2 years' },
      { key: 'rent', label: 'Monthly Rent (GHS)', type: 'text', required: true },
    ],
  },
  {
    id: 'bail-application',
    name: 'Bail Application',
    category: 'criminal',
    description: 'Application for bail in criminal proceedings.',
    fields: [
      { key: 'accused', label: 'Accused Person', type: 'text', required: true },
      { key: 'offence', label: 'Offence Charged', type: 'text', required: true },
      { key: 'grounds', label: 'Grounds for Bail', type: 'textarea', required: true },
      { key: 'surety', label: 'Proposed Surety', type: 'text' },
    ],
  },
  {
    id: 'petition-for-divorce',
    name: 'Petition for Divorce',
    category: 'family',
    description: 'Initiates divorce proceedings under the Matrimonial Causes Act.',
    fields: [
      { key: 'petitioner', label: 'Petitioner', type: 'text', required: true },
      { key: 'respondent', label: 'Respondent', type: 'text', required: true },
      { key: 'marriage_date', label: 'Date of Marriage', type: 'date', required: true },
      { key: 'grounds', label: 'Grounds for Divorce', type: 'textarea', required: true },
      { key: 'children', label: 'Children of Marriage', type: 'textarea' },
    ],
  },
]

export function generateDocumentContent(
  templateId: string,
  court: string,
  suitNumber: string,
  title: string,
  fields: Record<string, string>,
): string {
  const template = DOCUMENT_TEMPLATES.find((t) => t.id === templateId)
  if (!template) return ''

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  let content = ''

  // Header
  content += `IN THE ${court.toUpperCase()}\n\n`
  if (suitNumber) content += `SUIT NO: ${suitNumber}\n\n`

  // Document-specific content
  switch (templateId) {
    case 'writ-of-summons':
      content += `${fields.plaintiff?.toUpperCase() ?? '...'} ... PLAINTIFF\n`
      content += `VS.\n`
      content += `${fields.defendant?.toUpperCase() ?? '...'} ... DEFENDANT\n\n`
      content += `${'='.repeat(50)}\n`
      content += `WRIT OF SUMMONS\n`
      content += `${'='.repeat(50)}\n\n`
      content += `TO: ${fields.defendant ?? '...'}\n\n`
      content += `You are hereby commanded to cause an appearance to be entered for you within eight (8) days after service of this Writ on you, inclusive of the day of service.\n\n`
      content += `The Plaintiff's claim against you is for:\n\n`
      content += `${fields.claim ?? '...'}\n\n`
      content += `RELIEFS SOUGHT:\n\n`
      content += `${fields.reliefs ?? '...'}\n\n`
      break

    case 'statement-of-claim':
      content += `${fields.plaintiff?.toUpperCase() ?? '...'} ... PLAINTIFF\n`
      content += `VS.\n`
      content += `${fields.defendant?.toUpperCase() ?? '...'} ... DEFENDANT\n\n`
      content += `${'='.repeat(50)}\n`
      content += `STATEMENT OF CLAIM\n`
      content += `${'='.repeat(50)}\n\n`
      content += `The Plaintiff says as follows:\n\n`
      content += `FACTS:\n${fields.facts ?? '...'}\n\n`
      if (fields.legal_basis) content += `LEGAL BASIS:\n${fields.legal_basis}\n\n`
      content += `RELIEFS:\n${fields.reliefs ?? '...'}\n\n`
      break

    case 'statement-of-defence':
      content += `${fields.plaintiff?.toUpperCase() ?? '...'} ... PLAINTIFF\n`
      content += `VS.\n`
      content += `${fields.defendant?.toUpperCase() ?? '...'} ... DEFENDANT\n\n`
      content += `${'='.repeat(50)}\n`
      content += `STATEMENT OF DEFENCE\n`
      content += `${'='.repeat(50)}\n\n`
      content += `The Defendant says as follows in answer to the Plaintiff's Statement of Claim:\n\n`
      content += `${fields.defence ?? '...'}\n\n`
      if (fields.counterclaim) content += `COUNTERCLAIM:\n${fields.counterclaim}\n\n`
      break

    case 'motion-on-notice':
    case 'motion-ex-parte':
      content += `${fields.applicant?.toUpperCase() ?? '...'} ... APPLICANT\n`
      content += `VS.\n`
      content += `${fields.respondent?.toUpperCase() ?? '...'} ... RESPONDENT\n\n`
      content += `${'='.repeat(50)}\n`
      content += `${templateId === 'motion-ex-parte' ? 'MOTION EX PARTE' : 'MOTION ON NOTICE'}\n`
      content += `${'='.repeat(50)}\n\n`
      if (templateId === 'motion-ex-parte' && fields.urgency) {
        content += `REASON FOR URGENCY:\n${fields.urgency}\n\n`
      }
      content += `GROUNDS:\n${fields.grounds ?? '...'}\n\n`
      content += `ORDERS SOUGHT:\n${fields.orders_sought ?? '...'}\n\n`
      break

    case 'affidavit':
      content += `${'='.repeat(50)}\n`
      content += `AFFIDAVIT\n`
      content += `${'='.repeat(50)}\n\n`
      content += `I, ${fields.deponent ?? '...'}`
      if (fields.occupation) content += `, ${fields.occupation}`
      if (fields.address) content += `, of ${fields.address}`
      content += `, make oath and say as follows:\n\n`
      content += `${fields.facts ?? '...'}\n\n`
      content += `SWORN at .................. this ......... day of .................., ${new Date().getFullYear()}\n\n`
      content += `BEFORE ME:\n\n`
      content += `.....................................\nCOMMISSIONER FOR OATHS\n\n`
      content += `.....................................\nDEPONENT\n`
      break

    case 'notice-of-appeal':
      content += `${fields.appellant?.toUpperCase() ?? '...'} ... APPELLANT\n`
      content += `VS.\n`
      content += `${fields.respondent?.toUpperCase() ?? '...'} ... RESPONDENT\n\n`
      content += `${'='.repeat(50)}\n`
      content += `NOTICE OF APPEAL\n`
      content += `${'='.repeat(50)}\n\n`
      content += `TAKE NOTICE that the Appellant, being dissatisfied with the decision of `
      if (fields.judge) content += `${fields.judge} `
      content += `delivered on ${fields.decision_date ?? '...'}, hereby appeals to this Honourable Court on the following grounds:\n\n`
      content += `${fields.grounds ?? '...'}\n\n`
      break

    default:
      content += `${'='.repeat(50)}\n`
      content += `${template.name.toUpperCase()}\n`
      content += `${'='.repeat(50)}\n\n`
      for (const field of template.fields) {
        if (fields[field.key]) {
          content += `${field.label.toUpperCase()}:\n${fields[field.key]}\n\n`
        }
      }
      break
  }

  // Footer
  content += `\nDated this ${today}\n\n`
  content += `.....................................\n`
  content += `Counsel for ${templateId.includes('defence') ? 'Defendant' : 'Plaintiff/Applicant'}\n`

  return content
}

export function generateDocumentHTML(
  templateId: string,
  court: string,
  suitNumber: string,
  _title: string,
  fields: Record<string, string>,
): string {
  const template = DOCUMENT_TEMPLATES.find((t) => t.id === templateId)
  if (!template) return ''

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const h = (text: string) => `<div style="text-align:center;font-weight:bold;font-size:16pt;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">${text}</div>`
  const sub = (text: string) => `<div style="text-align:center;font-size:11pt;color:#666;margin-bottom:16px;">${text}</div>`
  const suitLine = (num: string) => num ? `<div style="text-align:right;font-size:11pt;color:#444;margin-bottom:12px;">SUIT NO: ${num}</div>` : ''
  const party = (name: string, role: string) => `<div style="text-align:center;font-weight:bold;font-size:13pt;">${name.toUpperCase()}</div><div style="text-align:center;font-size:10pt;color:#888;letter-spacing:1px;margin-bottom:2px;">... ${role.toUpperCase()}</div>`
  const vs = () => `<div style="text-align:center;font-weight:bold;font-size:11pt;color:#666;margin:6px 0;">VS.</div>`
  const titleBar = (text: string) => `<div style="text-align:center;font-weight:bold;font-size:14pt;text-transform:uppercase;letter-spacing:2px;border-top:2px solid #C9972B;border-bottom:2px solid #C9972B;padding:10px 0;margin:16px 0;color:#0D1B2A;">${text}</div>`
  const section = (label: string) => `<div style="font-weight:bold;font-size:12pt;text-transform:uppercase;margin:16px 0 8px;color:#0D1B2A;">${label}</div>`
  const para = (text: string) => `<div style="font-size:13pt;line-height:2;margin-bottom:10px;text-align:justify;">${text}</div>`
  const sigBlock = (role: string) => `<div style="margin-top:40px;font-size:12pt;"><div>Dated this ${today}</div><div style="margin-top:30px;width:250px;border-bottom:1px solid #333;"></div><div style="margin-top:4px;font-weight:bold;">Counsel for ${role}</div></div>`

  let html = ''

  // Court header
  html += `<div style="text-align:center;margin-bottom:8px;"><div style="width:50px;height:50px;border-radius:50%;background:rgba(201,151,43,0.1);border:2px solid rgba(201,151,43,0.3);margin:0 auto 8px;display:flex;align-items:center;justify-content:center;font-size:20pt;color:#C9972B;">&#9878;</div></div>`
  html += h(`IN THE ${court.toUpperCase()}`)
  html += sub('REPUBLIC OF GHANA')
  html += suitLine(suitNumber)

  switch (templateId) {
    case 'writ-of-summons':
      html += party(fields.plaintiff ?? '...', 'Plaintiff')
      html += vs()
      html += party(fields.defendant ?? '...', 'Defendant')
      html += titleBar('WRIT OF SUMMONS')
      html += para(`TO: <strong>${fields.defendant ?? '...'}</strong>`)
      html += para('You are hereby commanded to cause an appearance to be entered for you within eight (8) days after service of this Writ on you, inclusive of the day of service.')
      html += para(`The Plaintiff's claim against you is for:`)
      html += para(fields.claim ?? '...')
      html += section('Reliefs Sought')
      html += para(fields.reliefs ?? '...')
      html += sigBlock('Plaintiff')
      break

    case 'statement-of-claim':
      html += party(fields.plaintiff ?? '...', 'Plaintiff')
      html += vs()
      html += party(fields.defendant ?? '...', 'Defendant')
      html += titleBar('STATEMENT OF CLAIM')
      html += para('The Plaintiff says as follows:')
      html += section('Facts')
      html += para(fields.facts ?? '...')
      if (fields.legal_basis) { html += section('Legal Basis'); html += para(fields.legal_basis) }
      html += section('Reliefs')
      html += para(fields.reliefs ?? '...')
      html += sigBlock('Plaintiff')
      break

    case 'statement-of-defence':
      html += party(fields.plaintiff ?? '...', 'Plaintiff')
      html += vs()
      html += party(fields.defendant ?? '...', 'Defendant')
      html += titleBar('STATEMENT OF DEFENCE')
      html += para('The Defendant says as follows in answer to the Statement of Claim:')
      html += para(fields.defence ?? '...')
      if (fields.counterclaim) { html += section('Counterclaim'); html += para(fields.counterclaim) }
      html += sigBlock('Defendant')
      break

    case 'motion-on-notice':
    case 'motion-ex-parte': {
      const isExParte = templateId === 'motion-ex-parte'
      html += party(fields.applicant ?? '...', 'Applicant')
      html += vs()
      html += party(fields.respondent ?? '...', 'Respondent')
      html += titleBar(isExParte ? 'MOTION EX PARTE' : 'MOTION ON NOTICE')
      if (isExParte && fields.urgency) { html += section('Reason for Urgency'); html += para(fields.urgency) }
      html += section('Grounds')
      html += para(fields.grounds ?? '...')
      html += section('Orders Sought')
      html += para(fields.orders_sought ?? '...')
      html += sigBlock('Applicant')
      break
    }

    case 'affidavit':
      html += titleBar('AFFIDAVIT')
      html += para(`I, <strong>${fields.deponent ?? '...'}</strong>${fields.occupation ? `, ${fields.occupation}` : ''}${fields.address ? `, of ${fields.address}` : ''}, make oath and say as follows:`)
      html += para(fields.facts ?? '...')
      html += para(`SWORN at .................. this ......... day of .................., ${new Date().getFullYear()}`)
      html += `<div style="margin-top:30px;"><div>BEFORE ME:</div><div style="margin-top:20px;width:250px;border-bottom:1px solid #333;"></div><div style="margin-top:4px;">COMMISSIONER FOR OATHS</div></div>`
      html += `<div style="margin-top:30px;"><div style="width:250px;border-bottom:1px solid #333;"></div><div style="margin-top:4px;">DEPONENT</div></div>`
      break

    case 'notice-of-appeal':
      html += party(fields.appellant ?? '...', 'Appellant')
      html += vs()
      html += party(fields.respondent ?? '...', 'Respondent')
      html += titleBar('NOTICE OF APPEAL')
      html += para(`TAKE NOTICE that the Appellant, being dissatisfied with the decision of ${fields.judge ?? '...'} delivered on ${fields.decision_date ?? '...'}, hereby appeals to this Honourable Court on the following grounds:`)
      html += para(fields.grounds ?? '...')
      html += sigBlock('Appellant')
      break

    default:
      html += titleBar(template.name.toUpperCase())
      for (const field of template.fields) {
        if (fields[field.key]) {
          html += section(field.label)
          html += para(fields[field.key])
        }
      }
      html += sigBlock('Plaintiff/Applicant')
      break
  }

  return html
}
