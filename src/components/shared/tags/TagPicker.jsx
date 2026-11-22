import React, { useState, useRef, useMemo } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Search, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTags } from '@/hooks/useTags';
import { getTagPillClasses } from '@/lib/tagColors';

/**
 * The app's single tag selector — used by Contacts, Members, their add forms
 * and both bulk-edit modals.
 *
 * Combobox style: selected tags render as removable pills inline inside the
 * bordered field. Clicking the field (or chevron) opens a popover whose first
 * row is an auto-focused search input, with the available tag options listed
 * below. Selecting keeps the popover open for multi-select; Esc / outside
 * click closes it.
 *
 * Selects from the existing Tag registry only (tags are created in
 * Settings → Tags Management). Emits an array of Tag IDs.
 */
export default function TagPicker({
  value = [],
  onChange,
  placeholder = 'Select tags…',
  disabled = false,
}) {
  const { tags } = useTags();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const sorted = useMemo(
    () => [...tags].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [tags]
  );

  // Only offer tags that aren't already selected.
  const available = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter(
      (t) => !value.includes(t.id) && (t.name || '').toLowerCase().includes(q)
    );
  }, [sorted, value, query]);

  const selected = useMemo(
    () => value.map((id) => sorted.find((t) => t.id === id)).filter(Boolean),
    [value, sorted]
  );

  const add = (id) => {
    onChange([...value, id]);
    setQuery('');
    inputRef.current?.focus();
  };

  const remove = (id) => onChange(value.filter((v) => v !== id));

  const handleOpenChange = (next) => {
    setOpen(next);
    if (!next) setQuery('');
  };

  return (
    <Popover.Root open={open && !disabled} onOpenChange={handleOpenChange}>
      <Popover.Anchor asChild>
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && setOpen(true)}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              setOpen(true);
            }
          }}
          className={cn(
            'flex min-h-9 w-full items-center justify-between gap-2 border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm transition-[border-radius] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            open && !disabled ? 'rounded-t-md rounded-b-none' : 'rounded-md',
            disabled ? 'opacity-50' : 'cursor-pointer'
          )}
        >
          <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0 py-0.5">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selected.map((tag) => (
                <span key={tag.id} className={cn(getTagPillClasses(tag.color), 'gap-1')}>
                  {tag.name}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); remove(tag.id); }}
                      className="hover:opacity-70 transition-opacity"
                      aria-label={`Remove ${tag.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))
            )}
          </div>
          <ChevronDown
            className={cn('w-4 h-4 opacity-50 shrink-0 transition-transform', open && !disabled && 'rotate-180')}
          />
        </div>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={0}
          avoidCollisions={false}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="data-[state=open]:animate-dropdown-enter z-[200] w-[var(--radix-popover-trigger-width)] bg-popover border border-t-0 border-input rounded-b-md shadow-md overflow-hidden"
        >
          {/* First row — search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-input">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tags…"
              className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Tag options */}
          <div className="max-h-44 overflow-y-auto p-1">
            {available.length === 0 ? (
              <p className="px-2 py-2.5 text-sm text-muted-foreground text-center">
                {tags.length === 0
                  ? 'No tags yet. Create them in Settings → Tags.'
                  : 'No matching tags.'}
              </p>
            ) : (
              available.map((tag) => (
                <div
                  key={tag.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => add(tag.id)}
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 cursor-pointer hover:bg-primary/10 transition-colors"
                >
                  <span className={getTagPillClasses(tag.color)}>{tag.name}</span>
                </div>
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}