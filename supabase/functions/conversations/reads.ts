/**
 * Per-member read progress. Each member has one ConversationRead record per
 * conversation whose read_at is the latest message they have seen.
 */
const MAX_READ_STATE = 100;

const rows = (page) => (Array.isArray(page) ? page : page?.items || []);

/**
 * Moves the member's read point forward to `at`. Resolves to the previous read point
 * ('' when there was none) when it moved, or null when it did not.
 * Never moves it back, so a late or repeated call is harmless.
 */
export async function markRead(svc, conversationId, userId, at) {
  if (!at) return null;
  const found = rows(await svc.ConversationRead.filter({ conversation_id: conversationId, user_id: userId }, { limit: 5 }));
  const [first, ...duplicates] = found;
  await Promise.all(duplicates.map((r) => svc.ConversationRead.delete(r.id)));
  const readAt = found.reduce((max, r) => (r.read_at > max ? r.read_at : max), '');
  if (readAt >= at) return null;
  if (first) await svc.ConversationRead.update(first.id, { read_at: at });
  else await svc.ConversationRead.create({ conversation_id: conversationId, user_id: userId, read_at: at });
  return readAt;
}

/**
 * Read state of the caller's conversations, keyed by conversation id:
 *   unread — messages from others since the caller last read the conversation
 *   read   — the latest message is the caller's and every other member has seen it
 */
export async function readState(svc, ids, userId) {
  const wanted = ids.slice(0, MAX_READ_STATE);
  if (wanted.length === 0) return {};
  const conversations = rows(await svc.Conversation.filter({ id: { $in: wanted } }, { limit: MAX_READ_STATE }))
    .filter((c) => c.member_ids?.includes(userId));
  if (conversations.length === 0) return {};
  const records = rows(await svc.ConversationRead.filter(
    { conversation_id: { $in: conversations.map((c) => c.id) } },
    { limit: 5000 },
  ));
  // conversation id → user id → latest read_at
  const reads = new Map();
  for (const r of records) {
    const byUser = reads.get(r.conversation_id) || new Map();
    if ((byUser.get(r.user_id) || '') < r.read_at) byUser.set(r.user_id, r.read_at);
    reads.set(r.conversation_id, byUser);
  }
  const entries = await Promise.all(conversations.map(async (c) => {
    const byUser = reads.get(c.id) || new Map();
    const lastAt = c.last_message_at || '';
    const mine = byUser.get(userId) || '';
    const unread = c.last_message_text && lastAt > mine
      ? await svc.ConversationMessage.count({ conversation_id: c.id, sender_id: { $ne: userId }, sent_at: { $gt: mine } })
      : 0;
    const others = c.member_ids.filter((id) => id !== userId);
    const read = !!c.last_message_text && c.last_message_sender_id === userId && others.length > 0
      && others.every((id) => (byUser.get(id) || '') >= lastAt);
    return [c.id, { unread, read }];
  }));
  return Object.fromEntries(entries);
}