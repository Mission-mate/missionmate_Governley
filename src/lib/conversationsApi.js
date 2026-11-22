/** Data access for the Conversations module. Changes and message history go through the `conversations` function. */
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { uploadDocumentFile } from '@/lib/documentStorage';

const LIST_PAGE_SIZE = 50;

async function call(action, payload) {
  const res = await base44.functions.invoke('conversations', { action, ...payload });
  return res.data;
}

/** The message the server gave for a failed request, or a generic one. */
export const apiErrorMessage = (err) => err?.response?.data?.error || 'Something went wrong. Please try again.';

export const fetchDirectory = async () => (await call('directory')).people;

/** One page of the user's conversations, latest activity first, leaving out direct conversations they deleted. */
export const fetchConversations = (meId, cursor) => base44.entities.Conversation.filter(
  { member_ids: meId, hidden_by: { $nin: [meId] } },
  { sort: '-last_message_at', limit: LIST_PAGE_SIZE, ...(cursor ? { cursor } : {}) },
);

/** One page of messages, newest first; `before` is the sent_at of the oldest loaded message. */
export const fetchMessages = (conversationId, before) => call('messages', { conversation_id: conversationId, before });

export const startDirect = async (userId) => (await call('start_direct', { user_id: userId })).conversation;

export const createGroup = async (name, memberIds, color) =>
  (await call('create_group', { name, member_ids: memberIds, color })).conversation;

export const updateGroup = async (conversationId, { name, color }) =>
  (await call('update_group', { conversation_id: conversationId, name, color })).conversation;

/** Deletes a group for every member, or removes a direct conversation from the caller's list only. */
export const deleteConversation = (conversationId) => call('delete', { conversation_id: conversationId });

export const addMembers = async (conversationId, memberIds) =>
  (await call('add_members', { conversation_id: conversationId, member_ids: memberIds })).conversation;

/** Makes a member a group admin (`admin` true) or a regular member again. Resolves to the updated conversation. */
export const setGroupAdmin = async (conversationId, userId, admin) =>
  (await call('set_admin', { conversation_id: conversationId, user_id: userId, admin })).conversation;

/** Resolves to the updated conversation, or null once its last member has left. */
export const removeMember = async (conversationId, userId) =>
  (await call('remove_member', { conversation_id: conversationId, user_id: userId })).conversation;

/** Stores the optional file privately, then sends. Resolves to { message, conversation }. */
export async function sendMessage(conversationId, { text, file }) {
  let attachment;
  if (file) {
    const stored = await uploadDocumentFile(file);
    attachment = { uri: stored.file_url, name: stored.file_name, size: stored.file_size, type: stored.mime_type };
  }
  return call('send', { conversation_id: conversationId, text, attachment });
}

/** Posts a poll. Resolves to { message, conversation }. */
export const createPoll = (conversationId, poll) => call('create_poll', { conversation_id: conversationId, ...poll });

/** Each of these resolves to the poll's message as the signed-in member may now see it. */
export const votePoll = async (messageId, optionIds) => (await call('vote_poll', { message_id: messageId, option_ids: optionIds })).message;

export const closePoll = async (messageId) => (await call('close_poll', { message_id: messageId })).message;

export const fetchPoll = async (messageId) => (await call('poll', { message_id: messageId })).message;

/** Unread counts and Read receipts, keyed by conversation id: { [id]: { unread, read } }. */
export const fetchReadState = async (conversationIds) => (await call('read_state', { conversation_ids: conversationIds })).items;

/**
 * Records that the signed-in member has seen the conversation's latest message.
 * Resolves to their previous read point ('' when they had never read it), or null when nothing was unread.
 */
export const markConversationRead = async (conversationId) => (await call('mark_read', { conversation_id: conversationId })).unread_from;

/** One page of the files shared in a conversation, newest first: { items, total, total_pages }. `before` is the sent_at the page starts after. */
export const fetchFiles = (conversationId, before) => call('files', { conversation_id: conversationId, before });

/** Deletes a shared file for every member. Resolves to the updated conversation. */
export const deleteFile = async (messageId) => (await call('delete_file', { message_id: messageId })).conversation;

/** A short-lived link to a message's file. */
export const attachmentUrl = async (message) => (await call('attachment_url', { message_id: message.id })).signed_url;

/** Pinned bar entries of a conversation, newest pin first. */
export const fetchPins = async (conversationId) => (await call('pins', { conversation_id: conversationId })).items;

/** Pins or unpins a message or poll. Resolves to its pinned bar entry, or null once unpinned. */
export const setPinned = async (messageId, pinned) => (await call('pin', { message_id: messageId, pinned })).pin;

/**
 * Opens a message's file in a new tab. The tab is opened before the link is
 * requested so the browser never treats it as a blocked pop-up.
 */
export async function openAttachment(message) {
  const tab = window.open('', '_blank');
  if (!tab) {
    toast({ variant: 'destructive', title: 'Couldn’t open the file', description: 'Allow pop-ups for this site and try again.' });
    return;
  }
  tab.opener = null;
  try {
    tab.location.href = await attachmentUrl(message);
  } catch (err) {
    tab.close();
    toast({ variant: 'destructive', title: 'Couldn’t open the file', description: apiErrorMessage(err) });
  }
}

/**
 * Downloads a message's file under its original name. If the browser cannot
 * read the file directly, the signed link is handed to a new tab instead.
 */
export async function downloadAttachment(message) {
  let url;
  try {
    url = await attachmentUrl(message);
  } catch (err) {
    toast({ variant: 'destructive', title: 'Couldn’t download the file', description: apiErrorMessage(err) });
    return;
  }
  const link = document.createElement('a');
  link.rel = 'noopener';
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Download failed');
    const objectUrl = URL.createObjectURL(await res.blob());
    link.href = objectUrl;
    link.download = message.attachment_name || 'file';
    link.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
  } catch {
    link.href = url;
    link.target = '_blank';
    link.click();
  }
}