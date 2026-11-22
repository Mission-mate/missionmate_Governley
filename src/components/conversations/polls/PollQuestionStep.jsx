import React from 'react';
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MIN_POLL_OPTIONS, MAX_POLL_OPTIONS } from '@/lib/polls';

/** Step 1 of creating a poll: the question and its answer options. */
export default function PollQuestionStep({ draft, set }) {
  const setOption = (index, text) => set({ options: draft.options.map((o, i) => (i === index ? text : o)) });
  const removeOption = (index) => set({ options: draft.options.filter((_, i) => i !== index) });

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="poll-question">Question <span className="text-destructive">*</span></Label>
        <Input
          id="poll-question"
          autoFocus
          value={draft.question}
          maxLength={300}
          placeholder="e.g. Which day suits the planning session?"
          onChange={(e) => set({ question: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Options <span className="text-destructive">*</span></Label>
        <div className="space-y-2">
          {draft.options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center shrink-0 tabular-nums">
                {index + 1}
              </span>
              <Input
                value={option}
                maxLength={120}
                placeholder={`Option ${index + 1}`}
                aria-label={`Option ${index + 1}`}
                onChange={(e) => setOption(index, e.target.value)}
              />
              {draft.options.length > MIN_POLL_OPTIONS && (
                <button
                  type="button"
                  title="Remove option"
                  onClick={() => removeOption(index)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                  <span className="sr-only">Remove option</span>
                </button>
              )}
            </div>
          ))}
        </div>
        {draft.options.length < MAX_POLL_OPTIONS && (
          <button
            type="button"
            onClick={() => set({ options: [...draft.options, ''] })}
            className="mt-2 w-full h-9 rounded-md border border-dashed border-border text-sm font-medium text-muted-foreground flex items-center justify-center gap-1.5 hover:border-primary/50 hover:text-primary transition-colors duration-200"
          >
            <Plus className="w-4 h-4" /> Add option
          </button>
        )}
      </div>
    </div>
  );
}