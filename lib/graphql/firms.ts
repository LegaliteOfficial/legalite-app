/**
 * Firm domain — firm-level metadata (the org itself).
 *
 * Member-related operations live in `./members`. Invitations in
 * `./invitations`. Role/permission RBAC in `./roles`.
 */

import { graphql } from '@/types/generated'

export const CurrentFirmQueryDoc = graphql(/* GraphQL */ `
  query CurrentFirm {
    currentFirm {
      ...FirmFields
    }
  }
`)

export const UpdateFirmMutationDoc = graphql(/* GraphQL */ `
  mutation UpdateFirm($input: UpdateFirmInput!) {
    updateFirm(input: $input) {
      ...FirmFields
    }
  }
`)
