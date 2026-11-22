import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MessageBubble from './MessageBubble';
import PollCard from './polls/PollCard';
import PinToggle from './pins/PinToggle';
import PersonAvatar from './PersonAvatar';
import NewMessagesDivider from './NewMessagesDivider';
import { dayKey, dayLabel, personName } from '@/lib/conversations';
import { cn } from '@/lib/utils';

// A new message scrolls into view only when the reader is already near the bottom.
const NEAR_BOTTOM_PX = 160;
// Within a run of messages from one sender, the time is shown again after this long a pause.
const TIME_GAP_MS = 5 * 60 * 1000;
// How long a jumped-to pinned item stays highlighted (matches the pin-flash animation).
const FLASH_MS = 1600;

/**
 * Scrollable thread, oldest first. Mount one per conversation (keyed by its id).
 * `pinnedIds` marks pinned items; `focus` ({ id }) scrolls to one, then `onFocused()` clears it.
 * `unreadFrom` is the reader's read point when the conversation was opened (null when nothing was unread):
 * messages from others sent after it are marked as new.
 */
export default function MessageList({
  messages, meId, people, isGroup, hasMore, onLoadOlder, loadingOlder, onOpenAttachment, onVote, onClosePoll, onRefreshPoll,
  pinnedIds, onTogglePin, focus, onFocused, searchTerm, activeMatchId, unreadFrom,
}) {
  const scrollRef = useRef(null);
  const [flashId, setFlashId] = useState(null);
  const seen = useRef({ first: null, last: null, height: 0 });

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || messages.length === 0) return;
    const first = messages[0].id;
    const lastMessage = messages[messages.length - 1];
    const prev = seen.current;
    if (prev.last === null) {
      el.scrollTop = el.scrollHeight;
    } else if (lastMessage.id !== prev.last) {
      const nearBottom = prev.height - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
      if (lastMessage.sender_id === meId || nearBottom) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else if (first !== prev.first) {
      // Earlier messages were added above: keep the reader's place.
      el.scrollTop += el.scrollHeight - prev.height;
    }
    seen.current = { first, last: lastMessage.id, height: el.scrollHeight };
  }, [messages, meId]);

  // The unread point arrived: open the thread at the first new message.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    const divider = el?.querySelector('[data-new-messages]');
    if (!divider) return;
    divider.scrollIntoView({ block: 'center' });
    seen.current.height = el.scrollHeight;
  }, [unreadFrom]);

  const isUnread = (message) => unreadFrom != null && message.sender_id !== meId && message.sent_at > unreadFrom;
  const firstUnreadId = messages.find(isUnread)?.id;

  // A pinned item was chosen: bring it into view once it is loaded, then briefly highlight it.
  useEffect(() => {
    if (!focus) return;
    const row = scrollRef.current?.querySelector(`[data-message-id="${focus.id}"]`);
    if (!row) return;
    row.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setFlashId(focus.id);
    onFocused();
  }, [focus, messages, onFocused]);

  // The active search match moved: bring it into view.
  useEffect(() => {
    if (!activeMatchId) return;
    scrollRef.current?.querySelector(`[data-message-id="${activeMatchId}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [activeMatchId]);

  useEffect(() => {
    if (!flashId) return undefined;
    const timer = setTimeout(() => setFlashId(null), FLASH_MS);
    return () => clearTimeout(timer);
  }, [flashId]);

  return (
    <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 py-4">
      <div className="mx-auto w-full max-w-4xl">
        {hasMore && (
          <div className="flex justify-center pb-3">
            <Button variant="ghost" size="sm" className="rounded-full" onClick={onLoadOlder} disabled={loadingOlder}>
              {loadingOlder ? 'Loading...' : 'Load earlier messages'}
            </Button>
          </div>
        )}
        {messages.map((message, i) => {
          const previous = messages[i - 1];
          const newDay = !previous || dayKey(previous.sent_at) !== dayKey(message.sent_at);
          const newRun = newDay || previous.sender_id !== message.sender_id;
          const next = messages[i + 1];
          const endsRun = !next || next.sender_id !== message.sender_id || dayKey(next.sent_at) !== dayKey(message.sent_at);
          const mine = message.sender_id === meId;
          const senderName = isGroup && !mine && newRun ? personName(people, message.sender_id) : null;
          const showTime = newRun || new Date(message.sent_at) - new Date(previous.sent_at) > TIME_GAP_MS;
          const pinned = pinnedIds.has(message.id);
          const actions = <PinToggle pinned={pinned} onToggle={(pin) => onTogglePin(message.id, pin)} />;
          return (
            <React.Fragment key={message.id}>
              {newDay && (
                <div className="flex items-center gap-3 py-3">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-[13px] font-semibold text-muted-foreground">{dayLabel(message.sent_at)}</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
              )}
              {message.id === firstUnreadId && <NewMessagesDivider />}
              <div
                data-message-id={message.id}
                className={cn(
                  'group flex items-end gap-2.5 rounded-2xl transition-colors duration-300',
                  newRun ? 'mt-5' : 'mt-2',
                  isUnread(message) && 'bg-primary/5 shadow-[0_0_0_2px_hsl(var(--primary)/0.05)]',
                  flashId === message.id && 'animate-pin-flash',
                  activeMatchId === message.id && 'bg-amber-100/70 dark:bg-amber-400/10 ring-1 ring-amber-300/70 dark:ring-amber-400/30'
                )}
              >
                {isGroup && !mine && (newRun
                  ? <PersonAvatar person={people.get(message.sender_id)} className="h-8 w-8 text-[11px]" />
                  : <span className="w-8 shrink-0" />)}
                <div className="flex-1 min-w-0">
                {pinned && (
                  <p className={cn('flex items-center gap-1 px-1 mb-1 text-[11px] font-medium text-primary', mine && 'justify-end')}>
                    <Pin className="w-3 h-3" strokeWidth={2.2} /> Pinned
                  </p>
                )}
                {message.poll ? (
                  <PollCard
                    message={message}
                    mine={mine}
                    senderName={senderName}
                    people={people}
                    actions={actions}
                    onVote={onVote}
                    onClose={onClosePoll}
                    onRefresh={onRefreshPoll}
                  />
                ) : (
                  <MessageBubble message={message} mine={mine} senderName={senderName} showTime={showTime} tail={endsRun} actions={actions} onOpenAttachment={onOpenAttachment} searchTerm={searchTerm} />
                )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}