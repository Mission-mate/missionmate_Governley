import React, { useRef } from 'react';
import { cn } from '@/lib/utils';

const LENGTH = 4;

/** Four separated numeric boxes with auto-advance and backspace navigation. Masks digits when `masked`. */
export default function PinBoxes({ value = '', onChange, disabled, masked }) {
  const refs = useRef([]);
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] || '');
  const focus = (i) => refs.current[Math.max(0, Math.min(LENGTH - 1, i))]?.focus();

  const setDigit = (i, d) => {
    const next = [...digits];
    next[i] = d;
    onChange(next.join('').slice(0, LENGTH));
  };

  const handleChange = (i, e) => {
    const d = e.target.value.replace(/\D/g, '').slice(-1);
    if (!d) return;
    setDigit(i, d);
    if (i < LENGTH - 1) focus(i + 1);
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[i]) setDigit(i, '');
      else if (i > 0) { setDigit(i - 1, ''); focus(i - 1); }
    } else if (e.key === 'ArrowLeft') { e.preventDefault(); focus(i - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); focus(i + 1); }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    focus(pasted.length);
  };

  return (
    <div className="flex items-center justify-center gap-3">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type={masked ? 'password' : 'text'}
          inputMode="numeric"
          autoComplete="off"
          maxLength={1}
          aria-label={`Access code digit ${i + 1}`}
          value={d}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            'h-[3.75rem] w-[3.75rem] rounded-lg border border-input bg-card text-center text-xl font-semibold text-foreground tabular-nums',
            'transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
            'disabled:cursor-not-allowed disabled:opacity-100 disabled:text-foreground/80',
          )}
        />
      ))}
    </div>
  );
}