import { useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { contactMatches } from '@/lib/contactFilter';

/**
 * Loads the full Contact dataset once, then applies search, contact-type and
 * tag filters across EVERY record (not just the current page) and paginates
 * the filtered result locally.
 *
 * @param {object} opts
 *   - page (1-based), pageSize
 *   - search (string)
 *   - filters ({ contactTypes: string[], tags: string[] })
 */
export function useContactsData({ page = 1, pageSize = 50, search = '', filters = {} } = {}) {
  const query = useQuery({
    queryKey: ['contacts-all'],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.Contact.list('-created_date', 5000),
  });

  const all = query.data ?? [];

  const filtered = useMemo(() => {
    return all.filter((c) => contactMatches(c, { search, filters }));
  }, [all, search, filters]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const skip = (safePage - 1) * pageSize;
  const items = filtered.slice(skip, skip + pageSize);

  return {
    items,
    filtered,
    all,
    total,
    totalPages,
    page: safePage,
    pageSize,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isLoadingError: query.isLoadingError,
    refetch: query.refetch,
  };
}