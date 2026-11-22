import React from 'react';
import { CheckCheck } from 'lucide-react';
import ConversationAvatar from './ConversationAvatar';
import { conversationTitle, conversationPreview, listTime } from '@/lib/conversations';
import { cn } from '@/lib/utils';

/** One conversation row. `state` is { unread, read } from the server; the open conversation never shows unread. */
export default function ConversationListItem({ conversation, state, meId, people, active, onSelect }) {
  const unread = active ? 0 : state?.unread || 0;
  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors duration-200',
        active ? 'bg-sidebar-accent' : 'hover:bg-muted/70'
      )}
    >
      <span className="relative shrink-0 flex">
        <ConversationAvatar conversation={conversation} meId={meId} people={people} />
        {unread > 0 && (
          <span className="absolute -top-px -right-px box-content w-[11px] h-[11px] rounded-full bg-rose-500 border-2 border-card animate-in fade-in duration-200 ease-out motion-reduce:animate-none">
            <span className="sr-only">Unread messages</span>
          </span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={cn('text-sm font-semibold truncate', active ? 'text-sidebar-accent-foreground' : 'text-foreground')}>
            {conversationTitle(conversation, meId, people)}
          </p>
          <span className={cn('text-[11px] shrink-0 tabular-nums', unread ? 'text-primary font-semibold' : 'text-muted-foreground')}>
            {listTime(conversation.last_message_at)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={cn('text-[13px] truncate', unread ? 'text-foreground font-medium' : 'text-muted-foreground')}>
            {conversationPreview(conversation, meId, people)}
          </p>
          {!unread && state?.read && (
            <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium text-primary animate-in fade-in duration-200">
              <CheckCheck className="w-3.5 h-3.5" />
              Read
            </span>
          )}
        </div>
      </div>
    </button>
  );
}