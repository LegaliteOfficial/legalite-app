/**
 * Practice areas — global catalog plus the user's own selections.
 *
 * Backend exposes the catalog as `practiceAreas`; everything tied to
 * "my" profile is filtered server-side by the auth context.
 */

import { graphql } from '@/types/generated'

export const PracticeAreasQueryDoc = graphql(/* GraphQL */ `
  query PracticeAreas {
    practiceAreas {
      id
      slug
      name
      description
    }
  }
`)

export const MyPracticeAreasQueryDoc = graphql(/* GraphQL */ `
  query MyPracticeAreas {
    myPracticeAreas {
      practice_area_id
      slug
      name
      is_primary
    }
  }
`)

export const SetMyPracticeAreasMutationDoc = graphql(/* GraphQL */ `
  mutation SetMyPracticeAreas($input: SetProfilePracticeAreasInput!) {
    setMyPracticeAreas(input: $input) {
      practice_area_id
      slug
      name
      is_primary
    }
  }
`)
