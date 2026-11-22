import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import { ELEVATED_CARD } from '@/components/shared/cardStyles';
import PageEditor from '@/components/notes/pages/PageEditor';
import { createNotePage, updateNotePage } from '@/lib/notePages';

const FIELDS = ['title', 'content', 'owner_name', 'page_date'];

/**
 * One record's single note page — the page document surface with no rail.
 * The page is created on first save; loadPage returns the existing page or null.
 */
export default function SinglePageDocument({
  objectType, objectId, queryKey, loadPage, defaultTitle, breadcrumbRoot,
  readOnly = false, flush = false, onDirtyChange, errorLabel = 'page', noteEntity = 'NotePage', actionsRef,
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [draft, setDraft] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: page, isLoading, isFetchedAfterMount, ...read } = useQuery({
    queryKey, queryFn: () => loadPage(objectId), enabled: !!objectId,
  });

  useEffect(() => {
    if (!isFetchedAfterMount) return;
    const snap = {
      id: page?.id || 'new', title: page?.title || defaultTitle, content: page?.content || '',
      owner_name: page?.owner_name || '', page_date: page?.page_date || '',
    };
    setBaseline(snap);
    setDraft(snap);
  }, [isFetchedAfterMount, page?.id]);

  const dirty = !readOnly && !!draft && !!baseline && FIELDS.some((k) => draft[k] !== baseline[k]);
  const onDirtyRef = useRef(onDirtyChange);
  onDirtyRef.current = onDirtyChange;
  useEffect(() => { onDirtyRef.current?.(dirty); }, [dirty]);
  useEffect(() => () => onDirtyRef.current?.(false), []);

  const handleSave = async () => {
    const snap = { ...draft };
    const fields = { title: snap.title, content: snap.content, owner_name: snap.owner_name, page_date: snap.page_date };
    setSaving(true);
    try {
      const saved = page ? await updateNotePage(page.id, fields, noteEntity) : await createNotePage(objectType, objectId, fields, noteEntity);
      setBaseline({ ...snap, id: saved.id });
      setDraft((d) => ({ ...d, id: saved.id }));
      qc.setQueryData(queryKey, saved);
      setSaving(false);
      return true;
    } catch {
      toast({ title: 'Error', description: `Failed to save the ${errorLabel}.`, variant: 'destructive' });
      setSaving(false);
      return false;
    }
  };

  return (
    <div className={cn('flex min-h-0 h-full w-full overflow-hidden bg-card', !flush && cn(ELEVATED_CARD, 'min-h-[520px]'))}>
      {isLoading || !draft ? (
        <ModuleLoader className="w-full" />
      ) : read.isLoadingError ? (
        // Never open an empty editor over a page that failed to load — saving it would create a duplicate.
        <LoadError failure={read} title="Couldn’t load this page" className="w-full shadow-none dark:ring-0" />
      ) : (
        <PageEditor
          breadcrumbRoot={breadcrumbRoot}
          actionsRef={actionsRef}
          page={draft}
          dirty={dirty}
          saving={saving}
          onSave={handleSave}
          onCancel={() => setDraft({ ...baseline })}
          onTitleChange={(title) => setDraft((d) => ({ ...d, title }))}
          onContentChange={(content) => setDraft((d) => (content === d.content ? d : { ...d, content }))}
          onMetaChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
          readOnly={readOnly}
          color="blue"
        />
      )}
    </div>
  );
}