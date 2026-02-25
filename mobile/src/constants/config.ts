export const QUERY_CONFIG = {
  /** How long data is considered "fresh" (no refetch) */
  staleTime: 5 * 60 * 1000, // 5 minutes

  /** How long data stays in cache after all components unmount */
  gcTime: 30 * 60 * 1000, // 30 minutes

  /** For critical data (student results, invoices), use longer cache */
  criticalStaleTime: 15 * 60 * 1000, // 15 minutes
  criticalGcTime: 60 * 60 * 1000, // 1 hour
} as const;

export const PAGINATION = {
  defaultLimit: 20,
} as const;

export const TIMEOUTS = {
  api: 15000,
  pollInterval: 30 * 1000, // 30s notifications poll
} as const;
