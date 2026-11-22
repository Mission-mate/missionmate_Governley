import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { loadFailure } from '@/lib/readState';
import { base44 } from '@/api/base44Client';

/** Server-side paged, searchable, date-sortable maintenance log for one asset (newest first by default). */
export default function usePagedMaintenance(baseKey, assetId) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sort, setSort] = useState(null); // null = default '-date'
  const [search, setSearch] = useState('');
  const cursors = useRef({ 1: null });
  const term = search.trim();
  const query = { asset_id: assetId };
  if (term) query.title = { $regex: term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

  const { data: total = 0, dataUpdatedAt, isLoading: countLoading, ...countRead } = useQuery({
    queryKey: [...baseKey, 'count', term],
    placeholderData: (prev) => prev,
    queryFn: () => base44.entities.AssetMaintenanceEntry.count(query),
    enabled: !!assetId,
  });

  useEffect(() => { cursors.current = { 1: null }; }, [pageSize, sort, term, dataUpdatedAt]);
  useEffect(() => { setPage(1); }, [assetId]);

  const { data: entries = [], isLoading, ...entriesRead } = useQuery({
    queryKey: [...baseKey, 'page', pageSize, sort, term, page, dataUpdatedAt],
    placeholderData: (prev) => prev,
    queryFn: async () => {
      let p = Math.max(...Object.keys(cursors.current).map(Number).filter((n) => n <= page));
      let res;
      for (;;) {
        res = await base44.entities.AssetMaintenanceEntry.filter(query, { sort: sort || '-date', limit: pageSize, cursor: cursors.current[p] || undefined });
        if (res.has_more) cursors.current[p + 1] = res.next_cursor;
        if (p === page || !res.has_more) break;
        p += 1;
      }
      return res.items;
    },
    enabled: !!assetId && !!dataUpdatedAt,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  return {
    entries, total, page, pageSize, sort, search: term, totalPages, isLoading: countLoading || isLoading,
    failure: loadFailure(countRead, entriesRead),
    setPage,
    setSearch: (s) => { cursors.current = { 1: null }; setSearch(s); setPage(1); },
    setSort: (s) => { cursors.current = { 1: null }; setSort(s); setPage(1); },
    setPageSize: (n) => { setPageSize(n); setPage(1); },
  };
}