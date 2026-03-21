'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sileo';
import { useState } from 'react';
import { SidebarProvider } from '@/components/layout/SidebarContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        {children}
      </SidebarProvider>
      <Toaster
        position="top-right"
        options={{
          autopilot: {
            expand: 0,
            collapse: 0,
          },
        }}
      />
    </QueryClientProvider>
  );
}
