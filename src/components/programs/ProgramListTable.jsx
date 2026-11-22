import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { deletePrograms } from '@/lib/programs/programDeletion';
import useCascadeDelete from '@/hooks/useCascadeDelete';
import { useNavigate } from 'react-router-dom';
import ProgramBulkBar from './ProgramBulkBar';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import CircleCheck from '@/components/shared/CircleCheck';
import LifecycleStatusPill from '@/components/programs/LifecycleStatusPill';
import ProgramIcon from '@/components/programs/ProgramIcon';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';



function fmtDate(d) {
  if (!d) return '–';
  try { return format(parseISO(d), 'dd MMM yyyy'); } catch { return d; }
}


export default function ProgramListTable({ programs, onRefresh, isArchivedTab }) {
  const [selected, setSelected] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();


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
    return <div className="py-16 text-center text-sm text-muted-foreground">No programs in this category.</div>;
  }


  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/40 border-b border-border">
              <th className="py-3 px-4 w-12" />
              <th className="py-3 px-4 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wide">Program Title</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wide">Program Lead</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wide">Start Date</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wide">End Date</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {programs.map(program => {
              const isSelected = selected.includes(program.id);
              return (
                <tr key={program.id} onClick={() => navigate(`/programs/${program.id}`)} className={cn('group cursor-pointer border-b border-border/60 last:border-0 hover:bg-sidebar-accent/70 transition-colors', isSelected && 'bg-primary/5 hover:bg-primary/5')}>
                  <td className="py-3.5 px-4" onClick={e => e.stopPropagation()}>
                    {!program.__isSample && (
                      <CircleCheck checked={isSelected} onChange={() => toggleOne(program.id)} />
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <ProgramIcon color={program.color} size="sm" />
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {program.title}
                      </span>
                      {program.__isSample && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 rounded-full px-1.5 py-0.5">
                          Sample
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-foreground">
                    {program.program_lead ? (
                      <div className="flex items-center gap-2">
                        <PersonInitialsAvatar name={program.program_lead} className="h-7 w-7 text-[11px]" />
                        <span>{program.program_lead}</span>
                      </div>
                    ) : '–'}
                  </td>
                  <td className="py-3.5 px-4 text-foreground">{fmtDate(program.start_date)}</td>
                  <td className="py-3.5 px-4 text-foreground">{fmtDate(program.end_date)}</td>
                  <td className="py-3.5 px-4">
                    <LifecycleStatusPill status={program.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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