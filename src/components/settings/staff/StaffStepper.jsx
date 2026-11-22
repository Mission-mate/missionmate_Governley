import React from 'react';

const STEPS = [{ n: 1, label: 'Details' }, { n: 2, label: 'Permissions' }];

/** Two-step Details / Permissions navigation — each step circle is clickable. */
export default function StaffStepper({ step, onStep }) {
  return (
    <div className="flex items-center justify-center gap-3 px-6 pb-4 border-b border-border shrink-0">
      {STEPS.map((s, i) => {
        const isActive = s.n === step;
        const isDone = s.n < step;
        return (
          <React.Fragment key={s.n}>
            <button type="button" onClick={() => onStep(s.n)} className="flex items-center gap-2 cursor-pointer">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                isActive ? 'bg-primary text-primary-foreground' : isDone ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {s.n}
              </div>
              <span className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
            </button>
            {i === 0 && <div className={`h-px w-10 ${step > 1 ? 'bg-primary' : 'bg-border'}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}