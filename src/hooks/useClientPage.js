import { useEffect, useState } from 'react';

export const CARD_PAGE_SIZE = 20;

/** Slices an already-filtered list into fixed pages; resets on resetKey, clamps when the list shrinks. */
export default function useClientPage(items, resetKey) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / CARD_PAGE_SIZE));

  useEffect(() => { setPage(1); }, [resetKey]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const current = Math.min(page, totalPages);
  const pageItems = items.slice((current - 1) * CARD_PAGE_SIZE, current * CARD_PAGE_SIZE);
  const pagination = items.length > CARD_PAGE_SIZE ? {
    page: current, totalPages, total: items.length, pageSize: CARD_PAGE_SIZE,
    onPageChange: setPage, onPageSizeChange: () => {}, pageSizeOptions: [CARD_PAGE_SIZE],
  } : null;
  return { pageItems, pagination };
}