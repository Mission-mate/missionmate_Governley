import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import ConversationList from '@/components/conversations/ConversationList';
import ThreadView from '@/components/conversations/ThreadView';
import ThreadPlaceholder from '@/components/conversations/ThreadPlaceholder';
import NewConversationModal from '@/components/conversations/NewConversationModal';
import ConversationDetails from '@/components/conversations/details/ConversationDetails';
import { useDirectory, useConversationList, useConversationEvents, useThread, usePins, useSharedFiles, useReadState } from '@/hooks/useConversations';
import { markConversationRead, sendMessage, openAttachment, createPoll, votePoll, closePoll, setPinned, apiErrorMessage } from '@/lib/conversationsApi';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const WIDE = window.matchMedia('(min-width: 1024px)');

/** Messenger-style workspace: the user's conversations, the open thread, and its details panel. */
export default function Conversations() {
  const meId = useAuth().user.id;
  const [params, setParams] = useSearchParams();
  const [newOpen, setNewOpen] = useState(false);
  // The details panel sits beside the thread on wide screens and covers it on narrow ones.
  const [detailsOpen, setDetailsOpen] = useState(() => WIDE.matches);
  // The conversation being read and where its unread messages began when it was opened: { id, unreadFrom }.
  const [opened, setOpened] = useState(null);

  const { people } = useDirectory();
  const list = useConversationList(meId);
  const selected = list.conversations.find((c) => c.id === params.get('c')) || null;
  const thread = useThread(selected?.id);
  const pinned = usePins(selected?.id);
  const shared = useSharedFiles(selected?.id, detailsOpen);
  const reads = useReadState(meId, list.conversations);

  // Team members who can be messaged or added to a group.
  const candidates = useMemo(
    () => [...people.values()].filter((p) => p.selectable && p.id !== meId).sort((a, b) => a.name.localeCompare(b.name)),
    [people, meId],
  );

  // Opening a conversation, and any new message while it is open, marks it read.
  const threadReady = !!selected && !thread.isLoading && !thread.failure;
  const selectedId = selected?.id;
  const selectedLastAt = selected?.last_message_at;
  const syncReads = reads.sync;
  useEffect(() => {
    if (!threadReady) return;
    markConversationRead(selectedId).then((unreadFrom) => {
      // Only the first catch-up of an opening places the divider; later messages arrive below it.
      setOpened((prev) => (prev?.id === selectedId ? prev : { id: selectedId, unreadFrom }));
      syncReads();
    }, () => {});
  }, [threadReady, selectedId, selectedLastAt, syncReads]);

  useConversationEvents((event) => {
    reads.sync();
    if (event.type === 'delete') {
      list.remove(event.id);
      return;
    }
    const conversation = { ...event.data, id: event.id };
    list.put(conversation);
    // A member catching up changes only read_activity_at: the open thread has nothing new to load.
    const threadChanged = !selected || ['last_message_at', 'poll_activity_at', 'pin_activity_at', 'file_activity_at', 'member_ids']
      .some((k) => JSON.stringify(selected[k]) !== JSON.stringify(conversation[k]));
    if (event.id === selected?.id && threadChanged && conversation.member_ids?.includes(meId)) {
      // Another member deleted a shared file: it leaves the open thread too.
      if (selected.file_activity_at !== conversation.file_activity_at) thread.dropFile(conversation.file_removed_message_id);
      thread.sync();
      pinned.sync();
      if (detailsOpen) shared.sync();
    }
  });

  const select = (id) => {
    // Each opened conversation starts with details shown on desktop and hidden on narrow screens.
    setDetailsOpen(WIDE.matches);
    setOpened(null);
    setParams(id ? { c: id } : {}, { replace: !id });
  };

  const handleSend = async (draft) => {
    const { message, conversation } = await sendMessage(selected.id, draft);
    thread.append(message);
    list.put(conversation);
  };

  const handleCreatePoll = async (poll) => {
    const { message, conversation } = await createPoll(selected.id, poll);
    thread.append(message);
    list.put(conversation);
  };

  const handleVote = async (messageId, optionIds) => thread.replace(await votePoll(messageId, optionIds));

  const handleClosePoll = async (messageId) => thread.replace(await closePoll(messageId));

  const handleTogglePin = async (messageId, pin) => {
    try {
      pinned.set(messageId, await setPinned(messageId, pin));
    } catch (err) {
      toast({ variant: 'destructive', title: pin ? 'Couldn’t pin this item' : 'Couldn’t unpin this item', description: apiErrorMessage(err) });
      pinned.sync();
    }
  };

  const handleCreated = (conversation) => {
    list.put(conversation);
    setNewOpen(false);
    select(conversation.id);
  };

  // `conversation` is null once the group no longer exists (its last member left).
  const handleGroupChanged = (conversation) => {
    if (conversation) list.put(conversation);
    else list.remove(selected.id);
  };

  // A shared file was deleted from the details panel: the thread and pinned bar follow.
  const handleFileDeleted = (messageId, conversation) => {
    thread.dropFile(messageId);
    list.put(conversation);
    pinned.sync();
  };

  const handleDeleted = () => {
    list.remove(selected.id);
    select(null);
  };

  return (
    <div className="h-full flex bg-card">
      <aside className={cn('w-full md:w-[320px] xl:w-[340px] shrink-0 border-r border-border', selected && 'hidden md:block')}>
        <ConversationList
          conversations={list.conversations}
          readState={reads.readState}
          meId={meId}
          people={people}
          selectedId={selected?.id}
          onSelect={select}
          onNew={() => setNewOpen(true)}
          loading={list.isLoading}
          failure={list.failure}
          hasMore={list.hasMore}
          onLoadMore={list.loadMore}
          loadingMore={list.loadingMore}
        />
      </aside>
      <section className={cn('relative flex-1 min-w-0 flex', !selected && 'hidden md:flex')}>
        {selected ? (
          // One keyed group per conversation: switching swaps the whole thread + details together.
          <React.Fragment key={selected.id}>
          <ThreadView
            conversation={selected}
            meId={meId}
            people={people}
            thread={thread}
            pins={pinned.pins}
            unreadFrom={opened?.id === selected.id ? opened.unreadFrom : null}
            onTogglePin={handleTogglePin}
            onBack={() => select(null)}
            detailsOpen={detailsOpen}
            onToggleDetails={() => setDetailsOpen((open) => !open)}
            onChanged={handleGroupChanged}
            onDeleted={handleDeleted}
            onSend={handleSend}
            onOpenAttachment={openAttachment}
            onCreatePoll={handleCreatePoll}
            onVote={handleVote}
            onClosePoll={handleClosePoll}
          />
          <AnimatePresence initial={false}>
          {detailsOpen && (
            <ConversationDetails
              key="details"
              wide={WIDE.matches}
              conversation={selected}
              meId={meId}
              people={people}
              candidates={candidates}
              onClose={() => setDetailsOpen(false)}
              onChanged={handleGroupChanged}
              shared={shared}
              onFileDeleted={handleFileDeleted}
            />
          )}
          </AnimatePresence>
          </React.Fragment>
        ) : (
          <ThreadPlaceholder onNew={() => setNewOpen(true)} />
        )}
      </section>

      <NewConversationModal isOpen={newOpen} onClose={() => setNewOpen(false)} candidates={candidates} onCreated={handleCreated} />
    </div>
  );
}