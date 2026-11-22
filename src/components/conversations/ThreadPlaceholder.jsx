import React from 'react';
import { MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PANE_WASH } from './paneWash';

/** Shown in the thread area when no conversation is open. */
export default function ThreadPlaceholder({ onNew }) {
  return (
    <div className={`flex-1 flex flex-col items-center justify-center text-center px-6 bg-muted/30 ${PANE_WASH}`}>
      <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-5">
        <MessagesSquare className="w-7 h-7 text-primary" strokeWidth={1.6} />
      </div>
      <h2 className="text-lg font-semibold text-foreground">Your conversations</h2>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">
        Choose a conversation to keep talking, or start a new one with your team.
      </p>
      <Button className="mt-5 rounded-full px-5" onClick={onNew}>New conversation</Button>
    </div>
  );
}