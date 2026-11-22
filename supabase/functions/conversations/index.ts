/**
 * conversations — every read of message history and every change to a
 * conversation goes through here, so membership is checked on the server.
 * Body: { action, ...params }
 *   directory                                   → { people }
 *   start_direct   { user_id }                  → { conversation }
 *   create_group   { name, member_ids, color? } → { conversation }
 *   update_group   { conversation_id, name, color } → { conversation }          group admins only
 *   delete         { conversation_id }          → { ok } groups (admins only): removes it and its history for every member;
 *                                                  direct: hides it from the caller's list only (removed once both members hid it)
 *   add_members    { conversation_id, member_ids } → { conversation }          group admins only
 *   remove_member  { conversation_id, user_id } → { conversation } (null once the last member leaves); admins remove others, anyone may leave
 *   set_admin      { conversation_id, user_id, admin } → { conversation }      group admins only; a group always keeps one admin
 *   send           { conversation_id, text, attachment? } → { message, conversation }
 *   messages       { conversation_id, before? } → { items (newest first), has_more }
 *   attachment_url { message_id }               → { signed_url }
 *   files          { conversation_id, before? } → { items (newest first), total, total_pages } one page of messages that carry a file
 *   delete_file    { message_id }               → { conversation } the file's sender or a group admin; removes the file for every member
 *                                                  (text stays; a file-only message goes with it)
 *   create_poll    { conversation_id, question, options, multiple, allow_change, results, closes_at? } → { message, conversation }
 *   vote_poll      { message_id, option_ids }   → { message }
 *   close_poll     { message_id }               → { message } (the poll's creator only)
 *   poll           { message_id }               → { message }
 *   pin            { message_id, pinned }       → { pin } (null once unpinned); any member may pin or unpin
 *   pins           { conversation_id }          → { items } (newest pin first)
 *   read_state     { conversation_ids }         → { items: { [id]: { unread, read } } }
 *   mark_read      { conversation_id }          → { ok, unread_from } caller has seen the latest message; unread_from is their previous read point, null when nothing was unread
 * Sending a message or poll also marks the conversation read for the sender.
 * A poll message carries `poll`, shaped for the caller by publicPoll.
 */
import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { buildPoll, pollClosedAt, loadPollVotes, publicPoll } from './polls.ts';
import { markRead, readState } from './reads.ts';

const PAGE_SIZE = 30;
const MAX_TEXT = 4000;
const MAX_NAME = 80;
const PREVIEW_LENGTH = 140;
const MAX_PINS = 20;
const FILES_PAGE_SIZE = 10;
// Group tile colours — the folder / note palette keys.
const GROUP_COLORS = ['orange', 'yellow', 'green', 'teal', 'lavender'];
const DEFAULT_GROUP_COLOR = 'teal';

