import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import { Input } from '@/components/ui/input';
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
import { levelLabel, levelEnabled, updateBlock } from '@/lib/strategy';
import { LEVELS } from '@/lib/strategyLayers';
import Level2Badge from './Level2Badge';
import OutcomesEditor from './OutcomesEditor';
import { healthStyle, HEALTH_OPTIONS } from './health';
import InitialsAvatar from '../InitialsAvatar';
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
import StrategyCustomFields from '../customFields/StrategyCustomFields';
import { getCustomColumns } from '@/lib/strategy/levelFields';
import LevelPaneTabs from '../notes/LevelPaneTabs';
import LevelNotesBody from '../notes/LevelNotesBody';
import LevelDocumentsBody from '../notes/LevelDocumentsBody';
import useLevelNotesTab from '../notes/useLevelNotesTab';

/** Right-side detail pane for a Level 3 item — clean view mode + inline edit mode. */
export default function Level3DetailPane({ item, strategy, level2Items, onClose, onSaved, onDelete, expanded, onToggleExpand, startEditing, viewOnly = false, onOpen }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [idError, setIdError] = useState('');
  const [metaErrors, setMetaErrors] = useState({});
  const [baseline, setBaseline] = useState(null);

  const levelName = levelLabel(strategy, LEVELS.PRIORITIES);
  const level2Name = levelLabel(strategy, LEVELS.THEME);
  const level2Enabled = levelEnabled(strategy, LEVELS.THEME);
  const pillar = level2Items.find((p) => p.id === item?.level2_id);

  // Edit mode is set when an item opens — a refreshed copy of the same item (after Save) keeps it.
  useEffect(() => { setEditing(!!startEditing); }, [item?.id, startEditing]);
  useEffect(() => {
    const next = item ? { ...item, owners: parseOwners(item), outcomes: item.outcomes || [] } : null;
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
    const next = validateMeta(form, { status: false });
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
        level2_id: form.level2_id || '',
        executive_sponsor: form.executive_sponsor,
        ...serializeOwners(form.owners),
        outcomes: form.outcomes,
        health: form.health || '',
        custom_fields: form.custom_fields || {}
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

  const currentHealth = form.health || '';
  const hs = healthStyle(currentHealth);
  const customCols = getCustomColumns(strategy, 3);

  return (
    <SlidePane isOpen={!!item} onClose={guard.requestClose} className={cn('bg-card shadow-2xl flex flex-col font-body', expanded && 'max-w-[1008px]')}>
      {/* Banner — non-editable Title + Health */}
      <div className="border-b border-border">
        <div className="flex items-start justify-between gap-2 px-5 pt-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <LevelIcon level={LEVELS.PRIORITIES} size="sm" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{levelName}</p>
              <h2 className="text-lg font-bold text-foreground truncate">{form.title}</h2>
            </div>
          </div>
          <PaneIconHeaderActions showEdit={!editing && !viewOnly} onEdit={() => setEditing(true)} onOpen={viewOnly ? () => onOpen?.(item) : undefined} onClose={guard.requestClose} />
        </div>
        <div className="px-5 pb-4 pt-2">
          <HealthHeaderBadge health={currentHealth} />
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
        {/* Identity — ID, Name, Description, Level 2 */}
        <SectionCard className="space-y-3">
        {editing ? (
          <BlockIdField strategyId={item.strategy_id} level={LEVELS.PRIORITIES} levelName={levelName} value={form.custom_id} onChange={set('custom_id')} error={idError} compact />
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

        {/* Level 2 */}
        {level2Enabled && level2Items.length > 0 &&
        <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{level2Name}</Label>
            {editing ?
          <Select value={form.level2_id || undefined} onValueChange={set('level2_id')}>
                <SelectTrigger className="h-9 bg-card"><SelectValue placeholder={`Select ${level2Name.toLowerCase()}...`} /></SelectTrigger>
                <SelectContent>
                  {level2Items.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select> :

          pillar ? <div><Level2Badge pillar={pillar} /></div> : <p className="text-sm text-muted-foreground">—</p>
          }
          </div>
        }
        </SectionCard>

        {/* Muted meta panel — Health is edited here */}
        <SectionCard className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Executive Sponsor</p>
            {editing ?
            <Input value={form.executive_sponsor || ''} onChange={(e) => set('executive_sponsor')(e.target.value)} className="h-8 bg-card" /> :
            <InitialsAvatar name={form.executive_sponsor} />}
          </div>
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
            <Select value={currentHealth || undefined} onValueChange={set('health')}>
                <SelectTrigger className={cn('h-8 bg-card', metaErrors.health && 'border-red-400')}><SelectValue placeholder="Select health..." /></SelectTrigger>
                <SelectContent>
                  {HEALTH_OPTIONS.map((h) =>
                <SelectItem key={h} value={h}>
                      <span className={cn('font-medium', healthStyle(h).text)}>{h}</span>
                    </SelectItem>
                )}
                </SelectContent>
              </Select> :

            currentHealth ?
            <span className={cn('text-sm font-medium', hs.text)}>{currentHealth}</span> :
            <p className="text-sm text-foreground">—</p>
            }
            {editing && metaErrors.health && <p className="text-xs text-red-500">{metaErrors.health}</p>}
          </div>
          <StrategyCustomFields
            columns={customCols}
            values={form.custom_fields || {}}
            editing={editing}
            onChange={set('custom_fields')}
          />
        </SectionCard>

        {/* Outcomes */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Outcomes (What success looks like)</p>
          {editing ?
          <OutcomesEditor outcomes={form.outcomes || []} onChange={set('outcomes')} /> :
          (form.outcomes || []).length === 0 ?
          <p className="text-sm text-muted-foreground">No outcomes added.</p> :

          <div className="space-y-2">
              {form.outcomes.map((o) =>
            <div key={o.id} className="flex items-center gap-2 bg-muted/60 rounded-lg px-3 py-2">
                  <Check className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="text-sm text-foreground">{o.text}</span>
                </div>
            )}
            </div>
          }
        </div>

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