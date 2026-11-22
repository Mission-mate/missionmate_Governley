import React, { useState, useEffect, useMemo } from 'react';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import { Input } from '@/components/ui/input';
import PaneDescriptionField from '../PaneDescriptionField';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import SlidePane from '@/components/ui/SlidePane';
import SectionCard from '@/components/shared/SectionCard';
import { base44 } from '@/api/base44Client';
import { levelLabel } from '@/lib/strategy';
import { blockIdLabel } from '@/lib/strategy/blockId';
import { useToast } from '@/components/ui/use-toast';
import { healthStyle, HEALTH_OPTIONS } from '../level3/health';
import { PRIORITY_OPTIONS, STATUS_OPTIONS, priorityStyle, statusStyle } from '../priority';
import OwnerAvatarList from '../OwnerAvatarList';
import { parseOwners } from '@/lib/strategy/ownerUtils';
import ContributesToSection from '../connections/ContributesToSection';
import HealthHeaderBadge from '../connections/HealthHeaderBadge';
import LevelIcon from '../connections/LevelIcon';
import TrackProgressSection from './tracking/TrackProgressSection';
import TrackProgressView from './tracking/TrackProgressView';
import ReportViewSwitcher from './report/ReportViewSwitcher';
import Level6ReportPanel from './report/Level6ReportPanel';
import { level6PaneTabsCompact } from './paneTabs';
import PaneExpandToggle from './PaneExpandToggle';
import PaneLoading from '../PaneLoading';
import ViewModeHint from '@/components/shared/ViewModeHint';
import PageNotesTab from '@/components/notes/pages/PageNotesTab';
import DocumentsTab from '@/components/documents/DocumentsTab';
import useRecordTabCounts from '@/hooks/useRecordTabCounts';
import StrategyCustomFields from '../customFields/StrategyCustomFields';
import { getCustomColumns, showPriority } from '@/lib/strategy/levelFields';

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
      {label}
    </p>
    {children}
  </div>
);

