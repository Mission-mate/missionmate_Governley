import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Reusable paginated entity list hook.
 *
 * Centralises query keys + entity calls so modules don't rewrite
 * useQuery/base44.entities.X.list() everywhere. Supports server-side
 * pagination via skip/limit using the SDK's filter() offset.
 *
 * When `search` is provided, it runs a backend search across the WHOLE
 * dataset (not just the current page) using the entity's filter() with a
 * case-insensitive contains query on the given searchFields.
 *
 * @param {string} entityName - e.g. 'Contact'
 * @param {object} opts
 *   - page (1-based), pageSize, sort, filter (object), enabled
 *   - search (string), searchFields (string[])
 */
export function useEntityList(entityName, opts = {}) {
  const {
    page = 1,
    pageSize = 25,
    sort = '-created_date',
    filter = null,
    enabled = true,
    search = '',
    searchFields = [],
  } = opts;

  const trimmedSearch = search.trim();
  const isSearching = trimmedSearch.length > 0 && searchFields.length > 0;

  const skip = (page - 1) * pageSize;
  // Fetch one extra record to detect whether a next page exists.
  const limit = pageSize + 1;

  const query = useQuery({
    queryKey: [entityName, { page, pageSize, sort, filter, search: trimmedSearch, searchFields }],
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const entity = base44.entities[entityName];

      if (isSearching) {
        // Server-side search across the full dataset, then paginate the result set.
        const queryFilter = {
          ...(filter || {}),
          $or: searchFields.map((field) => ({
            [field]: { $regex: trimmedSearch, $options: 'i' },
          })),
        };
        const allMatches = await entity.filter(queryFilter, sort);
        const total = allMatches.length;
        const pageRows = allMatches.slice(skip, skip + pageSize);
        return { items: pageRows, hasNextPage: skip + pageSize < total, total };
      }

      const rows = filter
        ? await entity.filter(filter, sort, limit, skip)
        : await entity.list(sort, limit, skip);
      const hasNextPage = rows.length > pageSize;
      return { items: hasNextPage ? rows.slice(0, pageSize) : rows, hasNextPage };
    },
  });

  return {
    items: query.data?.items ?? [],
    hasNextPage: query.data?.hasNextPage ?? false,
    total: query.data?.total,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    page,
    pageSize,
  };
}