import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { OPTION_COLORS } from '@/lib/registerColors';
import { cn } from '@/lib/utils';

/**
 * Shared single-select dropdown for register-style "Single Select" fields whose
 * options carry an OPTION_COLORS tint. The selected option renders as its
 * coloured badge inside the trigger so edit mode matches view mode.
 *
 * Props:
 * - value, onChange(value)
 * - options: array of { name, color } (register field config format)
 * - placeholder: shown when no value is selected (also the clear row label)
 * - disabled, invalid: match the standard form-field states
 * - allowClear: adds an empty "Select..." row at the top (default true)
 */
export default function ColoredSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  disabled = false,
  invalid = false,
  allowClear = true,
  className,
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target) && !e.target.closest('[data-colored-select-menu]')) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const renderLabel = (name) => {
    const opt = options.find((o) => o.name === name);
    // `tone` ({ dot }) renders plain text with a leading coloured dot (e.g. risk-matrix levels).
    const tone = opt?.tone;
    if (tone) {
      return (
        <span className="inline-flex items-center gap-2 text-sm text-foreground">
          <span className={cn('w-2 h-2 rounded-full shrink-0', tone.dot)} />
          {name}
        </span>
      );
    }
    const c = opt ? OPTION_COLORS.find((c) => c.id === opt.color) : null;
    // Only options with a mapped colour render as a pill badge. Colourless
    // options (e.g. Category, Target Month) render as plain text, matching how
    // they read in view mode and the table.
    if (c) {
      return (
        <span className={cn('inline-flex items-center text-xs font-medium rounded px-2 py-0.5', c.bg, c.text)}>
          {name}
        </span>
      );
    }
    return <span className="text-sm text-foreground">{name}</span>;
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'h-9 w-full rounded-md border bg-white px-3 text-sm flex items-center justify-between gap-2 focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-70 disabled:cursor-not-allowed',
          invalid ? 'border-destructive' : 'border-input',
          className
        )}
      >
        {value ? renderLabel(value) : <span className="text-muted-foreground">{placeholder}</span>}
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>

      {open && rect && createPortal(
        <div
          data-colored-select-menu
          className="animate-dropdown-enter fixed z-[200] rounded-xl border border-border bg-white dark:bg-card shadow-lg p-1 overflow-y-auto"
          style={{ top: rect.bottom + 4, left: rect.left, width: rect.width, maxHeight: `${Math.max(160, window.innerHeight - rect.bottom - 16)}px` }}
        >
          {allowClear && (
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className="w-full text-left px-2.5 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-primary/10 transition-colors"
            >
              {placeholder}
            </button>
          )}
          {options.map((o) => (
            <button
              key={o.name}
              type="button"
              onClick={() => { onChange(o.name); setOpen(false); }}
              className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-primary/10 transition-colors flex items-center"
            >
              {renderLabel(o.name)}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}