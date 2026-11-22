import React, { useState, useEffect } from 'react';
import SlidePane from '@/components/ui/SlidePane';
import { ArrowLeft } from 'lucide-react';
import HelpMenu from './HelpMenu';
import HelpMenuHeader from './HelpMenuHeader';
import TicketForm from './TicketForm';
import IdeaForm from './IdeaForm';
import BookCallForm from './BookCallForm';
import HelpChat from './HelpChat';
import usePageLeaveGuard from '@/hooks/usePageLeaveGuard';
import CloseButton from '@/components/shared/CloseButton';
const TITLES = {
  menu: 'Help & Support',
  chat: 'Start a Chat',
  ticket: 'Raise a Ticket',
  call: 'Book a Call',
  idea: 'Submit an Idea',
};

export default function HelpSupportPane({ isOpen, onClose }) {
  const [view, setView] = useState('menu');
  const leave = usePageLeaveGuard('support request');
  const guardedClose = () => leave.guard(onClose);

  // Reset to the menu whenever the pane is opened
  useEffect(() => {
    if (isOpen) setView('menu');
  }, [isOpen]);

  return (
    <SlidePane isOpen={isOpen} onClose={guardedClose}>
      {leave.dialog}
      <div className="h-full bg-background shadow-2xl flex flex-col border-l border-border">
        {/* Header */}
        {view === 'menu' ? (
          <HelpMenuHeader onClose={guardedClose} />
        ) : (
          <div className="flex items-center justify-between px-5 h-14 border-b border-border shrink-0">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => leave.guard(() => setView('menu'))}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4.5 h-4.5" />
              </button>
              <h2 className="text-sm font-semibold text-foreground">{TITLES[view]}</h2>
            </div>
            <CloseButton onClick={guardedClose} />
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {view === 'menu' && <HelpMenu onNavigate={setView} />}
          {view === 'chat' && <HelpChat />}
          {view === 'ticket' && <TicketForm onDone={() => setView('menu')} />}
          {view === 'idea' && <IdeaForm onDone={() => setView('menu')} />}
          {view === 'call' && <BookCallForm />}
        </div>

        {view === 'menu' && (
          <footer className="flex shrink-0 items-center gap-[7px] border-t border-border px-6 py-3.5 text-xs text-muted-foreground">
            <span className="h-[7px] w-[7px] rounded-full bg-emerald-500" />
            All systems operational
          </footer>
        )}
      </div>
    </SlidePane>
  );
}