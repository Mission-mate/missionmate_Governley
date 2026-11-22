import React from 'react';
import { OPTION_COLORS } from '@/lib/registerColors';
import OptionBadge from '@/components/board/registers/OptionBadge';
import { STATUS_STYLES, PRIORITY_STYLES } from '@/lib/meetingActionApi';

/** Fallback badge tone for unmapped values — theme-aware. */
const NEUTRAL_BADGE = { bg: 'bg-muted', text: 'text-muted-foreground' };

export function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES['Not Started'];
  return <OptionBadge label={status} bg={s.bg} text={s.text} />;
}

export function PriorityBadge({ priority }) {
  if (!priority) return null;
  const s = PRIORITY_STYLES[priority] || NEUTRAL_BADGE;
  return <OptionBadge label={priority} bg={s.bg} text={s.text} />;
}

function optionStyle(opt) {
  const def = OPTION_COLORS.find((c) => c.id === (typeof opt === 'object' ? opt.color : null));
  return def ? { bg: def.bg, text: def.text } : NEUTRAL_BADGE;
}

/** Renders a custom field's stored value, styling select options as colored badges */
export function CustomFieldCell({ field, rawVal }) {
  if (!rawVal) return <span className="text-muted-foreground/50">—</span>;
  const options = field.config?.options || [];

  if (field.type === 'Single Select') {
    const opt = options.find((o) => (typeof o === 'object' ? o.name : o) === rawVal);
    const s = opt ? optionStyle(opt) : NEUTRAL_BADGE;
    return <OptionBadge label={rawVal} bg={s.bg} text={s.text} />;
  }

  if (field.type === 'Multi Select') {
    let names = [];
    try { names = JSON.parse(rawVal); } catch { names = [rawVal]; }
    if (!Array.isArray(names)) names = [names];
    return (
      <div className="flex flex-wrap gap-1">
        {names.map((name, i) => {
          const opt = options.find((o) => (typeof o === 'object' ? o.name : o) === name);
          const s = opt ? optionStyle(opt) : NEUTRAL_BADGE;
          return <OptionBadge key={i} label={name} bg={s.bg} text={s.text} />;
        })}
      </div>
    );
  }

  return <span>{rawVal}</span>;
}