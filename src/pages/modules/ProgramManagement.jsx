import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LayoutGrid, List, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import CreateProgramModal from '@/components/programs/CreateProgramModal';
import ProgramBoardView from '@/components/programs/ProgramBoardView';
import ProgramListTable from '@/components/programs/ProgramListTable';
import StrategyCapsuleTabs from '@/components/strategy/StrategyCapsuleTabs';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import Pagination from '@/components/shared/Pagination';
import useClientPage from '@/hooks/useClientPage';

const TABS = [
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'archived', label: 'Archived' },
];


export default function ProgramManagement() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('active');
  const [viewMode, setViewMode] = useState('board');
  const [showCreate, setShowCreate] = useState(false);

  const { data: realPrograms = [], isLoading, ...read } = useQuery({
    queryKey: ['programs'],
    queryFn: () => base44.entities.Program.list(),
  });
  const programs = realPrograms;

  const counts = TABS.reduce((acc, t) => {
    acc[t.id] = programs.filter(p => p.status === t.id).length;
    return acc;
  }, {});

  const filtered = programs.filter(p => p.status === activeTab);
  const { pageItems, pagination } = useClientPage(filtered, `${activeTab}-${viewMode}`);

  const onRefresh = () => qc.invalidateQueries({ queryKey: ['programs'] });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Program Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage and track your organisation's programs and their projects.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create New Program
        </Button>
      </div>

      {/* Main Panel */}
      <div>
        {/* Tab + View Toggle row */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          {/* Capsule pill tabs */}
          <StrategyCapsuleTabs
            animated
            tabs={TABS.map(t => ({ ...t, count: counts[t.id] }))}
            value={activeTab}
            onChange={setActiveTab}
          />

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setViewMode('board')}
              className={cn('flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all', viewMode === 'board' ? 'bg-white dark:bg-card text-foreground font-semibold shadow-sm' : 'text-muted-foreground hover:text-foreground')}
            >
              <LayoutGrid className="w-4 h-4" /> Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all', viewMode === 'list' ? 'bg-white dark:bg-card text-foreground font-semibold shadow-sm' : 'text-muted-foreground hover:text-foreground')}
            >
              <List className="w-4 h-4" /> List
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <ModuleLoader />
        ) : read.isLoadingError ? (
          <LoadError failure={read} title="Couldn’t load programs" />
        ) : viewMode === 'board' ? (
          <ProgramBoardView programs={pageItems} onRefresh={onRefresh} isArchivedTab={activeTab === 'archived'} />
        ) : (
          <ProgramListTable programs={pageItems} onRefresh={onRefresh} isArchivedTab={activeTab === 'archived'} />
        )}
        {!isLoading && pagination && <Pagination {...pagination} />}
      </div>

      <CreateProgramModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={onRefresh}
      />
    </div>
  );
}