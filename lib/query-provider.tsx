'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // Data dianggap fresh selama 1 menit
            gcTime: 5 * 60 * 1000, // Cache disimpan 5 menit (sebelumnya cacheTime)
            refetchOnWindowFocus: false, // Tidak auto-refetch saat window focus
            retry: 1, // Retry 1x jika gagal
          },
        },
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
