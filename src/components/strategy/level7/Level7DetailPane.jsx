import React, { useState, useEffect } from 'react';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import PaneDescriptionField from '../PaneDescriptionField';
import PaneNameField from '../PaneNameField';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import SlidePane from '@/components/ui/SlidePane';
import ViewModeHint from '@/components/shared/ViewModeHint';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import { draftEqual } from '@/lib/unsavedChanges/draftEqual';
import EditFooterActions from '@/components/shared/EditFooterActions';
import SectionCard from '@/components/shared/SectionCard';
import { levelLabel, updateBlock } from '@/lib/strategy';
import HealthHeaderBadge from '../connections/HealthHeaderBadge';
import LevelIcon from '../connections/LevelIcon';
import PaneLoading from '../PaneLoading';
import BlockIdField from '../BlockIdField';
import { blockIdLabel, isBlockIdTaken } from '@/lib/strategy/blockId';
import OwnerMultiField from '../OwnerMultiField';
import OwnerLabelHint from '../OwnerLabelHint';
import OwnerAvatarList from '../OwnerAvatarList';
import { parseOwners, serializeOwners } from '@/lib/strategy/ownerUtils';
import { validateMeta, hasErrors } from '@/lib/strategy/requiredMeta';
import StrategyCustomFields from '@/components/strategy/customFields/StrategyCustomFields';
import { getCustomColumns, showPriority } from '@/lib/strategy/levelFields';
import LevelPaneTabs from '../notes/LevelPaneTabs';
import LevelNotesBody from '../notes/LevelNotesBody';
import LevelDocumentsBody from '../notes/LevelDocumentsBody';
import useLevelNotesTab from '../notes/useLevelNotesTab';
import { HEALTH_OPTIONS, healthStyle } from '@/components/strategy/level3/health';
import { STATUS_OPTIONS, PRIORITY_OPTIONS, priorityStyle, statusStyle } from '@/components/strategy/priority';

