import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import { getOrNull } from '@/lib/readState';
import ProgramIcon from '@/components/programs/ProgramIcon';
import NotesTab from '@/components/notes/NotesTab';
import DocumentsTab from '@/components/documents/DocumentsTab';
import useRecordTabCounts, { level5TaskCountKey } from '@/hooks/useRecordTabCounts';
import TaskHeaderActions from '@/components/strategy/level5/tasks/TaskHeaderActions';
import { HealthHeader } from '@/components/programs/deliverables/DeliverableBadges';
import DeliverableOverviewTab from '@/components/programs/deliverables/DeliverableOverviewTab';
import DeliverableTasksTab from '@/components/programs/deliverables/DeliverableTasksTab';
import DeliverableDataTab from '@/components/programs/deliverables/DeliverableDataTab';
import { DeliverableApiProvider } from '@/lib/programs/deliverableApiContext';
import { normalizeConfig, tracksTasks, tracksData } from '@/lib/programs/deliverableOptions';

/** Deliverable page (Program or Project owned) — Overview, Tasks & Milestones, Measures, Notes, Documents. */
export default function DeliverableWorkspace({ api }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { owner } = api;
  const [tab, setTab] = useState(() => new URLSearchParams(window.location.search).get('tab') || 'overview');

  const { data: d, isLoading, ...read } = useQuery({ queryKey: api.keys.one(id), queryFn: () => getOrNull(() => api.get(id)) });
  const ownerId = d?.[owner.ownerKey];
  const { data: ownerRecord } = useQuery({
    queryKey: [owner.kind, ownerId],
    queryFn: () => base44.entities[owner.ownerEntity].filter({ id: ownerId }),
    select: (r) => r?.[0],
    enabled: !!ownerId,
  });
  const { data: taskCount } = useQuery({ queryKey: level5TaskCountKey(id), queryFn: () => api.countTasks(id) });
  const [taskControls, setTaskControls] = useState(null);
  const { data: currentUser } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const counts = useRecordTabCounts(owner.objectType, id);
  const config = useMemo(() => normalizeConfig(ownerRecord?.deliverable_config), [ownerRecord]);

  if (isLoading) return <ModuleLoader fullPage />;
  if (read.isLoadingError) return <LoadError page failure={read} title="Couldn’t load this item" />;
  if (!d) return <div className="p-8 text-center text-muted-foreground">Item not found.</div>;

  const tabs = [
    { value: 'overview', label: 'Overview' },
    ...(tracksTasks(d) ? [{ value: 'tasks', label: 'Milestones', count: taskCount }] : []),
    ...(tracksData(d) ? [{ value: 'data', label: 'Measures' }] : []),
    { value: 'notes', label: 'Notes', count: counts.notes },
    { value: 'documents', label: 'Documents', count: counts.documents },
  ];
  const active = tabs.some((t) => t.value === tab) ? tab : 'overview';
  const onSaved = () => Promise.all([
    qc.invalidateQueries({ queryKey: api.keys.one(id) }),
    qc.invalidateQueries({ queryKey: api.keys.list(ownerId) }),
  ]);

  return (
    <DeliverableApiProvider value={api}>
      <div className="strategy-toolbars p-6 max-w-7xl mx-auto space-y-6 font-body">
        <TopBarBack onClick={() => navigate(owner.ownerPath(ownerId))}>Back to {ownerRecord?.title || (owner.kind === 'project' ? 'Project' : 'Program')}</TopBarBack>
        <div className="flex items-start gap-3 min-w-0">
          <ProgramIcon color={ownerRecord?.color} size="md" />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground truncate">{d.title}</h1>
            <div className="mt-1.5"><HealthHeader value={d.health} /></div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="overflow-x-auto"><CapsuleTabs animated tabs={tabs} value={active} onChange={setTab} /></div>
          {active === 'tasks' && taskControls && (
            <TaskHeaderActions onAdd={taskControls.addTask} onManageColumns={taskControls.manageColumns} />
          )}
        </div>

        {/* Tab content — one panel per tab, held behind its loader then faded in whole (lib/entranceMotion) */}
        <div key={active} data-entrance-panel="">
        {active === 'overview' && <DeliverableOverviewTab deliverable={d} config={config} onSaved={onSaved} />}
        {active === 'tasks' && <DeliverableTasksTab deliverable={d} onControls={setTaskControls} />}
        {active === 'data' && <DeliverableDataTab deliverable={d} />}
        {active === 'notes' && <NotesTab objectType={owner.objectType} objectId={d.id} currentUser={currentUser} />}
        {active === 'documents' && <DocumentsTab objectType={owner.objectType} objectId={d.id} currentUser={currentUser} />}
        </div>
      </div>
    </DeliverableApiProvider>
  );
}