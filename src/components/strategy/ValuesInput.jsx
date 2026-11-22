import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Same 5-tint palette as single-select column options. */
export const VALUE_COLORS = [
  { id: 'blue',   bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-400'   },
  { id: 'green',  bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-400'  },
  { id: 'orange', bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-400' },
  { id: 'red',    bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-400'    },
  { id: 'purple', bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-400' },
];

/** Values entry — type + Enter creates a coloured label; click a label to pick its colour. */
export default function ValuesInput({ values = [], onChange }) {
  const [text, setText] = useState('');
  const [pickerId, setPickerId] = useState(null);

  const add = () => {
    const t = text.trim();
    if (!t) return;
    onChange([
      ...values,
      { id: crypto.randomUUID(), text: t, color: VALUE_COLORS[values.length % VALUE_COLORS.length].id },
    ]);
    setText('');
  };

  const setColor = (id, color) => {
    onChange(values.map((v) => (v.id === id ? { ...v, color } : v)));
    setPickerId(null);
  };

  const remove = (id) => onChange(values.filter((v) => v.id !== id));

  return (
    <div>
      <div className="flex items-center gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Type a value and press Enter"
          className="h-10"
        />
        <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={add}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {values.map((v) => {
            const c = VALUE_COLORS.find((x) => x.id === v.color) || VALUE_COLORS[0];
            return (
              <span
                key={v.id}
                className={cn('relative inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1', c.bg, c.text)}
              >
                <button type="button" onClick={() => setPickerId(pickerId === v.id ? null : v.id)} title="Change colour">
                  {v.text}
                </button>
                <button type="button" onClick={() => remove(v.id)} className="hover:opacity-70" title="Remove value">
                  <X className="w-3 h-3" />
                </button>
                {pickerId === v.id && (
                  <span className="animate-dropdown-enter absolute top-full mt-1 left-0 z-50 bg-popover border border-border rounded-lg shadow-lg p-2 flex gap-1.5">
                    {VALUE_COLORS.map((c2) => (
                      <button
                        key={c2.id}
                        type="button"
                        onClick={() => setColor(v.id, c2.id)}
                        className={cn(
                          'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110',
                          c2.bg,
                          v.color === c2.id ? 'border-gray-400 scale-110' : 'border-transparent'
                        )}
                      >
                        <span className={cn('w-3 h-3 rounded-full', c2.dot)} />
                      </button>
                    ))}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}