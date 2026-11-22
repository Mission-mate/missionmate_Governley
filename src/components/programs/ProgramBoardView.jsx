import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { deletePrograms } from '@/lib/programs/programDeletion';
import useCascadeDelete from '@/hooks/useCascadeDelete';
import ProgramCard from './ProgramCard';
import ProgramBulkBar from './ProgramBulkBar';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';


export default function ProgramBoardView({ programs, onRefresh, isArchivedTab }) {
  const [selected, setSelected] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const toggleOne = (id) => {
    setSelected(prev => prev.includes(id) ? [] : [id]);
  };

  const handleStatusChange = async (newStatus) => {
    await Promise.all(selected.map(id => base44.entities.Program.update(id, { status: newStatus })));
    setSelected([]);
    onRefresh();
  };

  const handleArchive = async () => {
    await Promise.all(selected.map(id => base44.entities.Program.update(id, { status: 'archived' })));
    setSelected([]);
    onRefresh();
  };

  const del = useCascadeDelete(deletePrograms, 'program');
  const handleDelete = async () => {
    const failed = await del.confirm(selected);
    setSelected(failed);
    if (!failed.length) setShowDeleteConfirm(false);
    onRefresh();
  };

  if (programs.length === 0) {
    return <div className="py-16 text-center text-sm text-muted-foreground">No projects in this category.</div>;
  }

  return (
    <>
      <div className="content-enter grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {programs.map(p => (
          <ProgramCard
            key={p.id}
            program={p}
            selected={selected.includes(p.id)}
            onSelect={() => toggleOne(p.id)}
          />
        ))}
      </div>

      {selected.length > 0 && (
        <ProgramBulkBar
          count={selected.length}
          onStatusChange={handleStatusChange}
          onArchive={handleArchive}
          onDelete={() => setShowDeleteConfirm(true)}
          onClear={() => setSelected([])}
          isArchivedTab={isArchivedTab}
        />
      )}

      <ConfirmTypeDialog
        isOpen={showDeleteConfirm}
        title={selected.length > 1 ? `Delete ${selected.length} Programs` : 'Delete Program'}
        message="This permanently deletes the selected program(s). This action cannot be undone."
        error={del.error}
        onConfirm={handleDelete}
        onClose={() => { setShowDeleteConfirm(false); setSelected([]); del.clearError(); }}
      />
    </>
  );
}