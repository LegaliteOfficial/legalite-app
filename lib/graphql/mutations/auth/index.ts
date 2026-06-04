import { graphql } from "@/types/generated";

export const LoginMutationDoc = graphql(/* GraphQL */ `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        email
        name
        role
        first_name
        last_name
        gba_number
        supreme_court_enrollment_no
        practising_license_no
        digital_address
        verification_status
        created_at
      }
      active_membership {
        firm_id
        firm_name
        firm_slug
        firm_role
        professional_title
        status
      }
      memberships {
        firm_id
        firm_name
        firm_slug
        firm_role
        professional_title
        status
      }
    }
  }
`)

export const RegisterOwnerMutationDoc = graphql(/* GraphQL */ `
  mutation RegisterOwner($input: RegisterOwnerInput!) {
    registerOwner(input: $input) {
      token
      user {
        id
        email
        name
        role
        first_name
        last_name
        gba_number
        supreme_court_enrollment_no
        practising_license_no
        digital_address
        verification_status
        created_at
      }
      active_membership {
        firm_id
        firm_name
        firm_slug
        firm_role
        professional_title
        status
      }
      memberships {
        firm_id
        firm_name
        firm_slug
        firm_role
        professional_title
        status
      }
    }
  }
`)