import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  overwrite: true,
  ignoreNoDocuments: true,
  schema: '../legalite-backend/src/schema.gql',
  documents: ['lib/graphql/**/*.ts', '!lib/graphql/generated/**'],
  generates: {
    'types/generated/graphql.ts': {
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
