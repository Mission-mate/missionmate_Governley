import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PlannerWorkspace from '@/components/programs/planner/grid/PlannerWorkspace';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import LifecycleStatusPill from '@/components/programs/LifecycleStatusPill';
import ProgramIcon from '@/components/programs/ProgramIcon';
import { repairPlanner } from '@/lib/programs/plannerSources';

/** Planner landing workspace — contents to be added progressively. */
export default function PlannerDetail({ source }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: planner, isLoading, ...read } = useQuery({
    queryKey: ['planner', source.kind, id],
    // A planner left mid-setup (or an older one missing system columns) is completed before it opens.
    queryFn: async () => {
      const [found] = await base44.entities[source.entity].filter({ id });
      if (!found || found.setup_status === 'ready') return found ?? null;
      return repairPlanner(source, found.id);
    },
    enabled: !!id,
  });

  if (isLoading) return <ModuleLoader fullPage />;
  if (read.isLoadingError) return <LoadError page failure={read} title="Couldn’t load this planner" />;
  if (!planner) return <div className="p-6 text-center text-muted-foreground">Planner not found.</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <TopBarBack onClick={() => navigate(source.ownerPath(planner[source.parentField]))}>Back to {source.heading}</TopBarBack>
      <PlannerWorkspace plannerId={planner.id} header={
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <ProgramIcon color={planner.color} />
            <h1 className="text-2xl font-bold text-foreground">{planner.title}</h1>
            <LifecycleStatusPill status={planner.status} />
          </div>
          {planner.description && <p className="text-sm text-muted-foreground mt-2 max-w-3xl whitespace-pre-wrap">{planner.description}</p>}
        </div>
      } />
    </div>
  );
}