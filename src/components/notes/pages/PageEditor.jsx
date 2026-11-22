import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import NoteIcon from '@/components/notes/NoteIcon';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import NoteQuillEditor from './NoteQuillEditor';
import PageMetaRow from './PageMetaRow';
import NoteTitleField from '@/components/notes/pages/NoteTitleField';
import LoaderOne from '@/components/ui/loaders/LoaderOne';

/**
 * The document surface: breadcrumb, inline title and the rich-text body.
 * Edits are held as a draft above — Save / Cancel appear only while dirty, unless the host
 * pane passes `actionsRef` to run them from its own footer (see useNoteActions).
 * With `onBack` (a note opened from a list) the breadcrumb becomes an "All notes" back
 * link, held while there are unsaved edits, and the note's `color` icon leads the title.
 */
export default function PageEditor({
  breadcrumbRoot, page, dirty, saving, onSave, onCancel,
  onTitleChange, onContentChange, onMetaChange, readOnly = false, onBack, color, actionsRef,
}) {
  const [title, setTitle] = useState(page?.title || '');
  // The editor is uncontrolled; bumping this remounts it from saved content on Cancel.
  const [resetKey, setResetKey] = useState(0);
  const handleCancel = () => { setResetKey((k) => k + 1); onCancel(); };

  useEffect(() => { setTitle(page?.title || ''); }, [page?.id, page?.title]);

  // A host footer drives Save / Cancel through `actionsRef`; kept current on every render, cleared on unmount.
  useEffect(() => {
    if (!actionsRef) return undefined;
    actionsRef.current = { save: () => (dirty ? onSave() : true), cancel: handleCancel };
    return () => { actionsRef.current = null; };
  });

  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-0">
      {/* Breadcrumb */}
      {onBack ? (
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border shrink-0 text-sm min-w-0">
          <button
            type="button"
            onClick={onBack}
            disabled={dirty}
            title={dirty ? 'Save or cancel your changes first' : undefined}
            className="flex items-center gap-1 font-semibold text-foreground hover:text-primary transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" /> All notes
          </button>
          <span className="w-px h-4 bg-border shrink-0" />
          <span className="text-foreground truncate">{title || 'Untitled'}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 px-5 py-2.5 border-b border-border shrink-0 text-xs text-muted-foreground">
          <span className="truncate max-w-[45%]">{breadcrumbRoot}</span>
          <ChevronRight className="w-3 h-3 shrink-0 opacity-60" />
          <span className="truncate text-foreground font-medium">{title || 'Untitled'}</span>
        </div>
      )}

      <div className="relative flex-1 min-h-0 flex flex-col">
      {saving && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/80 backdrop-blur-[1px]">
          <LoaderOne />
        </div>
      )}
      <div className="flex-1 min-h-0 flex flex-col px-5 pt-5" aria-busy={saving}>
        <div className="shrink-0 flex items-start gap-3">
        {(onBack || color) && <NoteIcon color={color} size={40} />}
        <div className="flex-1 min-w-0">
        {readOnly ? (
          <h2 className="text-xl font-semibold text-foreground break-words">{title || 'Untitled'}</h2>
        ) : (
          <NoteTitleField value={title} onChange={(v) => { setTitle(v); onTitleChange(v); }} />
        )}

        <PageMetaRow
          owner={page.owner_name}
          date={page.page_date}
          onOwnerChange={(owner_name) => onMetaChange({ owner_name })}
          onDateChange={(page_date) => onMetaChange({ page_date })}
          readOnly={readOnly}
        />
        </div>
        </div>

        <div className={cn('mt-3 flex-1 min-h-0 flex flex-col', readOnly && 'pointer-events-none')}>
          <NoteQuillEditor
            key={`${page.id}-${resetKey}`}
            value={page.content}
            onChange={onContentChange}
            readOnly={readOnly}
          />
        </div>
      </div>
      </div>

      {dirty && !readOnly && !actionsRef && (
        <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-2 shrink-0">
          <Button variant="outline" onClick={handleCancel} disabled={saving}>Cancel</Button>
          <Button onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      )}
    </div>
  );
}