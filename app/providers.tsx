'use client'

import { ApolloProvider } from '@apollo/client/react'
import { Toaster } from 'sonner'
import { useState } from 'react'
import { getApolloClient } from '@/lib/apollo'

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => getApolloClient())

  return (
    <ApolloProvider client={client}>
      {children}
      <Toaster position="top-right" richColors />
    </ApolloProvider>
  )
}
