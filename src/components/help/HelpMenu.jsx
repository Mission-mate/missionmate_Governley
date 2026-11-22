import React from 'react';
import { Ticket, CalendarDays, BookOpen, PlayCircle } from 'lucide-react';
import HelpChatCard from './HelpChatCard';
import HelpTile from './HelpTile';
import HelpResourceRow from './HelpResourceRow';
import HelpIdeaCard from './HelpIdeaCard';

/** Help & Support home: chat, ticket/call, resources and the Ideaboard. */
export default function HelpMenu({ onNavigate }) {
  return (
    <div className="flex flex-col gap-[22px] px-6 pb-6 pt-1">
      <div className="flex flex-col gap-2.5">
        <HelpChatCard onClick={() => onNavigate('chat')} />
        <div className="grid grid-cols-2 gap-2.5">
          <HelpTile icon={Ticket} tone="amber" title="Raise a ticket" subtitle="Report an issue or ask a question" onClick={() => onNavigate('ticket')} />
          <HelpTile icon={CalendarDays} tone="green" title="Book a call" subtitle="Schedule time with our team" onClick={() => onNavigate('call')} />
        </div>
      </div>

      <nav aria-label="Resources" className="flex flex-col gap-1">
        <span className="px-0.5 pb-1.5 text-xs font-medium text-muted-foreground">Resources</span>
        <HelpResourceRow icon={BookOpen} tone="violet" title="Support docs" subtitle="Browse documentation & guides" href="https://docs.base44.com" />
        <HelpResourceRow icon={PlayCircle} tone="red" title="Tutorials" subtitle="Watch step-by-step walkthroughs" href="https://www.youtube.com/@base44" />
      </nav>

      <HelpIdeaCard onClick={() => onNavigate('idea')} />
    </div>
  );
}