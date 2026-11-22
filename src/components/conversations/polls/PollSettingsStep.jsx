import React from 'react';
import { format } from 'date-fns';
import { CircleDot, ListChecks, Eye, CheckCircle2, Lock, Hand, CalendarClock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import DateField from '@/components/ui/DateField';
import PollChoiceGroup from './PollChoiceGroup';

const VOTING = [
  { value: 'single', label: 'Single choice', description: 'Each member picks one option.', icon: CircleDot },
  { value: 'multiple', label: 'Multiple choice', description: 'Members can pick several options.', icon: ListChecks },
];
const RESULTS = [
  { value: 'always', label: 'Always', description: 'Everyone sees the running totals.', icon: Eye },
  { value: 'after_vote', label: 'After voting', description: 'Shown to a member once they vote.', icon: CheckCircle2 },
  { value: 'after_close', label: 'After closing', description: 'Hidden until the poll closes.', icon: Lock },
];
const CLOSING = [
  { value: 'manual', label: 'I’ll close it', description: 'Stays open until you close it.', icon: Hand },
  { value: 'deadline', label: 'At a set time', description: 'Closes by itself. You can still close it earlier.', icon: CalendarClock },
];

/** Step 2 of creating a poll: confirm how voting, results and closing work for this poll. */
export default function PollSettingsStep({ draft, set }) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <PollChoiceGroup
          title="How can members vote?"
          options={VOTING}
          value={draft.multiple ? 'multiple' : 'single'}
          onChange={(mode) => set({ multiple: mode === 'multiple' })}
          className="grid-cols-2"
        />
        <label className="flex items-center justify-between gap-3 rounded-xl bg-muted px-3 py-2.5 cursor-pointer">
          <span className="text-sm text-foreground">Members can change their vote</span>
          <Switch checked={draft.allowChange} onCheckedChange={(allowChange) => set({ allowChange })} />
        </label>
      </div>

      <PollChoiceGroup
        title="When are results shown?"
        options={RESULTS}
        value={draft.results}
        onChange={(results) => set({ results })}
        className="sm:grid-cols-3"
      />

      <div className="space-y-2">
        <PollChoiceGroup
          title="How does the poll close?"
          options={CLOSING}
          value={draft.closing}
          onChange={(closing) => set({ closing })}
          className="grid-cols-2"
        />
        {draft.closing === 'deadline' && (
          <div className="flex items-center gap-2 animate-expand-enter">
            <DateField
              className="flex-1"
              value={draft.closeDate}
              minDate={format(new Date(), 'yyyy-MM-dd')}
              onChange={(closeDate) => set({ closeDate })}
            />
            <Input
              type="time"
              aria-label="Closing time"
              className="w-32"
              value={draft.closeTime}
              onChange={(e) => set({ closeTime: e.target.value })}
            />
          </div>
        )}
      </div>
    </div>
  );
}