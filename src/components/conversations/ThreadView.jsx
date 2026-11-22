import React, { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useMessageSearch from '@/hooks/useMessageSearch';
import ThreadSearchBar from './search/ThreadSearchBar';
import { LoaderOne } from '@/components/ui/loaders';
import { toast } from '@/components/ui/use-toast';
import LoadError from '@/components/shared/states/LoadError';
import ThreadHeader from './ThreadHeader';
import MessageList from './MessageList';
import MessageComposer from './MessageComposer';
import CreatePollModal from './polls/CreatePollModal';
import PinnedBar from './pins/PinnedBar';
import { PANE_WASH } from './paneWash';
import { apiErrorMessage } from '@/lib/conversationsApi';
import { conversationTitle } from '@/lib/conversations';

/**
 * An open conversation: header, message search, pinned bar, history and composer.
 * `thread` is { messages, isLoading, failure, hasMore, loadOlder, loadThrough, loadingOlder, refreshPoll }.
 * `onTogglePin(messageId, pinned)` resolves once saved.
 * `unreadFrom` is the reader's read point when the conversation was opened, or null when nothing was unread.
 */
export default function ThreadView({
  conversation, meId, people, thread, pins, unreadFrom, onBack, detailsOpen, onToggleDetails, onChanged, onDeleted, onSend, onOpenAttachment, onCreatePoll, onVote, onClosePoll, onTogglePin,
}) {
  const [pollOpen, setPollOpen] = useState(false);
  const [focus, setFocus] = useState(null);
  const pinnedIds = useMemo(() => new Set(pins.map((p) => p.id)), [pins]);
  const clearFocus = useCallback(() => setFocus(null), []);
  const search = useMessageSearch(thread.messages);

  const jumpTo = async (pin) => {
    try {
      if (await thread.loadThrough(pin)) setFocus({ id: pin.id });
      else toast({ variant: 'destructive', title: 'This message is no longer available.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Couldn’t open the pinned item', description: apiErrorMessage(err) });
    }
  };

  const ready = !thread.isLoading && !thread.failure;
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className={`flex-1 min-w-0 min-h-0 flex flex-col ${PANE_WASH}`}
    >
      <ThreadHeader
        conversation={conversation} meId={meId} people={people} onBack={onBack}
        detailsOpen={detailsOpen} onToggleDetails={onToggleDetails}
        searchOpen={search.open} onToggleSearch={search.open ? search.close : search.openSearch}
        onChanged={onChanged} onDeleted={onDeleted}
      />
      <AnimatePresence initial={false}>
        {search.open && (
          <ThreadSearchBar search={search} hasMore={ready && thread.hasMore} loadingOlder={thread.loadingOlder} onLoadOlder={thread.loadOlder} />
        )}
      </AnimatePresence>
      {ready && pins.length > 0 && (
        <PinnedBar pins={pins} meId={meId} people={people} onJump={jumpTo} onUnpin={(pin) => onTogglePin(pin.id, false)} />
      )}
      {thread.isLoading ? (
        <div className="flex-1 flex items-center justify-center"><LoaderOne /></div>
      ) : thread.failure ? (
        <div className="flex-1 p-6"><LoadError failure={thread.failure} title="Couldn’t load messages" /></div>
      ) : thread.messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <p className="text-sm text-muted-foreground text-center">No messages yet. Say hello to get things started.</p>
        </div>
      ) : (
        <MessageList
          messages={thread.messages}
          meId={meId}
          people={people}
          isGroup={conversation.type === 'group'}
          hasMore={thread.hasMore}
          onLoadOlder={thread.loadOlder}
          loadingOlder={thread.loadingOlder}
          onOpenAttachment={onOpenAttachment}
          onVote={onVote}
          onClosePoll={onClosePoll}
          onRefreshPoll={thread.refreshPoll}
          pinnedIds={pinnedIds}
          onTogglePin={onTogglePin}
          focus={focus}
          onFocused={clearFocus}
          searchTerm={search.term}
          activeMatchId={search.activeId}
          unreadFrom={unreadFrom}
        />
      )}
      <MessageComposer
        onSend={onSend}
        onAddPoll={() => setPollOpen(true)}
        placeholder={`Message ${conversationTitle(conversation, meId, people)}...`}
      />
      <CreatePollModal isOpen={pollOpen} onClose={() => setPollOpen(false)} onCreate={onCreatePoll} />
    </motion.div>
  );
}