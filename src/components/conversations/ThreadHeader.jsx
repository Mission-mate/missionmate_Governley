import React from 'react';
import { ArrowLeft, Info, Search } from 'lucide-react';
import IconTip from '@/components/shared/IconTip';
import ConversationAvatar from './ConversationAvatar';
import ThreadHeaderActions from './ThreadHeaderActions';
import { conversationTitle } from '@/lib/conversations';
import { cn } from '@/lib/utils';

const ICON_BUTTON = 'w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-200';
const IDLE = 'text-muted-foreground hover:text-foreground hover:bg-muted';

export default function ThreadHeader({ conversation, meId, people, onBack, detailsOpen, onToggleDetails, searchOpen, onToggleSearch, onChanged, onDeleted }) {
  const isGroup = conversation.type === 'group';
  const count = conversation.member_ids.length;
  const title = conversationTitle(conversation, meId, people);
  return (
    <div className="flex items-center gap-3 px-4 md:px-5 h-16 border-b border-border shrink-0">
      <button type="button" onClick={onBack} className={cn(ICON_BUTTON, IDLE, 'md:hidden -ml-1')}>
        <ArrowLeft className="w-4 h-4" strokeWidth={1.8} />
        <span className="sr-only">Back to conversations</span>
      </button>
      <ConversationAvatar conversation={conversation} meId={meId} people={people} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {isGroup ? `${count} member${count === 1 ? '' : 's'}` : 'Direct message'}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <IconTip label="Search">
          <button
            type="button"
            onClick={onToggleSearch}
            aria-pressed={searchOpen}
            className={cn(ICON_BUTTON, searchOpen ? 'bg-sidebar-accent text-sidebar-accent-foreground' : IDLE)}
          >
            <Search className="w-[17px] h-[17px]" strokeWidth={1.8} />
            <span className="sr-only">Search messages</span>
          </button>
        </IconTip>
        <IconTip label="Details">
          <button
            type="button"
            onClick={onToggleDetails}
            aria-pressed={detailsOpen}
            className={cn(ICON_BUTTON, detailsOpen ? 'bg-sidebar-accent text-sidebar-accent-foreground' : IDLE)}
          >
            <Info className="w-[18px] h-[18px]" strokeWidth={1.8} />
            <span className="sr-only">Details</span>
          </button>
        </IconTip>
        <ThreadHeaderActions
          conversation={conversation}
          meId={meId}
          title={title}
          buttonClassName={cn(ICON_BUTTON, IDLE)}
          onChanged={onChanged}
          onDeleted={onDeleted}
        />
      </div>
    </div>
  );
}