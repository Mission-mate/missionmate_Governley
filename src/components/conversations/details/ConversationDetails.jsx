import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import ConversationAvatar from '../ConversationAvatar';
import GroupDetails from './GroupDetails';
import DirectDetails from './DirectDetails';
import { conversationTitle, otherMemberId, isGroupAdmin } from '@/lib/conversations';

/**
 * Details panel beside the open thread: group details (members, leave) for a group,
 * or the other person's Team members details for a direct conversation; both tab in the conversation's shared files.
 */
// Desktop: the rail grows from the edge so the thread resizes smoothly. Narrow: it slides over the thread.
// Wide enough for the Shared files action bar (Open, Download, Delete and close) to sit inside the pane.
const PANE_WIDTH = 380;
const MOTION = {
  wide: { initial: { width: 0, opacity: 0 }, animate: { width: PANE_WIDTH, opacity: 1 }, exit: { width: 0, opacity: 0 } },
  narrow: { initial: { x: 24, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: 24, opacity: 0 } },
};

export default function ConversationDetails({ conversation, meId, people, candidates, onClose, onChanged, shared, onFileDeleted, wide }) {
  const isGroup = conversation.type === 'group';
  const count = conversation.member_ids.length;
  // Mirrors the server: a shared file can be deleted by its sender or a group admin.
  const canDelete = (file) => file.sender_id === meId || (isGroup && isGroupAdmin(conversation, meId));
  return (
    <motion.aside
      {...MOTION[wide ? 'wide' : 'narrow']}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 z-10 lg:static lg:z-auto lg:shrink-0 overflow-hidden bg-card border-l border-border"
    >
      <div className="h-full w-full lg:w-[380px] flex flex-col">
      <div className="relative shrink-0 px-5 pt-8 pb-6 text-center border-b border-border bg-gradient-to-b from-sidebar-accent/70 to-transparent">
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200"
        >
          <X className="w-4 h-4" />
          <span className="sr-only">Close details</span>
        </button>
        <ConversationAvatar conversation={conversation} meId={meId} people={people} className="h-16 w-16 text-xl mx-auto" />
        <p className="mt-3 text-base font-semibold text-foreground truncate">{conversationTitle(conversation, meId, people)}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isGroup ? `Group · ${count} member${count === 1 ? '' : 's'}` : 'Direct message'}
        </p>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        {isGroup ? (
          <GroupDetails conversation={conversation} meId={meId} people={people} candidates={candidates} onChanged={onChanged} shared={shared} canDelete={canDelete} onFileDeleted={onFileDeleted} />
        ) : (
          <DirectDetails person={people.get(otherMemberId(conversation, meId))} shared={shared} canDelete={canDelete} onFileDeleted={onFileDeleted} />
        )}
      </div>
      </div>
    </motion.aside>
  );
}