import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { fetchDirectory, fetchConversations, fetchMessages, fetchPoll, fetchPins, fetchFiles, fetchReadState } from '@/lib/conversationsApi';

const NO_ITEMS = [];
const byRecent = (a, b) => (b.last_message_at || '').localeCompare(a.last_message_at || '');
const bySent = (a, b) => a.sent_at.localeCompare(b.sent_at);
const oldestFirst = (page) => [...page.items].reverse();

/** Everyone who can appear in a conversation, as a Map of user id → { id, name, avatar_url, selectable }. */
export function useDirectory() {
  const query = useQuery({ queryKey: ['conversation-directory'], queryFn: fetchDirectory, staleTime: 5 * 60 * 1000 });
  const people = useMemo(() => new Map((query.data || []).map((p) => [p.id, p])), [query.data]);
  return { people, query };
}

/** The signed-in user's conversations, latest activity first. `put` / `remove` keep the list current. */
export function useConversationList(meId) {
  const qc = useQueryClient();
  const [loadingMore, setLoadingMore] = useState(false);
  const key = useMemo(() => ['conversations', meId], [meId]);

  const query = useQuery({
    queryKey: key,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const page = await fetchConversations(meId);
      return { items: page.items, cursor: page.next_cursor, hasMore: page.has_more };
    },
  });

  const remove = useCallback((id) => {
    qc.setQueryData(key, (old) => old && { ...old, items: old.items.filter((c) => c.id !== id) });
  }, [qc, key]);

  // Adds or updates a conversation; one the user no longer belongs to, or has deleted for themselves, is dropped.
  const put = useCallback((conversation) => {
    qc.setQueryData(key, (old) => {
      if (!old) return old;
      const items = old.items.filter((c) => c.id !== conversation.id);
      if (conversation.member_ids?.includes(meId) && !conversation.hidden_by?.includes(meId)) items.push(conversation);
      return { ...old, items: items.sort(byRecent) };
    });
  }, [qc, key, meId]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const page = await fetchConversations(meId, qc.getQueryData(key).cursor);
      qc.setQueryData(key, (old) => ({
        items: [...old.items, ...page.items.filter((c) => !old.items.some((x) => x.id === c.id))],
        cursor: page.next_cursor,
        hasMore: page.has_more,
      }));
    } finally {
      setLoadingMore(false);
    }
  };

  return {
    conversations: query.data?.items || NO_ITEMS,
    isLoading: query.isLoading,
    failure: query.isLoadingError ? query : null,
    hasMore: !!query.data?.hasMore,
    loadMore,
    loadingMore,
    put,
    remove,
  };
}

/** Unread counts and Read receipts for the loaded conversations, keyed by id. `sync()` reloads them. */
export function useReadState(meId, conversations) {
  const ids = useMemo(() => conversations.map((c) => c.id).sort(), [conversations]);
  const query = useQuery({
    queryKey: ['conversation-read-state', meId, ids.join(',')],
    enabled: ids.length > 0,
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: true,
    queryFn: () => fetchReadState(ids),
  });
  return { readState: query.data || NO_STATE, sync: query.refetch };
}
const NO_STATE = {};

/** Calls `handler(event)` for every live conversation change the user can see. */
export function useConversationEvents(handler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  useEffect(() => base44.entities.Conversation.subscribe((event) => handlerRef.current(event)), []);
}

// Joins a freshly fetched latest page onto loaded history. With no overlap (a long gap), the latest page replaces it.
function mergeLatest(loaded, page) {
  const latest = oldestFirst(page);
  const known = new Set((loaded?.items || []).map((m) => m.id));
  if (!latest.some((m) => known.has(m.id))) return { items: latest, hasMore: page.has_more };
  // Loaded messages take their latest version, so poll votes and closures show up.
  const current = new Map(latest.map((m) => [m.id, m]));
  const items = [...loaded.items.map((m) => current.get(m.id) || m), ...latest.filter((m) => !known.has(m.id))];
  return { items: items.sort(bySent), hasMore: loaded.hasMore };
}

/** Pinned bar entries of one conversation, newest pin first. `set(messageId, pin)` applies a pin or unpin (pin = null). */
export function usePins(conversationId) {
  const qc = useQueryClient();
  const key = useMemo(() => ['conversation-pins', conversationId], [conversationId]);
  const query = useQuery({ queryKey: key, enabled: !!conversationId, queryFn: () => fetchPins(conversationId) });

  const set = useCallback((messageId, pin) => {
    qc.setQueryData(key, (old) => {
      if (!old) return old;
      const rest = old.filter((p) => p.id !== messageId);
      return pin ? [pin, ...rest] : rest;
    });
  }, [qc, key]);

  return { pins: query.data || NO_ITEMS, set, sync: query.refetch };
}

