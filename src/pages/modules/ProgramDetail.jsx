import React from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import StrategyCapsuleTabs from '@/components/strategy/StrategyCapsuleTabs';
import useRecordTabCounts from '@/hooks/useRecordTabCounts';
import ProgramOverviewTab from '@/components/programs/detail/ProgramOverviewTab';
import DeliverablesTab from '@/components/programs/deliverables/DeliverablesTab';
import { programDeliverablesApi } from '@/lib/programs/deliverablesApi';
import ProjectsTab from '@/components/programs/detail/ProjectsTab';
import PlannersTab from '@/components/programs/planner/PlannersTab';
import { PROGRAM_PLANNERS } from '@/lib/programs/plannerSources';
import OwnerObligationsTab from '@/components/programs/obligations/OwnerObligationsTab';
import useOwnerObligations from '@/hooks/useOwnerObligations';
import { PROGRAM_OBLIGATIONS } from '@/lib/obligationSources';
import DocumentsTab from '@/components/documents/DocumentsTab';
import NotesTab from '@/components/notes/NotesTab';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import LifecycleStatusPill from '@/components/programs/LifecycleStatusPill';
import TitleSyncStatus from '@/components/programs/detail/TitleSyncStatus';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'deliverables', label: 'Deliverables' },
  { id: 'projects', label: 'Projects' },
  { id: 'planner', label: 'Planner' },
  { id: 'obligations', label: 'Obligations' },
  { id: 'documents', label: 'Documents' },
  { id: 'notes', label: 'Notes' },
];

export default function ProgramDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const activeTab = TABS.some((t) => t.id === urlTab) ? urlTab : 'overview';

  const setActiveTab = (tab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    }, { replace: true });
  };

  const { data: program, isLoading, ...read } = useQuery({
    queryKey: ['program', id],
    queryFn: () => base44.entities.Program.filter({ id }),
    select: data => data?.[0],
    enabled: !!id,
    // While linked project titles are updating in the background, check back until done.
    refetchInterval: (query) => (query.state.data?.[0]?.title_sync_status === 'pending' ? 3000 : false),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const counts = useRecordTabCounts('program', id);
  const { data: deliverables } = useQuery({
    queryKey: programDeliverablesApi.keys.list(id),
    queryFn: () => programDeliverablesApi.list(id),
    enabled: !!id,
  });
  const deliverableCount = deliverables?.length;
  const { data: obligations, isLoading: obligationsLoading, ...obligationsRead } = useOwnerObligations(PROGRAM_OBLIGATIONS, id);

  const onUpdate = () => qc.invalidateQueries({ queryKey: ['program', id] });

  if (isLoading) {
    return <ModuleLoader fullPage />;
  }

  if (read.isLoadingError) {
    return <LoadError page failure={read} title="Couldn’t load this program" />;
  }

  if (!program) {
    if (!read.isSuccess) return <ModuleLoader fullPage />;
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Program not found.</p>
        <Link to="/programs/overview" className="text-primary text-sm mt-2 inline-block">← Back to Program Management</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back nav */}
      <TopBarBack onClick={() => navigate('/programs/overview')}>Back to Program Management</TopBarBack>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-foreground">{program.title}</h1>
          <LifecycleStatusPill status={program.status} />
          <TitleSyncStatus program={program} />
        </div>
      </div>

      {/* Capsule Tabs */}
      <div className="mb-6 overflow-x-auto">
        <StrategyCapsuleTabs
          animated
          value={activeTab}
          onChange={setActiveTab}
          tabs={TABS.map((t) => ({ id: t.id, label: t.label, count: t.id === 'deliverables' ? deliverableCount : t.id === 'obligations' ? obligations?.length : counts[t.id] }))}
        />
      </div>

      {/* Tab content — one panel per tab, held behind its loader then faded in whole (lib/entranceMotion) */}
      <div key={activeTab} data-entrance-panel="">
      {activeTab === 'overview' && (
        <ProgramOverviewTab program={program} onUpdate={onUpdate} />
      )}
      {activeTab === 'deliverables' && (
        <DeliverablesTab api={programDeliverablesApi} ownerRecord={program} onOwnerSaved={onUpdate} />
      )}
      {activeTab === 'projects' && (
        <ProjectsTab program={program} />
      )}
      {activeTab === 'planner' && (
        <PlannersTab source={PROGRAM_PLANNERS} ownerId={program.id} />
      )}
      {activeTab === 'obligations' && (
        <OwnerObligationsTab source={PROGRAM_OBLIGATIONS} owner={program} ownerName={program.title} providerName={program.program_lead} obligations={obligations || []} isLoading={obligationsLoading} failure={obligationsRead} currentUser={currentUser} />
      )}
      {activeTab === 'documents' && (
        <DocumentsTab objectType="program" objectId={program.id} currentUser={currentUser} />
      )}
      {activeTab === 'notes' && (
        <NotesTab objectType="program" objectId={program.id} currentUser={currentUser} />
      )}
      </div>
    </div>
  );
}