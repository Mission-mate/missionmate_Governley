import React from 'react';
import { Link2, Unlink, CornerDownLeft } from 'lucide-react';
import ToolbarButton from './ToolbarButton';

/** Inline URL field the toolbar turns into. Enter applies, Esc cancels, empty + Enter clears. */
export default function ToolbarLinkField({ value, hasLink, onChange, onApply, onCancel, onBlur }) {
  return (
    <div className="flex-1 min-w-0 flex items-center gap-1">
      <Link2 className="w-4 h-4 ml-1.5 text-muted-foreground shrink-0" />
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); onApply(value); }
          if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onCancel(); }
        }}
        placeholder="Paste or type a link…"
        className="flex-1 min-w-0 h-7 px-1.5 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/60 outline-none"
      />
      <ToolbarButton icon={CornerDownLeft} label="Apply link" onClick={() => onApply(value)} />
      {hasLink && <ToolbarButton icon={Unlink} label="Remove link" onClick={() => onApply('')} />}
    </div>
  );
}