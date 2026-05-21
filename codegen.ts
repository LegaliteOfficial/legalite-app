import type { CodegenConfig } from '@graphql-codegen/cli'

// Points at the backend's auto-generated schema.gql. The backend writes this
// file on every boot via @nestjs/graphql's `autoSchemaFile`, so a single
// `pnpm dev` of the backend is enough to refresh types here.
const config: CodegenConfig = {
  schema: '../legalite-backend/src/schema.gql',
  documents: ['lib/graphql/**/*.ts', '!lib/graphql/generated/**'],
  ignoreNoDocuments: true,
  generates: {
    'lib/graphql/generated/': {
      preset: 'client',
      presetConfig: {
        // We don't use GraphQL fragments anywhere yet — masking adds an
        // opaque wrapper around return data that confuses Apollo's
        // useQuery/useMutation type inference.
        fragmentMasking: false,
      },
      config: {
        useTypeImports: true,
      },
    },
  },
}

export default config
