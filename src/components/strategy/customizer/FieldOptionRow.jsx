import React, { useState } from 'react';
import { X } from 'lucide-react';
import { OPTION_COLORS } from '@/lib/registerColors';

/**
 * One option row inside an expanded field card — colour-dot picker, name input
 * and remove (omitted without `onRemove`). When `readOnly`, the dot and label render without any controls
 * (used by locked system fields such as Priority).
 */
export default function FieldOptionRow({ opt, onChange, onRemove, readOnly = false }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const colorDef = OPTION_COLORS.find((c) => c.id === opt.color) || OPTION_COLORS[0];

  return (
    <div className="flex items-center gap-2">
      <div className="relative shrink-0">
        <button
          type="button"
          disabled={readOnly}
          onClick={() => setPickerOpen((o) => !o)}
          className={`w-6 h-6 rounded-full flex items-center justify-center ${colorDef.bg} border-2 border-card shadow-sm ${readOnly ? 'cursor-default' : ''}`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${colorDef.dot}`} />
        </button>
        {pickerOpen && !readOnly && (
          <div className="animate-dropdown-enter absolute top-full mt-1 left-0 z-50 bg-popover border border-border rounded-lg shadow-lg p-2 flex gap-1.5">
            {OPTION_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onChange({ ...opt, color: c.id }); setPickerOpen(false); }}
                className={`w-5 h-5 rounded-full ${c.bg} border-2 flex items-center justify-center hover:scale-110 transition-all ${opt.color === c.id ? 'border-muted-foreground' : 'border-transparent'}`}
              >
                <span className={`w-2 h-2 rounded-full ${c.dot}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {readOnly ? (
        <div className="flex-1 h-8 rounded-md border border-input bg-secondary/40 px-2 flex items-center text-sm text-foreground">
          {opt.name}
        </div>
      ) : (
        <>
          <input
            value={opt.name}
            onChange={(e) => onChange({ ...opt, name: e.target.value })}
            placeholder="Option name"
            className="flex-1 h-8 rounded-md border border-input bg-secondary/40 px-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
          {onRemove && (
            <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </>
      )}
    </div>
  );
}