/**
 * Files shared in one conversation, newest first, one page at a time.
 * Loaded only while `enabled` (the details panel is open). `changePage(n)` moves to the next or previous page.
 */
export function useSharedFiles(conversationId, enabled) {
  // Where each opened page after the first starts; a different conversation starts again at page 1.
  const [paging, setPaging] = useState({ id: null, cursors: NO_ITEMS });
  const cursors = paging.id === conversationId ? paging.cursors : NO_ITEMS;
  const before = cursors[cursors.length - 1];
  const page = cursors.length + 1;

  const query = useQuery({
    queryKey: ['conversation-files', conversationId, before || ''],
    enabled: enabled && !!conversationId,
    staleTime: 0,
    // The current page stays on screen while the next one loads.
    placeholderData: (previous, previousQuery) => (previousQuery?.queryKey[1] === conversationId ? previous : undefined),
    queryFn: () => fetchFiles(conversationId, before),
  });
  const files = query.data?.items || NO_ITEMS;
  const settled = query.isSuccess && !query.isPlaceholderData;

  const changePage = (next) => {
    if (!settled) return;
    setPaging({ id: conversationId, cursors: next > page ? [...cursors, files[files.length - 1].sent_at] : cursors.slice(0, -1) });
  };

  // The last file on a later page was deleted: fall back to the page before it.
  const emptied = settled && files.length === 0 && page > 1;
  useEffect(() => {
    if (emptied) setPaging((p) => ({ ...p, cursors: p.cursors.slice(0, -1) }));
  }, [emptied]);

  return {
    files,
    total: query.data?.total || 0,
    page,
    totalPages: query.data?.total_pages || 1,
    changePage,
    isLoading: query.isLoading,
    failure: query.isLoadingError ? query : null,
    sync: query.refetch,
  };
}

/** Message history of one conversation, oldest first, with paging back through older messages. */
export function useThread(conversationId) {
  const qc = useQueryClient();
  const [loadingOlder, setLoadingOlder] = useState(false);
  const key = useMemo(() => ['conversation-messages', conversationId], [conversationId]);

  const query = useQuery({
    queryKey: key,
    enabled: !!conversationId,
    refetchOnWindowFocus: true,
    queryFn: async () => mergeLatest(qc.getQueryData(key), await fetchMessages(conversationId)),
  });

  const append = (message) => {
    qc.setQueryData(key, (old) => (
      old && !old.items.some((m) => m.id === message.id) ? { ...old, items: [...old.items, message] } : old
    ));
  };

  // Swaps in a newer version of a loaded message (a poll after a vote or closure).
  const replace = useCallback((message) => {
    qc.setQueryData(key, (old) => old && { ...old, items: old.items.map((m) => (m.id === message.id ? message : m)) });
  }, [qc, key]);

  // A shared file was deleted: its message keeps any text and loses the file; a file-only message goes.
  const dropFile = useCallback((messageId) => {
    qc.setQueryData(key, (old) => old && {
      ...old,
      items: old.items.flatMap((m) => {
        if (m.id !== messageId) return [m];
        return m.text ? [{ ...m, attachment_name: '', attachment_size: 0, attachment_type: '' }] : [];
      }),
    });
  }, [qc, key]);

  // Reloads one poll. If that fails, the poll catches up on the thread's next refresh.
  const refreshPoll = useCallback((messageId) => {
    fetchPoll(messageId).then(replace, () => {});
  }, [replace]);

  // Adds the page of messages just before the oldest loaded one.
  const prependOlder = async () => {
    const page = await fetchMessages(conversationId, qc.getQueryData(key).items[0].sent_at);
    qc.setQueryData(key, (old) => ({ items: [...oldestFirst(page), ...old.items], hasMore: page.has_more }));
  };

  const loadOlder = async () => {
    setLoadingOlder(true);
    try {
      await prependOlder();
    } finally {
      setLoadingOlder(false);
    }
  };

  // Pages back until `target` ({ id, sent_at }) is loaded. Resolves to whether it is in the thread.
  const loadThrough = async (target) => {
    const has = () => qc.getQueryData(key)?.items.some((m) => m.id === target.id);
    setLoadingOlder(true);
    try {
      for (let data = qc.getQueryData(key); data && !has() && data.hasMore && data.items[0].sent_at > target.sent_at; data = qc.getQueryData(key)) {
        await prependOlder();
      }
    } finally {
      setLoadingOlder(false);
    }
    return has();
  };

  return {
    messages: query.data?.items || NO_ITEMS,
    isLoading: query.isLoading,
    failure: query.isLoadingError ? query : null,
    hasMore: !!query.data?.hasMore,
    loadOlder,
    loadThrough,
    loadingOlder,
    sync: query.refetch,
    append,
    replace,
    dropFile,
    refreshPoll,
  };
}