import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import PollVoters from './PollVoters';
import { cn } from '@/lib/utils';

/** One answer of a poll: a pick control, and its share of the vote and its voters once results are on show. */
export default function PollOption({ option, multiple, selected, interactive, showResults, voterCount, people, onPick }) {
  const percent = showResults && voterCount ? Math.round((option.votes / voterCount) * 100) : 0;
  return (
    <div>
    <button
      type="button"
      role={multiple ? 'checkbox' : 'radio'}
      aria-checked={selected}
      disabled={!interactive}
      onClick={() => onPick(option.id)}
      className={cn(
        'relative w-full overflow-hidden rounded-xl border px-3 py-2.5 flex items-center gap-2.5 text-left transition-[border-color,background-color] duration-200',
        selected ? 'border-poll bg-poll/5' : 'border-border',
        interactive && !selected && 'hover:border-poll/50 hover:bg-muted/60'
      )}
    >
      {showResults && (
        <motion.span
          aria-hidden
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-poll/25 to-poll-accent/25"
        />
      )}
      <span className={cn(
        'relative w-[18px] h-[18px] shrink-0 border flex items-center justify-center transition-colors duration-200',
        multiple ? 'rounded-md' : 'rounded-full',
        selected ? 'border-transparent bg-gradient-to-br from-poll to-poll-accent text-poll-foreground' : 'border-muted-foreground/40 text-transparent'
      )}>
        <Check className="w-3 h-3" strokeWidth={3} />
      </span>
      <span className="relative flex-1 min-w-0 text-sm font-medium text-foreground break-words">{option.text}</span>
      {showResults && (
        <span className="relative shrink-0 text-xs text-muted-foreground tabular-nums">
          <span className="font-semibold text-foreground">{percent}%</span> · {option.votes}
        </span>
      )}
    </button>
    {showResults && <PollVoters option={option} people={people} />}
    </div>
  );
}