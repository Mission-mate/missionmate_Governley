import React, { useEffect, useState } from 'react';
import { addDays, format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import PollIcon from './PollIcon';
import { Button } from '@/components/ui/button';
import MotionModal from '@/components/shared/MotionModal';
import PollQuestionStep from './PollQuestionStep';
import PollSettingsStep from './PollSettingsStep';
import { apiErrorMessage } from '@/lib/conversationsApi';
import { MIN_POLL_OPTIONS } from '@/lib/polls';
import { cn } from '@/lib/utils';

const blankDraft = () => ({
  question: '',
  options: ['', ''],
  multiple: false,
  allowChange: true,
  results: 'always',
  closing: 'manual',
  closeDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
  closeTime: '17:00',
});

/**
 * Two-step poll creation: the question and options, then a confirmation step for
 * this poll's voting, results and closing settings. `onCreate(poll)` resolves once posted.
 */
export default function CreatePollModal({ isOpen, onClose, onCreate }) {
  const [draft, setDraft] = useState(blankDraft);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setDraft(blankDraft());
    setStep(1);
    setBusy(false);
    setError('');
  }, [isOpen]);

  const set = (patch) => {
    setDraft((d) => ({ ...d, ...patch }));
    setError('');
  };

  const options = draft.options.map((o) => o.trim()).filter(Boolean);
  const canContinue = draft.question.trim().length > 0 && options.length >= MIN_POLL_OPTIONS;

  const next = () => {
    if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) {
      setError('Each option must be different.');
      return;
    }
    setStep(2);
  };

  const post = async () => {
    let closesAt = '';
    if (draft.closing === 'deadline') {
      const at = new Date(`${draft.closeDate}T${draft.closeTime}`);
      if (!(at.getTime() > Date.now())) {
        setError('Choose a closing date and time in the future.');
        return;
      }
      closesAt = at.toISOString();
    }
    setBusy(true);
    setError('');
    try {
      await onCreate({
        question: draft.question.trim(),
        options,
        multiple: draft.multiple,
        allow_change: draft.allowChange,
        results: draft.results,
        closes_at: closesAt,
      });
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <MotionModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-lg"
      title={(
        <>
          <span className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
            <PollIcon className="w-4 h-4" />
          </span>
          {step === 1 ? 'Create a poll' : 'Confirm poll settings'}
        </>
      )}
      footer={step === 1 ? (
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={next} disabled={!canContinue}>Continue</Button>
        </>
      ) : (
        <>
          <Button variant="outline" onClick={() => { setStep(1); setError(''); }} disabled={busy}>Back</Button>
          <Button onClick={post} disabled={busy}>
            {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting...</> : 'Post poll'}
          </Button>
        </>
      )}
    >
      <div className="flex gap-1.5 mb-5" aria-hidden>
        {[1, 2].map((n) => (
          <span key={n} className={cn('h-1 flex-1 rounded-full transition-colors duration-300', n <= step ? 'bg-primary' : 'bg-muted')} />
        ))}
      </div>
      {step === 1
        ? <PollQuestionStep draft={draft} set={set} />
        : <PollSettingsStep draft={draft} set={set} />}
      {error && <p className="text-sm text-destructive mt-3">{error}</p>}
    </MotionModal>
  );
}