/** Right-side detail pane for a Level 6 item — reporting details live in Settings. */
export default function Level6DetailPane({ item, strategy, blocks = [], onClose, onSaved, onDelete, expanded, onToggleExpand, onSetExpanded, onEdit, viewOnly = false, onOpen }) {
  const editing = false;
  const [form, setForm] = useState(null);
  const [tab, setTab] = useState('overview');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);

  useEffect(() => {
    setTab('overview');
    setForm(item ? { ...item } : null);
  }, [item]);

  useEffect(() => {
    onSetExpanded?.(tab === 'completion' || tab === 'count');
  }, [tab, onSetExpanded]);

  const counts = useRecordTabCounts('strategy_deliverable', item?.id, { notes: 'pane', tasks: 'level5' });
  const tabs = useMemo(() => {
    const countFor = { completion: counts.tasks, notes: counts.notes, documents: counts.documents };
    return level6PaneTabsCompact(form).map((t) => ({ ...t, count: countFor[t.key] }));
  }, [form, counts.tasks, counts.notes, counts.documents]);

  // Fall back to Overview if the active tab is no longer available.
  useEffect(() => {
    if (!tabs.some((t) => t.key === tab)) setTab('overview');
  }, [tabs, tab]);

  if (!item) return null;
  if (!form || form.id !== item.id) return <PaneLoading onClose={onClose} expanded={expanded} />;

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const currentHealth = form.health || '';
  const hs = healthStyle(currentHealth);
  const customCols = getCustomColumns(strategy, item.level);
  const showPrio = showPriority(strategy, item.level);

  return (
    <SlidePane isOpen={!!item} onClose={onClose} className={cn('bg-card shadow-2xl flex flex-col font-body', expanded && 'max-w-[1058px]')}>
      {/* Header — Title with Health + Status underneath (consistent with other level panes) */}
      <div className="relative border-b border-border px-5 py-4">
        <PaneExpandToggle expanded={expanded} onToggle={onToggleExpand} />
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <LevelIcon level={item.level} size="sm" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{levelLabel(strategy, item.level)}</p>
                <h2 className="text-lg font-bold text-foreground truncate">{form.title}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <HealthHeaderBadge health={currentHealth} />
            </div>
            {!viewOnly && <ViewModeHint className="mt-2" />}
          </div>
          <PaneIconHeaderActions showEdit={!viewOnly} onEdit={() => onEdit?.(item)} onOpen={viewOnly ? () => onOpen?.(item) : undefined} onClose={onClose} />
        </div>
      </div>

      <div className={cn('flex-1 min-h-0', tab === 'notes' ? 'flex flex-col' : 'overflow-y-auto px-5 py-5 space-y-5')}>
        {tabs.length > 1 && (
          <div className={cn(tab === 'notes' && 'px-5 py-4 border-b border-border shrink-0')}>
            <ReportViewSwitcher animated view={tab} onChange={setTab} tabs={tabs} />
          </div>
        )}

        {tab === 'notes' && (
          <div className="flex-1 min-h-0 flex">
            <PageNotesTab key={item.id} objectType="strategy_deliverable" objectId={item.id} readOnly flush />
          </div>
        )}

        {tab === 'documents' && (
          <div className="space-y-3">
            <DocumentsTab objectType="strategy_deliverable" objectId={item.id} currentUser={currentUser} hideTitle readOnly compact />
          </div>
        )}

        {tab !== 'overview' && tab !== 'notes' && tab !== 'documents' && (
          <div className="space-y-3">
            <Level6ReportPanel
              block={item}
              view={tab}
              onViewChange={setTab}
              showSwitcher={false}
              readOnly={!editing}
            />
          </div>
        )}

        <div className={cn('space-y-3', tab !== 'overview' && 'hidden')}>
        {/* Identity — ID, Name, Description */}
        <SectionCard className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{blockIdLabel(levelLabel(strategy, item.level))}</Label>
          <p className="text-sm text-foreground">{form.custom_id || '—'}</p>
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Name</Label>
          {editing ?
          <Input value={form.title} onChange={(e) => set('title')(e.target.value)} className="bg-card" /> :
          <p className="text-sm text-foreground">{form.title}</p>}
        </div>

        {/* Description — only shown in view mode when added; always editable in edit mode */}
        <PaneDescriptionField value={form.content} onChange={set('content')} editing={editing} />
        </SectionCard>

        {/* Muted meta panel — Owner, Status, Health, Priority */}
        <SectionCard className="grid grid-cols-2 gap-4">
          <Field label="Owner">
            {editing ?
            <Input value={form.owner || ''} onChange={(e) => set('owner')(e.target.value)} className="h-8" /> :
            <OwnerAvatarList owners={parseOwners(form)} />}
          </Field>
          <Field label="Health">
            {editing ?
            <Select value={currentHealth || undefined} onValueChange={set('health')} modal={false}>
                <SelectTrigger className="h-8"><SelectValue placeholder="Select health..." /></SelectTrigger>
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
            <p className="text-sm text-foreground">—</p>}
          </Field>
          <Field label="Status">
            {editing ?
            <Select value={form.status || undefined} onValueChange={set('status')} modal={false}>
                <SelectTrigger className="h-8"><SelectValue placeholder="Select status..." /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className={cn('inline-flex items-center text-xs font-medium rounded-full px-2 py-0.5', statusStyle(s))}>{s}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select> :
            form.status ?
            <span className={cn('inline-flex items-center text-xs font-medium rounded-full px-2.5 py-0.5', statusStyle(form.status))}>{form.status}</span> :
            <p className="text-sm text-foreground">—</p>}
          </Field>
          <div className={cn(!showPrio && 'hidden')}>
          <Field label="Priority">
            {editing ?
            <Select value={form.priority || undefined} onValueChange={set('priority')} modal={false}>
                <SelectTrigger className="h-8"><SelectValue placeholder="Select priority..." /></SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      <span className={cn('inline-flex items-center text-xs font-medium rounded-full px-2 py-0.5', priorityStyle(p))}>{p}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select> :
            form.priority ?
            <span className={cn('inline-flex items-center text-xs font-medium rounded-full px-2.5 py-0.5', priorityStyle(form.priority))}>{form.priority}</span> :
            <p className="text-sm text-foreground">—</p>}
          </Field>
          </div>
          <StrategyCustomFields columns={customCols} values={form.custom_fields || {}} editing={false} />
        </SectionCard>

        {editing ? <TrackProgressSection form={form} onChange={set} /> : <TrackProgressView block={item} />}

        <ContributesToSection item={item} strategy={strategy} blocks={blocks} onSaved={onSaved} editing={editing} />
        </div>
      </div>

    </SlidePane>);

}