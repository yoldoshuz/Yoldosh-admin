import { useInfiniteQuery, UseInfiniteQueryOptions } from "@tanstack/react-query";

import api from "@/lib/api";

// ============================================================
// Hook factories — used to dedupe boilerplate across feature
// hook files. Existing hooks are NOT migrated automatically;
// new ones should pick this up.
// ============================================================

/**
 * Strip undefined / null / empty-string values from a params object.
 * Common across both adminHooks and superAdminHooks.
 */
export const stripEmpty = <T extends Record<string, any>>(params: T): Partial<T> => {
  const out: Partial<T> = {};
  for (const k of Object.keys(params) as (keyof T)[]) {
    const v = params[k];
    if (v !== undefined && v !== null && v !== "") {
      out[k] = v;
    }
  }
  return out;
};

type PageWithCursor = { currentPage: number; totalPages: number };

/**
 * Standard paginated infinite-query factory used by most list endpoints.
 *
 * The backend convention used here is:
 *   - request: `{ ...filters, page, limit }`
 *   - response: `{ data: { rows | items | <named>: [], currentPage, totalPages, total } }`
 *     (the response shape is up to caller's `getItems` to extract)
 *
 * Note: the existing per-page hooks already inline this pattern. This factory
 * is intended for new feature hooks — it does NOT auto-migrate old code.
 */
export function createPaginatedQuery<TFilters extends Record<string, any>, TPage>(config: {
  url: string;
  queryKey: (filters: TFilters) => readonly unknown[];
  defaultLimit?: number;
  /** Extra react-query options (staleTime, refetchInterval, etc.). */
  queryOptions?: Omit<
    UseInfiniteQueryOptions<TPage & PageWithCursor, Error, any, any, number>,
    "queryKey" | "queryFn" | "getNextPageParam" | "initialPageParam"
  >;
}) {
  const { url, queryKey, defaultLimit = 20, queryOptions } = config;

  return (filters: TFilters = {} as TFilters) =>
    useInfiniteQuery<TPage & PageWithCursor, Error, any, any, number>({
      queryKey: queryKey(filters) as any,
      queryFn: async ({ pageParam = 1 }) => {
        const { data } = await api.get(url, {
          params: { ...stripEmpty(filters), page: pageParam, limit: (filters as any).limit ?? defaultLimit },
        });
        return data.data as TPage & PageWithCursor;
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage) =>
        lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined,
      ...(queryOptions as any),
    });
}