const fail = (status, error) => Response.json({ error }, { status });
const rows = (page) => (Array.isArray(page) ? page : page?.items || []);
const str = (v) => (typeof v === 'string' ? v.trim() : '');
const idList = (v) => (Array.isArray(v) ? [...new Set(v.filter((x) => typeof x === 'string' && x))] : []);
const displayName = (u) => `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.full_name || u.email || '';
// Mirrors Team Management: the platform owner is not a team member, and suspended members cannot be messaged.
const isTeamMember = (u) => u.role !== 'owner' && u.status !== 'suspended' && u.status !== 'pending';
// The stored file location never leaves the server; files open through attachment_url.
const publicMessage = (m) => ({
  id: m.id,
  conversation_id: m.conversation_id,
  sender_id: m.sender_id,
  text: m.text || '',
  sent_at: m.sent_at,
  attachment_name: m.attachment_name || '',
  attachment_size: m.attachment_size || 0,
  attachment_type: m.attachment_type || '',
});
// A pinned bar entry: enough to preview the item and jump to it.
const publicPin = (m) => ({
  id: m.id,
  sender_id: m.sender_id,
  sent_at: m.sent_at,
  pinned_at: m.pinned_at,
  pinned_by: m.pinned_by,
  text: (m.text || '').slice(0, PREVIEW_LENGTH),
  attachment_name: m.attachment_name || '',
  poll_question: m.poll?.question || '',
});

export default async function handler(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return fail(401, 'Please sign in again.');

    const body = await req.json().catch(() => ({}));
    const action = str(body?.action);
    const svc = base44.asServiceRole.entities;
    const missing = (e) => (e.status === 404 ? null : Promise.reject(e));

    // A conversation the caller is a member of, or null.
    const memberConversation = async (id) => {
      if (!id) return null;
      const conversation = await svc.Conversation.get(id).catch(missing);
      return conversation?.member_ids?.includes(user.id) ? conversation : null;
    };
    const memberGroup = async () => {
      const conversation = await memberConversation(str(body.conversation_id));
      return conversation?.type === 'group' ? conversation : null;
    };
    const isGroupAdmin = (group) => (group.admin_ids || []).includes(user.id);
    const ADMIN_ONLY = 'Only group admins can do this.';
    const teamMemberIds = async (ids) => {
      if (ids.length === 0) return [];
      const users = rows(await svc.User.list());
      return users.filter((u) => ids.includes(u.id) && isTeamMember(u)).map((u) => u.id);
    };
    const NOT_FOUND = 'This conversation is no longer available.';
    // Removes a conversation and everything stored under it, children first.
    const purge = async (id) => {
      while ((await svc.ConversationPollVote.deleteMany({ conversation_id: id }))?.deleted > 0) { /* next batch */ }
      while ((await svc.ConversationMessage.deleteMany({ conversation_id: id }))?.deleted > 0) { /* next batch */ }
      while ((await svc.ConversationRead.deleteMany({ conversation_id: id }))?.deleted > 0) { /* next batch */ }
      await svc.Conversation.delete(id);
    };
    // Messages as the caller may see them, with each poll's votes applied.
    const withPolls = async (messages) => {
      const pollIds = messages.filter((m) => m.poll).map((m) => m.id);
      const votes = pollIds.length > 0 ? await loadPollVotes(svc, pollIds) : new Map();
      return messages.map((m) => (m.poll ? { ...publicMessage(m), poll: publicPoll(m.poll, votes.get(m.id), user.id) } : publicMessage(m)));
    };
    // A poll message in a conversation the caller is a member of, or null.
    const memberPoll = async () => {
      const messageId = str(body.message_id);
      const message = messageId ? await svc.ConversationMessage.get(messageId).catch(missing) : null;
      return message?.poll && (await memberConversation(message.conversation_id)) ? message : null;
    };
    const POLL_NOT_FOUND = 'This poll is no longer available.';
    // Saves a poll change, tells members' open threads to refresh, and returns the poll as the caller sees it.
    const pollChanged = async (message) => {
      await svc.Conversation.update(message.conversation_id, { poll_activity_at: new Date().toISOString() });
      return Response.json({ message: (await withPolls([message]))[0] });
    };

    if (action === 'directory') {
      const users = rows(await svc.User.list());
      return Response.json({
        people: users.map((u) => ({
          id: u.id,
          name: displayName(u),
          first_name: u.first_name || '',
          last_name: u.last_name || '',
          email: u.email || '',
          role: u.role || '',
          avatar_url: u.avatar_url || '',
          selectable: isTeamMember(u),
        })),
      });
    }

    if (action === 'start_direct') {
      const otherId = str(body.user_id);
      if (!otherId || otherId === user.id) return fail(400, 'Choose a team member to message.');
      if ((await teamMemberIds([otherId])).length === 0) return fail(400, 'This person is no longer a team member.');
      const directKey = [user.id, otherId].sort().join(':');
      const existing = rows(await svc.Conversation.filter({ direct_key: directKey }))[0];
      if (existing) {
        // Starting a conversation the caller had deleted brings it back to their list.
        const hidden = existing.hidden_by || [];
        if (!hidden.includes(user.id)) return Response.json({ conversation: existing });
        return Response.json({
          conversation: await svc.Conversation.update(existing.id, { hidden_by: hidden.filter((id) => id !== user.id) }),
        });
      }
      const conversation = await svc.Conversation.create({
        type: 'direct',
        member_ids: [user.id, otherId],
        direct_key: directKey,
        last_message_at: new Date().toISOString(),
      });
      return Response.json({ conversation });
    }

    if (action === 'create_group') {
      const name = str(body.name).slice(0, MAX_NAME);
      if (!name) return fail(400, 'Give the group a name.');
      const others = await teamMemberIds(idList(body.member_ids).filter((id) => id !== user.id));
      if (others.length === 0) return fail(400, 'Add at least one team member to the group.');
      const conversation = await svc.Conversation.create({
        type: 'group',
        name,
        color: GROUP_COLORS.includes(str(body.color)) ? str(body.color) : DEFAULT_GROUP_COLOR,
        member_ids: [user.id, ...others],
        admin_ids: [user.id],
        last_message_at: new Date().toISOString(),
      });
      return Response.json({ conversation });
    }

    if (action === 'update_group') {
      const group = await memberGroup();
      if (!group) return fail(404, NOT_FOUND);
      if (!isGroupAdmin(group)) return fail(403, ADMIN_ONLY);
      const name = str(body.name).slice(0, MAX_NAME);
      if (!name) return fail(400, 'Give the group a name.');
      const color = str(body.color);
      if (!GROUP_COLORS.includes(color)) return fail(400, 'Choose a group colour.');
      return Response.json({ conversation: await svc.Conversation.update(group.id, { name, color }) });
    }

    if (action === 'delete') {
      const conversation = await memberConversation(str(body.conversation_id));
      if (!conversation) return fail(404, NOT_FOUND);
      if (conversation.type === 'group') {
        if (!isGroupAdmin(conversation)) return fail(403, ADMIN_ONLY);
        await purge(conversation.id);
        return Response.json({ ok: true });
      }
      // Direct: hide it for the caller only; once both members have hidden it, nobody can see it, so remove it.
      const hidden = [...new Set([...(conversation.hidden_by || []), user.id])];
      if (conversation.member_ids.every((id) => hidden.includes(id))) await purge(conversation.id);
      else await svc.Conversation.update(conversation.id, { hidden_by: hidden });
      return Response.json({ ok: true });
    }

    if (action === 'add_members') {
      const group = await memberGroup();
      if (!group) return fail(404, NOT_FOUND);
      if (!isGroupAdmin(group)) return fail(403, ADMIN_ONLY);
      const added = await teamMemberIds(idList(body.member_ids).filter((id) => !group.member_ids.includes(id)));
      if (added.length === 0) return Response.json({ conversation: group });
      return Response.json({
        conversation: await svc.Conversation.update(group.id, { member_ids: [...group.member_ids, ...added] }),
      });
    }

    if (action === 'remove_member') {
      const group = await memberGroup();
      if (!group) return fail(404, NOT_FOUND);
      const targetId = str(body.user_id);
      // Anyone may leave; only admins remove someone else.
      if (targetId !== user.id && !isGroupAdmin(group)) return fail(403, ADMIN_ONLY);
      const remaining = group.member_ids.filter((id) => id !== targetId);
      if (remaining.length === group.member_ids.length) return Response.json({ conversation: group });
      if (remaining.length === 0) {
        // The last member left: remove the group and its history.
        await purge(group.id);
        return Response.json({ conversation: null });
      }
      await svc.ConversationRead.deleteMany({ conversation_id: group.id, user_id: targetId });
      const admins = (group.admin_ids || []).filter((id) => id !== targetId && remaining.includes(id));
      return Response.json({
        // The group always keeps an admin: when the last one leaves, the longest-standing member takes over.
        conversation: await svc.Conversation.update(group.id, { member_ids: remaining, admin_ids: admins.length > 0 ? admins : [remaining[0]] }),
      });
    }

    if (action === 'set_admin') {
      const group = await memberGroup();
      if (!group) return fail(404, NOT_FOUND);
      if (!isGroupAdmin(group)) return fail(403, ADMIN_ONLY);
      const targetId = str(body.user_id);
      if (!group.member_ids.includes(targetId)) return fail(400, 'This person is no longer in the group.');
      const current = group.admin_ids || [];
      const admins = body.admin === true ? [...new Set([...current, targetId])] : current.filter((id) => id !== targetId);
      if (admins.length === 0) return fail(409, 'A group needs at least one admin. Make someone else an admin first.');
      if (admins.length === current.length && admins.every((id) => current.includes(id))) return Response.json({ conversation: group });
      return Response.json({ conversation: await svc.Conversation.update(group.id, { admin_ids: admins }) });
    }

    if (action === 'send') {
      const conversation = await memberConversation(str(body.conversation_id));
      if (!conversation) return fail(404, NOT_FOUND);
      const text = (typeof body.text === 'string' ? body.text : '').trim().slice(0, MAX_TEXT);
      const attachmentUri = str(body.attachment?.uri);
      if (/^https?:/i.test(attachmentUri)) return fail(400, 'This file cannot be attached.');
      if (!text && !attachmentUri) return fail(400, 'Write a message or attach a file.');
      const attachmentName = attachmentUri ? str(body.attachment.name).slice(0, 255) || 'Attachment' : '';
      const sentAt = new Date().toISOString();
      const message = await svc.ConversationMessage.create({
        conversation_id: conversation.id,
        sender_id: user.id,
        text,
        sent_at: sentAt,
        ...(attachmentUri ? {
          has_attachment: true,
          attachment_uri: attachmentUri,
          attachment_name: attachmentName,
          attachment_size: Number(body.attachment.size) || 0,
          attachment_type: str(body.attachment.type),
        } : {}),
      });
      const updated = await svc.Conversation.update(conversation.id, {
        last_message_text: (text || `📎 ${attachmentName}`).slice(0, PREVIEW_LENGTH),
        last_message_sender_id: user.id,
        last_message_at: sentAt,
        hidden_by: [],
      });
      await markRead(svc, conversation.id, user.id, sentAt);
      return Response.json({ message: publicMessage(message), conversation: updated });
    }

    if (action === 'messages') {
      const conversation = await memberConversation(str(body.conversation_id));
      if (!conversation) return fail(404, NOT_FOUND);
      const before = str(body.before);
      const query = { conversation_id: conversation.id, ...(before ? { sent_at: { $lt: before } } : {}) };
      const found = rows(await svc.ConversationMessage.filter(query, { sort: '-sent_at', limit: PAGE_SIZE + 1 }));
      return Response.json({ items: await withPolls(found.slice(0, PAGE_SIZE)), has_more: found.length > PAGE_SIZE });
    }

    if (action === 'files') {
      const conversation = await memberConversation(str(body.conversation_id));
      if (!conversation) return fail(404, NOT_FOUND);
      const query = { conversation_id: conversation.id, has_attachment: true };
      const before = str(body.before);
      const [found, total] = await Promise.all([
        svc.ConversationMessage.filter(
          { ...query, ...(before ? { sent_at: { $lt: before } } : {}) },
          { sort: '-sent_at', limit: FILES_PAGE_SIZE },
        ),
        svc.ConversationMessage.count(query),
      ]);
      return Response.json({
        items: rows(found).map(publicMessage),
        total,
        total_pages: Math.max(1, Math.ceil(total / FILES_PAGE_SIZE)),
      });
    }

    if (action === 'delete_file') {
      const messageId = str(body.message_id);
      const message = messageId ? await svc.ConversationMessage.get(messageId).catch(missing) : null;
      const conversation = message ? await memberConversation(message.conversation_id) : null;
      if (!conversation || !message.attachment_uri) return fail(404, 'This file is no longer available.');
      if (message.sender_id !== user.id && !(conversation.type === 'group' && isGroupAdmin(conversation))) {
        return fail(403, 'Only the person who shared this file or a group admin can delete it.');
      }
      // A message with text keeps its text and loses the file; a file-only message is removed.
      if (message.text) {
        await svc.ConversationMessage.update(message.id, {
          has_attachment: false, attachment_uri: '', attachment_name: '', attachment_size: 0, attachment_type: '',
        });
      } else {
        await svc.ConversationMessage.delete(message.id);
      }
      const wasLatest = !message.text && conversation.last_message_at === message.sent_at;
      return Response.json({
        conversation: await svc.Conversation.update(conversation.id, {
          file_activity_at: new Date().toISOString(),
          file_removed_message_id: message.id,
          ...(wasLatest ? { last_message_text: 'File deleted' } : {}),
        }),
      });
    }

    if (action === 'create_poll') {
      const conversation = await memberConversation(str(body.conversation_id));
      if (!conversation) return fail(404, NOT_FOUND);
      const { poll, error } = buildPoll(body);
      if (error) return fail(400, error);
      const sentAt = new Date().toISOString();
      const message = await svc.ConversationMessage.create({
        conversation_id: conversation.id,
        sender_id: user.id,
        text: '',
        sent_at: sentAt,
        poll,
      });
      const updated = await svc.Conversation.update(conversation.id, {
        last_message_text: `📊 ${poll.question}`.slice(0, PREVIEW_LENGTH),
        last_message_sender_id: user.id,
        last_message_at: sentAt,
        hidden_by: [],
      });
      await markRead(svc, conversation.id, user.id, sentAt);
      return Response.json({ message: (await withPolls([message]))[0], conversation: updated });
    }

    if (action === 'poll') {
      const message = await memberPoll();
      if (!message) return fail(404, POLL_NOT_FOUND);
      return Response.json({ message: (await withPolls([message]))[0] });
    }

    if (action === 'vote_poll') {
      const message = await memberPoll();
      if (!message) return fail(404, POLL_NOT_FOUND);
      const poll = message.poll;
      if (pollClosedAt(poll)) return fail(409, 'This poll has closed.');
      const optionIds = idList(body.option_ids).filter((id) => poll.options.some((o) => o.id === id));
      if (optionIds.length === 0 || (!poll.multiple && optionIds.length !== 1)) {
        return fail(400, poll.multiple ? 'Choose at least one option.' : 'Choose one option.');
      }
      const existing = rows(await svc.ConversationPollVote.filter(
        { message_id: message.id, user_id: user.id },
        { sort: 'created_date', limit: 1 },
      ))[0];
      if (existing && !poll.allow_change) return fail(409, 'Your vote is final for this poll.');
      if (existing) {
        await svc.ConversationPollVote.update(existing.id, { option_ids: optionIds });
      } else {
        await svc.ConversationPollVote.create({
          message_id: message.id,
          conversation_id: message.conversation_id,
          user_id: user.id,
          option_ids: optionIds,
        });
      }
      return pollChanged(message);
    }

    if (action === 'close_poll') {
      const message = await memberPoll();
      if (!message) return fail(404, POLL_NOT_FOUND);
      if (message.sender_id !== user.id) return fail(403, 'Only the person who created this poll can close it.');
      if (pollClosedAt(message.poll)) return Response.json({ message: (await withPolls([message]))[0] });
      const closed = await svc.ConversationMessage.update(message.id, {
        poll: { ...message.poll, closed_at: new Date().toISOString() },
      });
      return pollChanged(closed);
    }

    if (action === 'pins') {
      const conversation = await memberConversation(str(body.conversation_id));
      if (!conversation) return fail(404, NOT_FOUND);
      const pinned = rows(await svc.ConversationMessage.filter(
        { conversation_id: conversation.id, pinned: true },
        { sort: '-pinned_at', limit: MAX_PINS },
      ));
      return Response.json({ items: pinned.map(publicPin) });
    }

    if (action === 'pin') {
      const messageId = str(body.message_id);
      const message = messageId ? await svc.ConversationMessage.get(messageId).catch(missing) : null;
      if (!message || !(await memberConversation(message.conversation_id))) return fail(404, 'This message is no longer available.');
      const pin = body.pinned === true;
      if (pin === !!message.pinned) return Response.json({ pin: pin ? publicPin(message) : null });
      if (pin) {
        const pinnedCount = rows(await svc.ConversationMessage.filter(
          { conversation_id: message.conversation_id, pinned: true },
          { limit: MAX_PINS },
        )).length;
        if (pinnedCount >= MAX_PINS) return fail(409, `A conversation can have up to ${MAX_PINS} pinned items. Unpin one first.`);
      }
      const now = new Date().toISOString();
      const updated = await svc.ConversationMessage.update(
        message.id,
        pin ? { pinned: true, pinned_at: now, pinned_by: user.id } : { pinned: false, pinned_at: '', pinned_by: '' },
      );
      await svc.Conversation.update(message.conversation_id, { pin_activity_at: now });
      return Response.json({ pin: pin ? publicPin(updated) : null });
    }

    if (action === 'read_state') {
      return Response.json({ items: await readState(svc, idList(body.conversation_ids), user.id) });
    }

    if (action === 'mark_read') {
      const conversation = await memberConversation(str(body.conversation_id));
      if (!conversation) return fail(404, NOT_FOUND);
      // Only a real change is broadcast, so members' lists refresh their Read receipts once.
      const unreadFrom = await markRead(svc, conversation.id, user.id, conversation.last_message_at);
      if (unreadFrom !== null) {
        await svc.Conversation.update(conversation.id, { read_activity_at: new Date().toISOString() });
      }
      return Response.json({ ok: true, unread_from: unreadFrom });
    }

    if (action === 'attachment_url') {
      const messageId = str(body.message_id);
      const message = messageId ? await svc.ConversationMessage.get(messageId).catch(missing) : null;
      const conversation = message ? await memberConversation(message.conversation_id) : null;
      if (!conversation || !message.attachment_uri) return fail(404, 'This file is no longer available.');
      const result = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
        file_uri: message.attachment_uri,
        expires_in: 300,
      });
      return Response.json({ signed_url: result.signed_url });
    }

    return fail(400, 'Unknown action.');
  } catch (error) {
    console.error('conversations failed:', error?.message || error);
    return fail(500, 'Something went wrong. Please try again.');
  }
}

serve(handler);
