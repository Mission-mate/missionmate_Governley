import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Sleek single-select dropdown for the Risk module.
 * - Trigger matches the standard input height/border.
 * - Options hover in light grey; coloured options render as coloured pills
 *   (both in the trigger and the list) via the optional `styleFor` map/fn.
 *
 * Props:
 * - value, onChange(value)
 * - options: array of strings
 * - placeholder: shown when no value is selected
 * - styleFor: optional (option) => tailwind pill classes; when it returns a
 *   value the option is rendered as a coloured label/tag.
 * - allowClear: when true, adds a "Select..." (empty) row at the top.
 */
export default function ColoredSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  styleFor,
  allowClear = false,
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

  const pillClass = (opt) => (styleFor ? styleFor(opt) : '');

  const renderOptionLabel = (opt) => {
    const cls = pillClass(opt);
    if (cls) {
      return (
        <span className={cn('inline-flex items-center text-xs font-medium rounded-full px-2.5 py-0.5', cls)}>
          {opt}
        </span>
      );
    }
    return <span className="text-sm text-foreground">{opt}</span>;
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm flex items-center justify-between gap-2 focus:outline-none focus:ring-1 focus:ring-ring',
          className
        )}
      >
        {value ? renderOptionLabel(value) : <span className="text-muted-foreground">{placeholder}</span>}
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>

      {open && rect && createPortal(
        <div
          data-colored-select-menu
          className="animate-dropdown-enter fixed z-[200] rounded-xl border border-border bg-popover shadow-lg p-1 overflow-y-auto"
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
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-primary/10 transition-colors flex items-center"
            >
              {renderOptionLabel(opt)}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}