import { useEffect, useRef, useState } from 'react';
import { uploadDocumentFile } from '@/lib/documentStorage';

/** How long the orb shows each of Thinking and Working after a message is accepted. */
const PHASE_MS = 1400;
/** Shortest time the Sending state stays up, so it never just flickers. */
const MIN_SENDING_MS = 600;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Tracks one chat pane's send: `sending` while the message's files are stored, then the orb status.
 * A send that goes through runs thinking, working, then success; one that fails leaves the orb stuck.
 * `send(text, files)` resolves to whether the message was accepted.
 */
export default function useCopilotStatus(onSend) {
  const [status, setStatus] = useState('success');
  const [sending, setSending] = useState(false);
  const timers = useRef([]);
  const mounted = useRef(true);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimers();
    };
  }, []);

  const send = async (text, files) => {
    clearTimers();
    setSending(true);
    try {
      const [attachments] = await Promise.all([Promise.all(files.map(uploadDocumentFile)), wait(MIN_SENDING_MS)]);
      onSend({ text, attachments });
    } catch {
      setStatus('stuck');
      return false;
    } finally {
      setSending(false);
    }
    // The pane was closed while sending: the message is kept, and there is no orb left to run.
    if (!mounted.current) return true;
    setStatus('thinking');
    timers.current = [
      setTimeout(() => setStatus('working'), PHASE_MS),
      setTimeout(() => setStatus('success'), PHASE_MS * 2),
    ];
    return true;
  };

  return { status, sending, send };
}