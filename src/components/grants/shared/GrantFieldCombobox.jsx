import React, { useState, useRef, useMemo } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Plus, Check, ChevronDown, Search, Pencil, Trash2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import ModalOverlay from '@/components/ui/ModalOverlay';
import GrantLookupEditModal from '@/components/grants/shared/GrantLookupEditModal';
import GrantLookupDeleteDialog from '@/components/grants/shared/GrantLookupDeleteDialog';
import { GRANTS_QUERY_KEY } from '@/hooks/useGrantQueries';
import { LoaderOne } from '@/components/ui/loaders';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

/** Which Grant fields cache each lookup entity. */
const LINK_FIELDS = {
  GrantProvider: { idField: 'provider_id', nameField: 'provider' },
  GrantActivity: { idField: 'activity_id', nameField: 'program' },
};

/**
 * Single-select picker for grant lookup fields (Provider / Activity).
 *
 * Follows the TagPicker pattern: the bordered field shows the committed value,
 * and clicking it opens a popover whose first row is an auto-focused search
 * input with the options listed below. Selecting an option commits
 * { id, name } and closes the popover. When the search text matches no
 * existing record, a "Confirm & Create" row appears at the bottom.
 */
export default function GrantFieldCombobox({
  entity,        // 'GrantProvider' | 'GrantActivity'
  entityLabel,   // 'provider' | 'activity' — used in copy
  value,         // committed name string
  onSelect,      // ({ id, name }) => void
  placeholder,
  inputClassName,
  error,
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [confirmName, setConfirmName] = useState(null);
  const [creating, setCreating] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [linkedCount, setLinkedCount] = useState(0);
  const inputRef = useRef(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  const { data: records = [], isLoading: loadingRecords } = useQuery({
    queryKey: [entity],
    queryFn: () => base44.entities[entity].list(),
  });

  const q = query.trim().toLowerCase();
  const sorted = useMemo(
    () => [...records].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [records]
  );
  const filtered = useMemo(
    () => sorted.filter((r) => !q || (r.name || '').toLowerCase().includes(q)),
    [sorted, q]
  );
  const exactMatch = useMemo(
    () => records.find((r) => (r.name || '').trim().toLowerCase() === q),
    [records, q]
  );

  const handleOpenChange = (next) => {
    setOpen(next);
    if (!next) setQuery('');
  };

  const commit = (rec) => {
    onSelect({ id: rec.id, name: rec.name });
    handleOpenChange(false);
  };

  // All lookup writes go through the backend function so uniqueness, atomic
  // rename propagation and delete restriction are enforced server-side, where
  // concurrent requests cannot slip past a client-side check.
  const callBackend = async (payload) => {
    try {
      const res = await base44.functions.invoke('syncGrantLookups', { entity, ...payload });
      return res.data;
    } catch (err) {
      // A rejected rule (duplicate name, still-linked delete) comes back as a
      // non-2xx status, which the SDK throws — unwrap it into the same shape.
      return err?.response?.data || { error: err?.message || 'request_failed' };
    }
  };

  const showError = (data, fallbackTitle) => {
    toast({
      title: data?.error === 'duplicate_name' ? 'Name already exists' : fallbackTitle,
      description: data?.message || data?.error || 'Please try again.',
      variant: 'destructive',
    });
  };

  const handleConfirmCreate = async () => {
    setCreating(true);
    try {
      const data = await callBackend({ action: 'create', name: confirmName });
      qc.invalidateQueries({ queryKey: [entity] });
      if (!data?.ok) {
        showError(data, `Could not create ${entityLabel}`);
        // A duplicate means the record already exists — select it for the user.
        if (data?.existing) commit(data.existing);
        setConfirmName(null);
        return;
      }
      commit(data.record);
      setConfirmName(null);
    } finally {
      setCreating(false);
    }
  };

  const { idField } = LINK_FIELDS[entity];

  const openDelete = async (rec) => {
    const linked = await base44.entities.Grant.filter({ [idField]: rec.id });
    setLinkedCount(linked.length);
    setDeleteRecord(rec);
  };

  // The rename (lookup record + every linked grant's cached name) is performed
  // server-side as one all-or-nothing operation: on any propagation failure the
  // backend rolls the whole thing back, so the UI can only ever land on
  // "fully renamed" or "nothing changed" — never a diverged middle state.
  const handleRename = async (newName) => {
    const rec = editRecord;
    const data = await callBackend({ action: 'rename', id: rec.id, name: newName });

    qc.invalidateQueries({ queryKey: [entity] });
    qc.invalidateQueries({ queryKey: GRANTS_QUERY_KEY });

    if (!data?.ok) {
      showError(data, `Could not rename ${entityLabel}`);
      return;
    }

    if (valueRef.current === rec.name) onSelect({ id: rec.id, name: data.record.name });
    setEditRecord(null);
  };

  // Deletion is blocked server-side while any grant still links to the record,
  // so a concurrently created grant cannot leave a dangling reference.
  // Business rule: REASSIGN FIRST → DELETE SECOND.
  const handleDelete = async () => {
    const rec = deleteRecord;
    const data = await callBackend({ action: 'delete', id: rec.id });

    qc.invalidateQueries({ queryKey: [entity] });

    if (!data?.ok) {
      showError(data, 'Cannot delete — still linked');
      setDeleteRecord(null);
      return;
    }

    if (valueRef.current === rec.name) onSelect({ id: '', name: '' });
    setDeleteRecord(null);
  };

  return (
    <>
      <Popover.Root open={open} onOpenChange={handleOpenChange}>
        <Popover.Anchor asChild>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setOpen(true);
              }
            }}
            className={cn(
              'flex min-h-9 w-full cursor-pointer items-center justify-between gap-2 border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm transition-[border-radius] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              open ? 'rounded-t-md rounded-b-none' : 'rounded-md',
              error && 'border-red-400',
              inputClassName
            )}
          >
            <span className={cn('truncate', !value && 'text-muted-foreground')}>
              {value || placeholder}
            </span>
            <ChevronDown className={cn('w-4 h-4 opacity-50 shrink-0 transition-transform', open && 'rotate-180')} />
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
            className="data-[state=open]:animate-dropdown-enter z-[200] w-[var(--radix-popover-trigger-width)] bg-popover text-popover-foreground border border-t-0 border-input rounded-b-md shadow-md overflow-hidden"
          >
            {/* First row — search input */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-input">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search or create ${/^[aeiou]/i.test(entityLabel) ? 'an' : 'a'} ${entityLabel}`}
                className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            {/* Options */}
            <div className="max-h-44 overflow-y-auto p-1">
              {loadingRecords && (
                <div className="flex items-center justify-center py-4"><LoaderOne size="sm" /></div>
              )}
              {!loadingRecords && filtered.map((r) => {
                const selected = value && r.name === value;
                return (
                  <div
                    key={r.id}
                    className="group flex items-center gap-1 rounded-sm pl-2 pr-1.5 text-sm hover:bg-primary/10 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => commit(r)}
                      className="flex-1 min-w-0 flex items-center gap-1.5 py-1.5 text-left"
                    >
                      <span className="truncate">{r.name}</span>
                      {selected && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                    <button
                      type="button"
                      title="Edit"
                      onClick={(e) => { e.stopPropagation(); handleOpenChange(false); setEditRecord(r); }}
                      className="p-1 rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-background/70"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      onClick={(e) => { e.stopPropagation(); handleOpenChange(false); openDelete(r); }}
                      className="p-1 rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-background/70"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
              {!loadingRecords && filtered.length === 0 && !query.trim() && (
                <p className="px-2 py-2.5 text-sm text-muted-foreground text-center">
                  No {entityLabel}s yet — type a name to add one.
                </p>
              )}
              {!loadingRecords && query.trim() && !exactMatch && (
                <button
                  type="button"
                  onClick={() => { setConfirmName(query.trim()); handleOpenChange(false); }}
                  className="flex w-full items-center gap-1.5 rounded-sm py-1.5 px-2 text-sm text-left text-muted-foreground hover:bg-primary/10 border-t border-border mt-1 pt-2"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Confirm &amp; Create "{query.trim()}"</span>
                </button>
              )}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {/* Confirm-before-create dialog */}
      <ModalOverlay isOpen={confirmName !== null} onClose={() => setConfirmName(null)} className="w-full max-w-md" overlayClassName="z-[210]">
        <div className="bg-white dark:bg-card rounded-2xl shadow-2xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-2">Create new {entityLabel}</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Create new {entityLabel}: <span className="font-semibold text-foreground">{confirmName}</span>? This will be saved for future use.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setConfirmName(null)}>Cancel</Button>
            <Button onClick={handleConfirmCreate} disabled={creating}>
              {creating ? 'Creating…' : 'Confirm'}
            </Button>
          </div>
        </div>
      </ModalOverlay>

      <GrantLookupEditModal
        isOpen={!!editRecord}
        record={editRecord}
        entityLabel={entityLabel}
        onClose={() => setEditRecord(null)}
        onSave={handleRename}
      />

      <GrantLookupDeleteDialog
        isOpen={!!deleteRecord}
        record={deleteRecord}
        entityLabel={entityLabel}
        linkedCount={linkedCount}
        onClose={() => setDeleteRecord(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}