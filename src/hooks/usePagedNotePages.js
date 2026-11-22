import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { loadFailure } from '@/lib/readState';
import { base44 } from '@/api/base44Client';

/**
 * Server-side paging (creation order unless a date sort is chosen) of a record's note pages.
 * Uses limit + cursor (skip is ignored by the data layer); visited page cursors
 * are cached and cleared whenever the page size or the underlying notes change.
 */
export default function usePagedNotePages(baseKey, objectType, objectId, enabled) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sort, setSort] = useState(null); // null = creation order (no explicit sort)
  const [search, setSearch] = useState('');
  const cursors = useRef({ 1: null }); // page number → cursor that loads it
  const term = search.trim();
  const query = { object_type: objectType, object_id: objectId };
  if (term) query.title = { $regex: term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

  const { data: total = 0, dataUpdatedAt, isLoading: countLoading, ...countRead } = useQuery({
    queryKey: [...baseKey, 'count', term],
    placeholderData: (prev) => prev,
    queryFn: () => base44.entities.NotePage.count(query),
    enabled: enabled && !!objectId,
  });

  // Any note change refetches the count — reset the cursor cache with it.
  useEffect(() => { cursors.current = { 1: null }; }, [pageSize, sort, term, dataUpdatedAt]);

  const { data: notes = [], isLoading, ...notesRead } = useQuery({
    queryKey: [...baseKey, 'page', pageSize, sort, term, page, dataUpdatedAt],
    placeholderData: (prev) => prev,
    queryFn: async () => {
      let p = Math.max(...Object.keys(cursors.current).map(Number).filter((n) => n <= page));
      let res;
      for (;;) {
        res = await base44.entities.NotePage.filter(query, { sort: sort || 'created_date', limit: pageSize, cursor: cursors.current[p] || undefined });
        if (res.has_more) cursors.current[p + 1] = res.next_cursor;
        if (p === page || !res.has_more) break;
        p += 1;
      }
      return res.items;
    },
    enabled: enabled && !!objectId && !!dataUpdatedAt,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  return {
    notes, total, page, pageSize, sort, search: term, totalPages, isLoading: countLoading || isLoading,
    failure: loadFailure(countRead, notesRead),
    setPage,
    setSearch: (s) => { cursors.current = { 1: null }; setSearch(s); setPage(1); },
    setSort: (s) => { cursors.current = { 1: null }; setSort(s); setPage(1); },
    setPageSize: (n) => { setPageSize(n); setPage(1); },
  };
}