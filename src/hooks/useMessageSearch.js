import { useEffect, useMemo, useState } from 'react';

const searchableText = (m) => [m.text, m.attachment_name, m.poll?.question, ...(m.poll?.options || []).map((o) => o.text)]
  .filter(Boolean).join(' ').toLowerCase();

/**
 * Live search across the loaded messages of one conversation.
 * Matches run newest first; `next` steps to an older match, `previous` to a newer one.
 */
export default function useMessageSearch(messages) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const term = query.trim().toLowerCase();

  const matches = useMemo(
    () => (term ? messages.filter((m) => searchableText(m).includes(term)).reverse() : []),
    [messages, term]
  );

  // A new term starts again from the newest match.
  useEffect(() => setIndex(0), [term]);
  // Keep the position valid when messages load or arrive.
  useEffect(() => { if (index >= matches.length && matches.length) setIndex(matches.length - 1); }, [matches.length, index]);

  const step = (delta) => matches.length && setIndex((i) => (i + delta + matches.length) % matches.length);

  return {
    open,
    query,
    term: open ? term : '',
    total: matches.length,
    position: matches.length ? index + 1 : 0,
    activeId: open ? matches[index]?.id || null : null,
    setQuery,
    next: () => step(1),
    previous: () => step(-1),
    openSearch: () => setOpen(true),
    close: () => { setOpen(false); setQuery(''); },
  };
}