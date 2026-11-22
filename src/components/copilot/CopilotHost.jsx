import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { orderModules } from '@/lib/modules';
import { useModules } from '@/hooks/useModules';
import { sidebarSections } from '@/components/layout/sidebarConfig';
import CopilotDock from './CopilotDock';
import CopilotPane from './CopilotPane';

const GENIE = {
  id: 'genie',
  name: 'Genie',
};

const NO_MESSAGES = [];

/** Dock tiles reuse the sidebar's solid module colours. */
const SIDEBAR_BG = Object.fromEntries(sidebarSections.map((s) => [s.id, s.iconBg]));

/** How long Space must be held before the dock opens. */
const HOLD_MS = 500;

/** Space typed into a field is text, never the dock shortcut. */
const isTyping = (target) =>
  target instanceof HTMLElement && (target.isContentEditable || Boolean(target.closest('input, textarea, select')));

/**
 * Wraps every signed-in page with the copilot dock (hold Space for 500 ms) and the chat pane a dock icon opens.
 * Genie leads; enabled modules follow in their Settings order. Conversations has no copilot.
 */
export default function CopilotHost() {
  const { enabledModules, moduleOrder } = useModules();
  const [dockOpen, setDockOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  // Messages sent this session, per copilot. Kept in memory only and never answered; attached files go to private storage.
  const [threads, setThreads] = useState({});

  const copilots = [
    GENIE,
    ...orderModules(moduleOrder)
      .filter((m) => m.id !== 'conversations' && enabledModules.includes(m.id))
      .map((m) => ({
        id: m.id,
        name: `${m.label.replace(' Management', '')} Copilot`,
        icon: m.icon,
        bg: SIDEBAR_BG[m.id],
      })),
  ];

  useEffect(() => {
    let timer = null;
    let fired = false;
    const cancel = () => {
      clearTimeout(timer);
      timer = null;
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDockOpen(false);
        return;
      }
      if (e.code !== 'Space' || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || isTyping(e.target)) return;
      if (e.repeat) {
        // Keep the held key from scrolling the page while the hold is counted.
        if (timer || fired) e.preventDefault();
        return;
      }
      cancel();
      fired = false;
      timer = setTimeout(() => {
        timer = null;
        fired = true;
        setDockOpen(true);
      }, HOLD_MS);
    };
    const onKeyUp = (e) => {
      if (e.code !== 'Space') return;
      cancel();
      // A completed hold must not also activate the focused button on release.
      if (fired) e.preventDefault();
      fired = false;
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', cancel);
    return () => {
      cancel();
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', cancel);
    };
  }, []);

  const sendMessage = (copilotId, { text, attachments }) => {
    const message = { id: crypto.randomUUID(), text, attachments };
    setThreads((prev) => ({ ...prev, [copilotId]: [...(prev[copilotId] || NO_MESSAGES), message] }));
  };

  const openCopilot = (copilot) => {
    setSelected(copilot);
    setDockOpen(false);
  };

  return (
    <>
      <Outlet />
      <CopilotDock open={dockOpen} copilots={copilots} onSelect={openCopilot} onClose={() => setDockOpen(false)} />
      <MotionConfig reducedMotion="user">
        {/* Dimmed backdrop, matching SlidePane; clicking it closes the pane. */}
        <AnimatePresence>
          {selected && (
            <motion.div
              key="copilot-backdrop"
              aria-hidden="true"
              className="fixed inset-0 z-[139] bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              onClick={() => setSelected(null)}
            />
          )}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          {selected && (
            <CopilotPane
              key={selected.id}
              copilot={selected}
              messages={threads[selected.id] || NO_MESSAGES}
              onSend={(message) => sendMessage(selected.id, message)}
              onClose={() => setSelected(null)}
            />
          )}
        </AnimatePresence>
      </MotionConfig>
    </>
  );
}