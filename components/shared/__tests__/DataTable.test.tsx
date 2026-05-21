import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { DataTable, type Column } from '../DataTable'

afterEach(cleanup)
interface TestRow {
  id: string
  name: string
  email: string
}

const columns: Column<TestRow>[] = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
]

const sampleData: TestRow[] = [
  { id: '1', name: 'Kwame Asante', email: 'kwame@example.com' },
  { id: '2', name: 'Ama Mensah', email: 'ama@example.com' },
]

describe('DataTable', () => {
  it('renders table headers from columns config', () => {
    render(<DataTable columns={columns} data={sampleData} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('renders data rows', () => {
    render(<DataTable columns={columns} data={sampleData} />)
    expect(screen.getByText('Kwame Asante')).toBeInTheDocument()
    expect(screen.getByText('kwame@example.com')).toBeInTheDocument()
    expect(screen.getByText('Ama Mensah')).toBeInTheDocument()
    expect(screen.getByText('ama@example.com')).toBeInTheDocument()
  })

  it('shows default empty message when data is empty', () => {
    render(<DataTable columns={columns} data={[]} />)
    expect(screen.getByText('No data yet.')).toBeInTheDocument()
  })

  it('shows custom empty message when provided', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="No clients found." />)
    expect(screen.getByText('No clients found.')).toBeInTheDocument()
  })

  it('does not render a table element when data is empty', () => {
    const { container } = render(<DataTable columns={columns} data={[]} />)
    expect(container.querySelector('table')).toBeNull()
  })

  it('renders custom render functions for columns', () => {
    const columnsWithRender: Column<TestRow>[] = [
      { key: 'name', header: 'Name', render: (row) => <strong data-testid="bold-name">{row.name}</strong> },
      { key: 'email', header: 'Email' },
    ]

    render(<DataTable columns={columnsWithRender} data={sampleData} />)

    const boldNames = screen.getAllByTestId('bold-name')
    expect(boldNames).toHaveLength(2)
    expect(boldNames[0].textContent).toBe('Kwame Asante')
    expect(boldNames[0].tagName).toBe('STRONG')
  })

  it('displays dash for missing field values', () => {
    const dataWithMissing: TestRow[] = [
      { id: '3', name: 'Test User', email: '' },
    ]
    const colsWithExtra: Column<TestRow & { phone?: string }>[] = [
      { key: 'name', header: 'Name' },
      { key: 'phone', header: 'Phone' },
    ]

    render(<DataTable columns={colsWithExtra} data={dataWithMissing as (TestRow & { phone?: string })[]} />)
    expect(screen.getByText('-')).toBeInTheDocument()
  })
})
