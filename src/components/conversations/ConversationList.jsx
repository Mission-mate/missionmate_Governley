import React, { useMemo, useState } from 'react';
import { Search, Plus, MessagesSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoaderOne } from '@/components/ui/loaders';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import IconTip from '@/components/shared/IconTip';
import EmptyState from '@/components/shared/states/EmptyState';
import LoadError from '@/components/shared/states/LoadError';
import ConversationListItem from './ConversationListItem';
import { conversationTitle } from '@/lib/conversations';
import { cn } from '@/lib/utils';
import { PANE_WASH } from './paneWash';

const SECTIONS = [
  { type: 'group', label: 'Groups' },
  { type: 'direct', label: 'Direct messages' },
];

/** Left rail: type tabs, search, new conversation, and the user's conversations grouped by type. */
export default function ConversationList({
  conversations, readState, meId, people, selectedId, onSelect, onNew, loading, failure, hasMore, onLoadMore, loadingMore,
}) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  const tabs = useMemo(() => [
    { value: 'all', label: 'All', count: conversations.length },
    { value: 'group', label: 'Groups', count: conversations.filter((c) => c.type === 'group').length },
    { value: 'direct', label: 'Direct', count: conversations.filter((c) => c.type === 'direct').length },
  ], [conversations]);

  const sections = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = q ? conversations.filter((c) => conversationTitle(c, meId, people).toLowerCase().includes(q)) : conversations;
    return SECTIONS
      .filter((s) => tab === 'all' || tab === s.type)
      .map((s) => ({ ...s, items: matches.filter((c) => c.type === s.type) }))
      .filter((s) => s.items.length > 0);
  }, [conversations, search, tab, meId, people]);

  return (
    <div className={cn('h-full flex flex-col', PANE_WASH)}>
      <div className="px-4 pt-4 pb-3 space-y-3 shrink-0">
        <CapsuleTabs animated tabs={tabs} value={tab} onChange={setTab} size="sm" raised showZeroCount className="flex w-full rounded-xl" tabClassName="flex-1 justify-center px-2 rounded-lg" />
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9 bg-card placeholder:text-xs" placeholder="Search people or groups" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <IconTip label="New conversation">
            <button
              type="button"
              onClick={onNew}
              className="group w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95 transition-[background-color,transform,box-shadow] duration-200"
            >
              {/* The plus turns once on hover; reduced motion keeps it still. */}
              <Plus className="w-4 h-4" strokeWidth={2.2} />
              <span className="sr-only">New conversation</span>
            </button>
          </IconTip>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {loading ? (
          <div className="py-16"><LoaderOne /></div>
        ) : failure ? (
          <LoadError failure={failure} title="Couldn’t load conversations" className="mx-2 mt-2" />
        ) : conversations.length === 0 ? (
          <EmptyState
            icon={MessagesSquare}
            title="No conversations yet"
            description="Message a team member or start a group chat."
            actionLabel="New conversation"
            onAction={onNew}
          />
        ) : sections.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">
            {search.trim() ? 'No conversations match your search.' : 'Nothing here yet.'}
          </p>
        ) : (
          <div className="content-enter">
            {sections.map((section) => (
              <div key={section.type} className="mb-2">
                <p className="px-3 pt-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{section.label}</p>
                <div className="space-y-0.5">
                  {section.items.map((c) => (
                    <ConversationListItem key={c.id} conversation={c} state={readState[c.id]} meId={meId} people={people} active={c.id === selectedId} onSelect={onSelect} />
                  ))}
                </div>
              </div>
            ))}
            {hasMore && !search.trim() && (
              <div className="pt-2 flex justify-center">
                <Button variant="ghost" size="sm" onClick={onLoadMore} disabled={loadingMore}>
                  {loadingMore ? 'Loading...' : 'Load more'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}