import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StrategyCapsuleTabs from '@/components/strategy/StrategyCapsuleTabs';
import ProjectCard from '@/components/programs/ProjectCard';
import ProgramBulkBar from '@/components/programs/ProgramBulkBar';
import CreateProjectModal from '@/components/programs/CreateProjectModal';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import Pagination from '@/components/shared/Pagination';
import useClientPage from '@/hooks/useClientPage';
import { deleteProjects } from '@/lib/programs/programDeletion';
import useCascadeDelete from '@/hooks/useCascadeDelete';

const TABS = [
{ id: 'active', label: 'Active' },
{ id: 'completed', label: 'Completed' },
{ id: 'archived', label: 'Archived' }];




export default function ProjectsTab({ program }) {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [selected, setSelected] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: projects = [], isLoading, ...read } = useQuery({
    queryKey: ['projects', program.id],
    queryFn: () => base44.entities.Project.filter({ program_id: program.id }),
    enabled: !!program.id
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['projects', program.id] });

  const counts = TABS.reduce((acc, t) => {
    acc[t.id] = projects.filter((p) => p.status === t.id).length;
    return acc;
  }, {});

  const filtered = projects.filter((p) => (p.status || 'active') === activeTab);
  const { pageItems, pagination } = useClientPage(filtered, activeTab);
  const isArchivedTab = activeTab === 'archived';

  const toggleOne = (id) => {
    setSelected((prev) => prev.includes(id) ? [] : [id]);
  };

  const switchTab = (id) => {setActiveTab(id);setSelected([]);};

  const handleStatusChange = async (newStatus) => {
    await Promise.all(selected.map((id) => base44.entities.Project.update(id, { status: newStatus })));
    setSelected([]);
    refresh();
  };

  const handleArchive = async () => {
    await Promise.all(selected.map((id) => base44.entities.Project.update(id, { status: 'archived' })));
    setSelected([]);
    refresh();
  };

  const del = useCascadeDelete((ids) => deleteProjects(program.id, ids), 'project');
  const handleDelete = async () => {
    const failed = await del.confirm(selected);
    setSelected(failed);
    if (!failed.length) setShowDeleteConfirm(false);
    refresh();
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">Project Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Organise your work by creating multiple projects under each program to organise and track activities and outcomes

          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-1.5 shrink-0">
          <Plus className="w-4 h-4" /> Create New Project
        </Button>
      </div>

      {/* Status tab switcher */}
      <div className="mb-5">
        <StrategyCapsuleTabs animated
          tabs={TABS.map((t) => ({ ...t, count: counts[t.id] }))}
          value={activeTab}
          onChange={switchTab} />
      </div>

      {isLoading ?
      <ModuleLoader /> :
      read.isLoadingError ?
      <LoadError failure={read} title="Couldn’t load projects" /> :
      filtered.length === 0 ?
      <div className="border border-border rounded-xl bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">No projects in this category.</p>
        </div> :

      <div className="content-enter grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {pageItems.map((p) =>
        <ProjectCard
          key={p.id}
          project={p}
          selected={selected.includes(p.id)}
          onSelect={() => toggleOne(p.id)} />

        )}
        </div>
      }
      {!isLoading && pagination && <Pagination {...pagination} />}

      {selected.length > 0 &&
      <ProgramBulkBar
        count={selected.length}
        onStatusChange={handleStatusChange}
        onArchive={handleArchive}
        onDelete={() => setShowDeleteConfirm(true)}
        onClear={() => setSelected([])}
        isArchivedTab={isArchivedTab} />

      }

      <ConfirmTypeDialog
        isOpen={showDeleteConfirm}
        title={selected.length > 1 ? `Delete ${selected.length} Projects` : 'Delete Project'}
        message="This permanently deletes the selected project(s). This action cannot be undone."
        error={del.error}
        onConfirm={handleDelete}
        onClose={() => { setShowDeleteConfirm(false); setSelected([]); del.clearError(); }} />
      

      <CreateProjectModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSaved={refresh}
        program={program} />
      
    </div>);

}