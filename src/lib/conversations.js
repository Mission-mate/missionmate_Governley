/** Display helpers for the Conversations module. */
import { format, isToday, isYesterday, isThisYear } from 'date-fns';

/** `people` is a Map of user id → { id, name, avatar_url }. */
export const personName = (people, id) => people.get(id)?.name || 'Former team member';

export const firstName = (people, id) => personName(people, id).split(' ')[0];

/** The other participant of a direct conversation. */
export const otherMemberId = (conversation, meId) =>
  conversation.member_ids.find((id) => id !== meId) || meId;

/** Whether the user manages the group (rename, recolour, members, admins, delete). */
export const isGroupAdmin = (conversation, id) => !!conversation.admin_ids?.includes(id);

export function conversationTitle(conversation, meId, people) {
  if (conversation.type === 'group') return conversation.name || 'Group';
  return personName(people, otherMemberId(conversation, meId));
}

/** One-line preview of the latest message for the conversation list. */
export function conversationPreview(conversation, meId, people) {
  if (!conversation.last_message_text) {
    return conversation.type === 'group' ? 'Group created' : 'No messages yet';
  }
  const sender = conversation.last_message_sender_id;
  if (sender === meId) return `You: ${conversation.last_message_text}`;
  if (conversation.type === 'group') return `${firstName(people, sender)}: ${conversation.last_message_text}`;
  return conversation.last_message_text;
}

/** One-line preview of a pinned bar entry. */
export function pinPreview(pin) {
  if (pin.poll_question) return pin.poll_question;
  if (pin.text) return pin.text;
  return pin.attachment_name ? `📎 ${pin.attachment_name}` : 'Message';
}

/** Compact time for the conversation list: time today, then Yesterday, then a date. */
export function listTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, isThisYear(d) ? 'd MMM' : 'd MMM yyyy');
}

/** Day separator label inside a thread. */
export function dayLabel(iso) {
  const d = new Date(iso);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, isThisYear(d) ? 'EEEE, d MMMM' : 'd MMMM yyyy');
}

export const dayKey = (iso) => format(new Date(iso), 'yyyy-MM-dd');

export const messageTime = (iso) => format(new Date(iso), 'h:mm a');

// Only messages that have just arrived animate in; loaded history renders in place.
const FRESH_MS = 4000;
export const isFresh = (iso) => Date.now() - new Date(iso).getTime() < FRESH_MS;

export function fileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}