/** Right-side detail pane for an Enablers-module item — clean view + inline edit. */
export default function Level7DetailPane({ item, strategy, onClose, onSaved, onDelete, expanded, onToggleExpand, startEditing, viewOnly = false, onOpen }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [idError, setIdError] = useState('');
  const [metaErrors, setMetaErrors] = useState({});
  const [baseline, setBaseline] = useState(null);

  const levelName = levelLabel(strategy, item?.level);

  // Edit mode is set when an item opens — a refreshed copy of the same item (after Save) keeps it.
  useEffect(() => { setEditing(!!startEditing); }, [item?.id, startEditing]);
  useEffect(() => {
    const next = item ? { ...item, owners: parseOwners(item) } : null;
    setForm(next); setBaseline(next);
  }, [item]);

  const { tab, setTab, notesDirty, setNotesDirty } = useLevelNotesTab(item?.id);
  const guard = useUnsavedChanges({
    draft: { form, notesDirty },
    baseline: { form: editing ? baseline : form, notesDirty: false },
    enabled: !!form && form.id === item?.id,
    saving, onClose, subject: 'strategy item changes',
  });

  if (!item) return null;
  if (!form || form.id !== item.id) return <PaneLoading onClose={onClose} expanded={expanded} />;

  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setMetaErrors((e) => ({ ...e, [k]: undefined })); };

  const save = async () => {
    const next = validateMeta(form);
    if (hasErrors(next)) { setMetaErrors(next); return; }
    setMetaErrors({});
    setSaving(true);
    try {
      if (await isBlockIdTaken(item.strategy_id, form.custom_id, item.id)) {
        setIdError('This ID already exists');
        return;
      }
      setIdError('');
      await updateBlock(item.id, {
        custom_id: (form.custom_id || '').trim(),
        title: form.title,
        content: form.content,
        ...serializeOwners(form.owners),
        status: form.status,
        health: form.health,
        priority: form.priority || '',
        custom_fields: form.custom_fields || {},
      });
      // Saved — back to view-only with the saved values as the new baseline.
      setBaseline(form);
      setEditing(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  // Leaving Notes with unsaved page edits prompts before the draft is discarded.
  // Cancel restores the saved values and stays in edit mode; Done (unchanged only) leaves it.
  const cancelEdit = () => { setForm(baseline); setMetaErrors({}); setIdError(''); setEditing(false); };

  const changeTab = (next) => (tab === 'notes' && notesDirty ? guard.requestClose(() => setTab(next)) : setTab(next));

  const hs = healthStyle(form.health || '');
  const customCols = getCustomColumns(strategy, item.level);
  const showPrio = showPriority(strategy, item.level);

  return (
    <SlidePane isOpen={!!item} onClose={guard.requestClose} className={cn('bg-card shadow-2xl flex flex-col font-body', expanded && 'max-w-[1008px]')}>
      {/* Banner — Title + Health */}
      <div className="border-b border-border">
        <div className="flex items-start justify-between gap-2 px-5 pt-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <LevelIcon level={item.level} size="sm" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{levelName}</p>
              <h2 className="text-lg font-bold text-foreground truncate">{form.title}</h2>
            </div>
          </div>
          <PaneIconHeaderActions showEdit={!editing && !viewOnly} onEdit={() => setEditing(true)} onOpen={viewOnly ? () => onOpen?.(item) : undefined} onClose={guard.requestClose} />
        </div>
        <div className="px-5 pb-4 pt-2">
          <HealthHeaderBadge health={form.health} />
          {!viewOnly && <ViewModeHint className="mt-2" editing={editing} />}
          <LevelPaneTabs itemId={item.id} value={tab} onChange={changeTab} />
        </div>
      </div>

      {tab === 'notes' &&
      <LevelNotesBody item={item} readOnly={!editing} onDirtyChange={setNotesDirty} onClose={guard.requestClose}
        onCancelEdit={() => guard.requestClose(cancelEdit)} formDirty={!draftEqual(form, baseline)}
        onSaved={() => (draftEqual(form, baseline) ? setEditing(false) : (setTab('overview'), save()))} />
      }
      {tab === 'documents' && <LevelDocumentsBody item={item} readOnly={!editing} onClose={guard.requestClose} onCancelEdit={cancelEdit} />}

      <div className={cn('flex-1 overflow-y-auto px-5 py-5 space-y-3', tab !== 'overview' && 'hidden')}>
        {/* Identity — ID, Name, Description */}
        <SectionCard className="space-y-3">
        {editing ? (
          <BlockIdField strategyId={item.strategy_id} level={item.level} levelName={levelName} value={form.custom_id} onChange={set('custom_id')} error={idError} compact />
        ) : (
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{blockIdLabel(levelName)}</Label>
            <p className="text-sm text-foreground">{form.custom_id || '—'}</p>
          </div>
        )}

        {/* Name */}
        <PaneNameField value={form.title} onChange={set('title')} editing={editing} />

        {/* Description — only shown in view mode when added; always editable in edit mode */}
        <PaneDescriptionField value={form.content} onChange={set('content')} editing={editing} />
        </SectionCard>

        {/* Muted meta panel — Owner, Status, Health, Priority */}
        <SectionCard className="grid grid-cols-2 gap-4">
          {editing ? (
            <OwnerMultiField value={form.owners || []} onChange={set('owners')} inputClassName="h-8" />
          ) : (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">Owner <OwnerLabelHint /></p>
              <OwnerAvatarList owners={form.owners} />
            </div>
          )}
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Health <span className="text-red-500">*</span></p>
            {editing ?
            <Select value={form.health || undefined} onValueChange={set('health')}>
                <SelectTrigger className={cn('h-8 bg-card', metaErrors.health && 'border-red-400')}><SelectValue placeholder="Select health..." /></SelectTrigger>
                <SelectContent>
                  {HEALTH_OPTIONS.map((h) =>
                <SelectItem key={h} value={h}>
                      <span className={cn('font-medium', healthStyle(h).text)}>{h}</span>
                    </SelectItem>
                )}
                </SelectContent>
              </Select> :

            form.health ?
            <span className={cn('text-sm font-medium', hs.text)}>{form.health}</span> :
            <p className="text-sm text-foreground">—</p>}
            {editing && metaErrors.health && <p className="text-xs text-red-500">{metaErrors.health}</p>}
          </div>
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status <span className="text-red-500">*</span></p>
            {editing ?
            <Select value={form.status || undefined} onValueChange={set('status')}>
                <SelectTrigger className={cn('h-8 bg-card', metaErrors.status && 'border-red-400')}><SelectValue placeholder="Select status..." /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) =>
                <SelectItem key={s} value={s}>
                      <span className={cn('inline-flex items-center text-xs font-medium rounded-full px-2 py-0.5', statusStyle(s))}>{s}</span>
                    </SelectItem>
                )}
                </SelectContent>
              </Select> :

            form.status ?
            <span className={cn('inline-flex w-fit items-center text-xs font-medium rounded-full px-2.5 py-0.5', statusStyle(form.status))}>{form.status}</span> :
            <p className="text-sm text-foreground">—</p>}
            {editing && metaErrors.status && <p className="text-xs text-red-500">{metaErrors.status}</p>}
          </div>
          <div className={cn('space-y-1.5', !showPrio && 'hidden')}>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Priority</p>
            {editing ?
            <Select value={form.priority || undefined} onValueChange={set('priority')}>
                <SelectTrigger className="h-8 bg-card"><SelectValue placeholder="Select priority..." /></SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) =>
                <SelectItem key={p} value={p}>
                      <span className={cn('inline-flex items-center text-xs font-medium rounded-full px-2 py-0.5', priorityStyle(p))}>{p}</span>
                    </SelectItem>
                )}
                </SelectContent>
              </Select> :

            form.priority ?
            <span className={cn('inline-flex w-fit items-center text-xs font-medium rounded-full px-2.5 py-0.5', priorityStyle(form.priority))}>{form.priority}</span> :
            <p className="text-sm text-foreground">—</p>}
          </div>
          <StrategyCustomFields
            columns={customCols}
            values={form.custom_fields || {}}
            editing={editing}
            onChange={set('custom_fields')}
          />
        </SectionCard>
      </div>

      {/* Edit-mode footer */}
      {editing && tab === 'overview' &&
      <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
          <EditFooterActions dirty={!draftEqual(form, baseline)} onCancel={cancelEdit} onSave={save} saving={saving} />
        </div>
      }
      {guard.dialog}
    </SlidePane>);

}