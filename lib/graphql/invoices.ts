/**
 * Invoices — billable amounts owed by clients. Status/payment lifecycle
 * is handled server-side.
 */

import { graphql } from '@/types/generated'

export const InvoicesQueryDoc = graphql(/* GraphQL */ `
  query Invoices {
    invoices {
      ...InvoiceFields
    }
  }
`)

export const InvoiceQueryDoc = graphql(/* GraphQL */ `
  query Invoice($id: ID!) {
    invoice(id: $id) {
      ...InvoiceFields
    }
  }
`)

export const CreateInvoiceMutationDoc = graphql(/* GraphQL */ `
  mutation CreateInvoice($input: CreateInvoiceInput!) {
    createInvoice(input: $input) {
      ...InvoiceFields
    }
  }
`)

export const UpdateInvoiceMutationDoc = graphql(/* GraphQL */ `
  mutation UpdateInvoice($id: ID!, $input: UpdateInvoiceInput!) {
    updateInvoice(id: $id, input: $input) {
      ...InvoiceFields
    }
  }
`)

export const DeleteInvoiceMutationDoc = graphql(/* GraphQL */ `
  mutation DeleteInvoice($id: ID!) {
    deleteInvoice(id: $id)
  }
`)
