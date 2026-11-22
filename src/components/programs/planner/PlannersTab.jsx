import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StrategyCapsuleTabs from '@/components/strategy/StrategyCapsuleTabs';
import ProgramBulkBar from '@/components/programs/ProgramBulkBar';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import Pagination from '@/components/shared/Pagination';
import useClientPage from '@/hooks/useClientPage';
import PlannerCard from '@/components/programs/planner/PlannerCard';
import PlannerFormPane from '@/components/programs/planner/PlannerFormPane';
import { plannersKey, listPlanners, deletePlanners } from '@/lib/programs/plannerSources';

const TABS = [
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'archived', label: 'Archived' },
];

/** Planner cards for one Program or Project — scoped strictly by `source` + `ownerId`. */
export default function PlannersTab({ source, ownerId }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active');
  const [selectedId, setSelectedId] = useState(null);
  const [pane, setPane] = useState(null); // null | { record }
  const [showDelete, setShowDelete] = useState(false);
  const E = base44.entities[source.entity];

  const { data: planners = [], isLoading, ...read } = useQuery({
    queryKey: plannersKey(source, ownerId),
    queryFn: () => listPlanners(source, ownerId),
    enabled: !!ownerId,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: plannersKey(source, ownerId) });

  const counts = Object.fromEntries(TABS.map(t => [t.id, planners.filter(p => (p.status || 'active') === t.id).length]));
  const filtered = planners.filter(p => (p.status || 'active') === activeTab);
  const { pageItems, pagination } = useClientPage(filtered, activeTab);
  const selected = planners.find(p => p.id === selectedId);

  const switchTab = (id) => { setActiveTab(id); setSelectedId(null); };
  const updateSelected = async (status) => { await E.update(selectedId, { status }); setSelectedId(null); refresh(); };
  const handleDelete = async () => { await deletePlanners(source, [selectedId]); setSelectedId(null); setShowDelete(false); refresh(); };

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">{source.heading}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Plan work, set priorities and monitor task progress.</p>
        </div>
        <Button onClick={() => setPane({ record: null })} className="gap-1.5 shrink-0">
          <Plus className="w-4 h-4" /> Create Planner
        </Button>
      </div>

      <div className="mb-5">
        <StrategyCapsuleTabs animated tabs={TABS.map(t => ({ ...t, count: counts[t.id] }))} value={activeTab} onChange={switchTab} />
      </div>

      {isLoading ? <ModuleLoader /> : read.isLoadingError ? <LoadError failure={read} title="Couldn’t load planners" /> : filtered.length === 0 ? (
        <div className="border border-border rounded-xl bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">No planners in this category.</p>
        </div>
      ) : (
        <div className="content-enter grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {pageItems.map(p => (
            <PlannerCard key={p.id} planner={p} source={source} selected={p.id === selectedId}
              onSelect={() => setSelectedId(id => (id === p.id ? null : p.id))} />
          ))}
        </div>
      )}
      {!isLoading && pagination && <Pagination {...pagination} />}

      {selected && (
        <ProgramBulkBar
          count={1}
          onOpen={() => navigate(source.detailPath(selected.id))}
          onEdit={() => setPane({ record: selected })}
          onStatusChange={updateSelected}
          onArchive={() => updateSelected('archived')}
          onDelete={() => setShowDelete(true)}
          onClear={() => setSelectedId(null)}
          isArchivedTab={activeTab === 'archived'} />
      )}

      <ConfirmTypeDialog
        isOpen={showDelete}
        title="Delete Planner"
        message="This permanently deletes the selected planner. This action cannot be undone."
        onConfirm={handleDelete}
        onClose={() => setShowDelete(false)} />

      <PlannerFormPane
        isOpen={!!pane}
        initialData={pane?.record}
        source={source}
        ownerId={ownerId}
        onClose={() => setPane(null)}
        onSaved={() => { setSelectedId(null); refresh(); }} />
    </div>
  );
}