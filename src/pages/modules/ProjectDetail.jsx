import React from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import StrategyCapsuleTabs from '@/components/strategy/StrategyCapsuleTabs';
import useRecordTabCounts from '@/hooks/useRecordTabCounts';
import ProjectOverviewTab from '@/components/programs/detail/ProjectOverviewTab';
import DocumentsTab from '@/components/documents/DocumentsTab';
import NotesTab from '@/components/notes/NotesTab';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import DeliverablesTab from '@/components/programs/deliverables/DeliverablesTab';
import { projectDeliverablesApi } from '@/lib/programs/deliverablesApi';
import OwnerObligationsTab from '@/components/programs/obligations/OwnerObligationsTab';
import useOwnerObligations from '@/hooks/useOwnerObligations';
import { PROJECT_OBLIGATIONS } from '@/lib/obligationSources';

import LifecycleStatusPill from '@/components/programs/LifecycleStatusPill';
import PlannersTab from '@/components/programs/planner/PlannersTab';
import { PROJECT_PLANNERS } from '@/lib/programs/plannerSources';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'deliverables', label: 'Deliverables' },
  { id: 'planner', label: 'Planner' },
  { id: 'obligations', label: 'Obligations' },
  { id: 'documents', label: 'Documents' },
  { id: 'notes', label: 'Notes' },
];

export default function ProjectDetail() {
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

  const { data: project, isLoading, ...read } = useQuery({
    queryKey: ['project', id],
    queryFn: () => base44.entities.Project.filter({ id }),
    select: data => data?.[0],
    enabled: !!id,
  });

  const { data: program } = useQuery({
    queryKey: ['program', project?.program_id],
    queryFn: () => base44.entities.Program.filter({ id: project.program_id }),
    select: data => data?.[0],
    enabled: !!project?.program_id,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const recordCounts = useRecordTabCounts('project', id);
  const { data: deliverables } = useQuery({
    queryKey: projectDeliverablesApi.keys.list(id),
    queryFn: () => projectDeliverablesApi.list(id),
    enabled: !!id,
  });
  const { data: obligations, isLoading: obligationsLoading, ...obligationsRead } = useOwnerObligations(PROJECT_OBLIGATIONS, id);
  const counts = { ...recordCounts, deliverables: deliverables?.length, obligations: obligations?.length };

  // The live program title wins; the copy saved on the project covers a program that can't be found.
  const programTitle = program?.title || project?.program_title;

  const onUpdate = () => qc.invalidateQueries({ queryKey: ['project', id] });

  if (isLoading) {
    return <ModuleLoader fullPage />;
  }

  if (read.isLoadingError) {
    return <LoadError page failure={read} title="Couldn’t load this project" />;
  }

  if (!project) {
    if (!read.isSuccess) return <ModuleLoader fullPage />;
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Project not found.</p>
        <Link to="/programs/overview" className="text-primary text-sm mt-2 inline-block">← Back to Program Management</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <TopBarBack onClick={() => navigate(`/programs/${project.program_id}?tab=projects`)}>Back to {programTitle || 'Program'}</TopBarBack>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-foreground">{project.title}</h1>
          <LifecycleStatusPill status={project.status} />
        </div>
      </div>

      {/* Capsule Tabs */}
      <div className="mb-6 overflow-x-auto">
        <StrategyCapsuleTabs
          animated
          value={activeTab}
          onChange={setActiveTab}
          tabs={TABS.map((t) => ({ id: t.id, label: t.label, count: counts[t.id] }))}
        />
      </div>

      {/* Tab content — one panel per tab, held behind its loader then faded in whole (lib/entranceMotion) */}
      <div key={activeTab} data-entrance-panel="">
      {activeTab === 'overview' && (
        <ProjectOverviewTab project={project} programTitle={programTitle} onUpdate={onUpdate} />
      )}
      {activeTab === 'deliverables' && (
        <div className="strategy-toolbars">
          <DeliverablesTab api={projectDeliverablesApi} ownerRecord={project} onOwnerSaved={onUpdate} />
        </div>
      )}
      {activeTab === 'planner' && (
        <PlannersTab source={PROJECT_PLANNERS} ownerId={project.id} />
      )}
      {activeTab === 'obligations' && (
        <OwnerObligationsTab source={PROJECT_OBLIGATIONS} owner={project} ownerName={project.title} providerName={project.project_manager} obligations={obligations || []} isLoading={obligationsLoading} failure={obligationsRead} currentUser={currentUser} />
      )}
      {activeTab === 'documents' && (
        <DocumentsTab objectType="project" objectId={project.id} currentUser={currentUser} />
      )}
      {activeTab === 'notes' && (
        <NotesTab objectType="project" objectId={project.id} currentUser={currentUser} />
      )}
      </div>
    </div>
  );
}