'use client';

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

// Global fetcher function
const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    const error = new Error('An error occurred while fetching the data.') as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return response.json();
};

// Global SWR configuration
const swrConfig = {
  fetcher,
  // Revalidate on focus (when user returns to tab)
  revalidateOnFocus: true,
  // Revalidate on reconnect (when network is restored)
  revalidateOnReconnect: true,
  // Dedupe requests within this time window (prevents duplicate requests)
  dedupingInterval: 30000,
  // Keep previous data while revalidating
  keepPreviousData: true,
  // Don't revalidate on mount if data is fresh
  revalidateIfStale: true,
  // Error retry configuration
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  // Focus throttle - don't revalidate more than once every 5 seconds on focus
  focusThrottleInterval: 30000,
};

interface SWRProviderProps {
  children: ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  );
}
