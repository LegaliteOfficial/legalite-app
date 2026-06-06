/**
 * User profile + password management.
 *
 * The Profile type is a superset of AuthUser — it includes editable
 * fields the auth header doesn't need (avatar, full bar registrations,
 * Ghana card, etc.). We keep these inline rather than fragmented because
 * the read shape (ProfileQuery) and the post-update shape (UpdateProfile
 * return) are deliberately different.
 */

import { graphql } from '@/types/generated'

export const ProfileQueryDoc = graphql(/* GraphQL */ `
  query Profile {
    profile {
      id
      email
      name
      role
      first_name
      middle_name
      last_name
      date_of_birth
      gender
      gba_number
      supreme_court_enrollment_no
      year_called_to_bar
      practising_license_no
      practising_license_year
      ghana_card_no
      passport_no
      bio
      practice_type
      office_address
      digital_address
      city
      region
      work_email
      work_phone
      phone
      avatar_url
      verification_status
      verified_at
      created_at
      updated_at
    }
  }
`)

export const UpdateProfileMutationDoc = graphql(/* GraphQL */ `
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      email
      name
      role
      first_name
      middle_name
      last_name
      gba_number
      supreme_court_enrollment_no
      year_called_to_bar
      practising_license_no
      digital_address
      city
      region
      phone
      avatar_url
      verification_status
      updated_at
    }
  }
`)

export const ChangePasswordMutationDoc = graphql(/* GraphQL */ `
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input)
  }
`)
