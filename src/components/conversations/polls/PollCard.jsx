import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import PollOption from './PollOption';
import { messageTime, isFresh } from '@/lib/conversations';
import { apiErrorMessage } from '@/lib/conversationsApi';
import { pollRules, pollHiddenNote, pollStatusLine } from '@/lib/polls';
import { cn } from '@/lib/utils';

// Longest delay a browser timer accepts; a deadline further away is picked up on the next refresh.
const MAX_TIMER_MS = 2 ** 31 - 1;
// Waits just past the deadline, so the server already counts the poll as closed when it is reloaded.
const DEADLINE_GRACE_MS = 1000;
const sameIds = (a, b) => a.length === b.length && a.every((id) => b.includes(id));

/**
 * A poll posted in a conversation. `onVote(messageId, optionIds)` and `onClose(messageId)`
 * resolve once saved; `onRefresh(messageId)` reloads the poll's latest state.
 */
export default function PollCard({ message, mine, senderName, people, actions, onVote, onClose, onRefresh }) {
  const poll = message.poll;
  const [expired, setExpired] = useState(false);
  const [picked, setPicked] = useState(poll.my_option_ids);
  const [busy, setBusy] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const recorded = poll.my_option_ids.join('|');
  useEffect(() => { setPicked(recorded ? recorded.split('|') : []); }, [recorded]);

  // At the deadline the poll locks straight away, then its results are loaded.
  useEffect(() => {
    if (poll.closed_at || !poll.closes_at) return undefined;
    const wait = new Date(poll.closes_at).getTime() - Date.now();
    if (wait > MAX_TIMER_MS) return undefined;
    const timer = setTimeout(() => { setExpired(true); onRefresh(message.id); }, Math.max(wait, 0) + DEADLINE_GRACE_MS);
    return () => clearTimeout(timer);
  }, [poll.closed_at, poll.closes_at, message.id, onRefresh]);

  const closed = !!poll.closed_at || expired;
  const voted = poll.my_option_ids.length > 0;
  const canVote = !closed && (!voted || poll.allow_change);
  const canSubmit = !busy && picked.length > 0 && !sameIds(picked, poll.my_option_ids);

  const pick = (id) => setPicked((ids) => {
    if (!poll.multiple) return [id];
    return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
  });

  const run = async (request) => {
    setBusy(true);
    try {
      await request();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Couldn’t update the poll', description: apiErrorMessage(err) });
      onRefresh(message.id);
    } finally {
      setBusy(false);
      setConfirmClose(false);
    }
  };

  return (
    <motion.div
      initial={isFresh(message.sent_at) ? { opacity: 0, y: 10, scale: 0.98 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}
    >
      {senderName && <p className="text-[13px] font-semibold text-primary mb-1 px-1">{senderName}</p>}
      <div className={cn('w-full flex items-center gap-1.5', mine && 'flex-row-reverse')}>
      <div className="flex-1 min-w-0 max-w-sm rounded-2xl overflow-hidden bg-card border border-border shadow-sm">
        <div className="bg-gradient-to-br from-poll to-poll-accent text-poll-foreground px-4 pt-3 pb-4">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
              <BarChart3 className="w-3.5 h-3.5" strokeWidth={2.2} /> Poll
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-poll-foreground/20 px-2 py-0.5 text-[11px] font-medium">
              {closed
                ? <><Lock className="w-3 h-3" /> Closed</>
                : <><span className="w-1.5 h-1.5 rounded-full bg-poll-foreground animate-pulse" /> Open</>}
            </span>
          </div>
          <p className="text-base font-semibold leading-snug mt-2 break-words">{poll.question}</p>
          <p className="text-xs text-poll-foreground/80 mt-1">{pollRules(poll)}</p>
        </div>

        <div className="p-3">
          <div role={poll.multiple ? 'group' : 'radiogroup'} aria-label={poll.question} className="space-y-2">
            {poll.options.map((option) => (
              <PollOption
                key={option.id}
                option={option}
                multiple={poll.multiple}
                selected={(canVote ? picked : poll.my_option_ids).includes(option.id)}
                interactive={canVote && !busy}
                showResults={poll.results_visible}
                voterCount={poll.voter_count}
                people={people}
                onPick={pick}
              />
            ))}
          </div>
          {!poll.results_visible && <p className="text-xs text-muted-foreground mt-2.5 px-1">{pollHiddenNote(poll)}</p>}

          {(canVote || (mine && !closed)) && (
            <div className="flex items-center justify-end gap-2 mt-3">
              {mine && (confirmClose ? (
                <span className="mr-auto flex items-center gap-1 animate-expand-enter">
                  <Button variant="ghost" size="sm" onClick={() => setConfirmClose(false)} disabled={busy}>Cancel</Button>
                  <Button variant="destructive" size="sm" onClick={() => run(() => onClose(message.id))} disabled={busy}>Close now</Button>
                </span>
              ) : (
                <Button variant="ghost" size="sm" className="mr-auto text-muted-foreground" onClick={() => setConfirmClose(true)} disabled={busy}>
                  <Lock className="w-3.5 h-3.5" /> Close poll
                </Button>
              ))}
              {canVote && (
                <Button
                  size="sm"
                  className="rounded-full px-4 bg-gradient-to-r from-poll to-poll-accent text-poll-foreground hover:opacity-90 transition-opacity"
                  onClick={() => run(() => onVote(message.id, picked))}
                  disabled={!canSubmit}
                >
                  {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {voted ? 'Update vote' : 'Vote'}
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          <span className="min-w-0 truncate">{pollStatusLine(poll, closed)}</span>
          <span className="shrink-0 tabular-nums">{messageTime(message.sent_at)}</span>
        </div>
      </div>
      {actions}
      </div>
    </motion.div>
  );
}