import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import CopilotIcon from './CopilotIcon';
import CloseButton from '@/components/shared/CloseButton';
import CopilotOrb from './CopilotOrb';
import CopilotComposer from './CopilotComposer';
import CopilotMessages from './CopilotMessages';
import useCopilotStatus from './useCopilotStatus';
import CopilotHeading from './CopilotHeading';
import { followEntrance, orbEntrance } from './copilotEntrance';

const GENIE_COPY = {
  intro: 'I’m Genie, your governance co-pilot. Tell me what you need, and I’ll pull it together.',
  placeholder: 'What’s your governance wish today?',
  disclaimer: 'Genie grants wishes, not guarantees. Check important details.',
};

/** Chat pane for one copilot: a welcome screen until the first message, then the thread. Slides in from the right. */
export default function CopilotPane({ copilot, messages, onSend, onClose }) {
  const { user } = useAuth();
  const { status, sending, send } = useCopilotStatus(onSend);
  const firstName = (user?.first_name || user?.full_name?.split(' ')[0] || '').trim();
  const genie = copilot.id === 'genie';
  const empty = messages.length === 0;
  const heading = genie ? `Make a wish${firstName ? `, ${firstName}` : ''}.` : copilot.name;
  const intro = genie ? GENIE_COPY.intro : 'Send a message to get started.';
  // The composer waits for the heading only on the welcome screen.
  const follow = followEntrance(empty ? Array.from(heading).length : 0);

  return (
    <motion.aside
      role="dialog"
      aria-label={copilot.name}
      initial={{ x: '100%', opacity: 0 }}
      animate={{
        x: 0,
        opacity: 1,
        transition: { x: { duration: 0.55, ease: [0.32, 0.72, 0, 1] }, opacity: { duration: 0.35, ease: 'easeOut' } },
      }}
      exit={{
        x: '100%',
        opacity: 0,
        transition: { x: { duration: 0.45, ease: [0.32, 0.72, 0, 1] }, opacity: { duration: 0.3, ease: 'easeIn', delay: 0.1 } },
      }}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      className="fixed inset-y-0 right-0 z-[140] flex w-full max-w-[616px] flex-col border-l border-border bg-card shadow-[-12px_0_32px_-12px_rgba(14,16,20,0.18)] dark:shadow-[-12px_0_32px_-12px_rgba(0,0,0,0.6)]"
    >
      <header className="flex shrink-0 items-center gap-2.5 px-6 pb-3 pt-6">
        <CopilotIcon copilot={copilot} size={28} />
        <span className="flex-1 truncate text-base font-semibold text-foreground">{copilot.name}</span>
        <CloseButton onClick={onClose} />
      </header>

      <div className={cn('flex min-h-0 flex-1 flex-col', empty && 'overflow-y-auto py-6')}>
        <div className={cn('flex shrink-0 flex-col items-center px-7 text-center', empty && 'mt-auto')}>
          <motion.div {...orbEntrance}>
            <CopilotOrb status={status} size={empty ? 168 : 96} />
          </motion.div>
          {status === 'stuck' && (
            <p role="alert" className="mt-1 text-sm text-muted-foreground">
              That message could not be sent. Try again.
            </p>
          )}
          {empty && (
            <>
              <CopilotHeading text={heading} />
              <motion.p
                {...follow}
                className="mt-4 max-w-[360px] text-sm font-medium leading-relaxed text-foreground/75"
              >
                {intro}
              </motion.p>
            </>
          )}
        </div>
        {!empty && <CopilotMessages messages={messages} />}
        <motion.div {...follow} className={cn('shrink-0 px-7', empty ? 'mb-auto mt-7' : 'pb-3')}>
          <CopilotComposer
            copilot={copilot}
            placeholder={genie ? GENIE_COPY.placeholder : `Message ${copilot.name}`}
            sending={sending}
            onSend={send}
          />
        </motion.div>
      </div>

      {genie && (
        <p className="shrink-0 px-6 pb-6 pt-2 text-center text-xs text-muted-foreground">{GENIE_COPY.disclaimer}</p>
      )}
    </motion.aside>
  );
}