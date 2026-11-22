import React, { useState, useMemo } from 'react';
import { guardAction } from '@/lib/saveGuard';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, FolderPlus, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import RegisterSummaryCards from '@/components/compliance/registers/RegisterSummaryCards';
import RegisterTable from '@/components/compliance/registers/RegisterTable';
import RegisterFormPane from '@/components/compliance/registers/RegisterFormPane';
import CategoryManagerModal from '@/components/compliance/registers/CategoryManagerModal';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import RegisterBulkBar from '@/components/compliance/registers/RegisterBulkBar';
import LoaderOne from '@/components/ui/loaders/LoaderOne';
import LoadError from '@/components/shared/states/LoadError';
import { loadFailure } from '@/lib/readState';
import { getCategories, listRegisters, deleteRegisters, setRegisterStatus, isOverdue } from '@/lib/complianceRegisters';
import useCascadeDelete from '@/hooks/useCascadeDelete';
import { useLocalToday } from '@/components/LocalDayProvider';

const TABS = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
];

export default function ComplianceRegisters() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState('active');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDelete, setBulkDelete] = useState(false);
  const [collapsed, setCollapsed] = useState({});
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const del = useCascadeDelete(deleteRegisters, 'register');

  const { data: categories = [], ...categoriesRead } = useQuery({
    queryKey: ['complianceRegisterCategories'],
    queryFn: getCategories,
  });
  const { data: registers = [], isLoading, ...registersRead } = useQuery({
    queryKey: ['complianceManagedRegisters'],
    queryFn: listRegisters,
  });
  const failure = loadFailure(categoriesRead, registersRead);

  const refetch = () => {
    qc.invalidateQueries({ queryKey: ['complianceManagedRegisters'] });
    qc.invalidateQueries({ queryKey: ['complianceRegisterCategories'] });
  };

  const day = useLocalToday();
  const metrics = useMemo(() => {
    const live = registers.filter((r) => r.status !== 'archived');
    const overdue = live.filter(isOverdue).length;
    return {
      total: registers.length,
      active: live.length,
      overdue,
      atRisk: overdue > 0,
    };
  }, [registers, day]);

  const tabRegisters = registers.filter((r) =>
    tab === 'archived' ? r.status === 'archived' : r.status !== 'archived'
  );

  const toggleCategory = (cat) => setCollapsed((p) => ({ ...p, [cat]: !p[cat] }));

  const toggleSelect = (id) =>
    setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const selectedRegisters = registers.filter((r) => selectedIds.includes(r.id));

  const handleChangeStatus = guardAction(async (status) => {
    await Promise.all(selectedIds.map((id) => setRegisterStatus(id, status)));
    setSelectedIds([]);
    refetch();
  }, 'Could not change the status');

  const handleBulkDelete = async () => {
    // Registers that could not be fully removed stay selected so the dialog can retry them.
    const failed = await del.confirm(selectedIds);
    setSelectedIds(failed);
    if (!failed.length) setBulkDelete(false);
    refetch();
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Register Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create, manage and maintain organizational registers in one central workspace.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" onClick={() => setCategoryOpen(true)}>
            <FolderPlus className="w-4 h-4" /> New Category
          </Button>
          <Button onClick={() => { setEditTarget(null); setFormOpen(true); }}>
            <Plus className="w-4 h-4" /> Add New Register
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <RegisterSummaryCards total={metrics.total} active={metrics.active} overdue={metrics.overdue} />
      </div>

      <div className="mb-4">
        <CapsuleTabs animated
          tabs={[
            { ...TABS[0], count: metrics.active },
            { ...TABS[1], count: metrics.total - metrics.active },
          ]}
          value={tab} onChange={setTab} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoaderOne size="lg" />
        </div>
      ) : failure.isLoadingError ? (
        <LoadError failure={failure} title="Couldn’t load registers" />
      ) : tabRegisters.length === 0 && categories.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 px-6 text-center">
          <ClipboardList className="w-9 h-9 mx-auto mb-3 text-muted-foreground/50" />
          <h3 className="text-base font-semibold text-foreground">No registers yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Add a category and your first register to get started.</p>
          <Button variant="outline" onClick={() => { setEditTarget(null); setFormOpen(true); }}>Add New Register</Button>
        </div>
      ) : (
        <RegisterTable
          categories={categories}
          registers={tabRegisters}
          collapsed={collapsed}
          onToggleCategory={toggleCategory}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
        />
      )}

      <RegisterBulkBar
        count={selectedIds.length}
        onOpen={() => navigate(`/compliance/registers/${selectedIds[0]}`)}
        onEdit={() => { setEditTarget(selectedRegisters[0]); setSelectedIds([]); }}
        onChangeStatus={handleChangeStatus}
        onDelete={() => setBulkDelete(true)}
        onClear={() => setSelectedIds([])}
      />
      <ConfirmTypeDialog
        isOpen={bulkDelete}
        title={selectedIds.length > 1 ? 'Delete Registers' : 'Delete Register'}
        message={`This will permanently delete ${selectedIds.length} register${selectedIds.length > 1 ? 's' : ''} and every record inside ${selectedIds.length > 1 ? 'them' : 'it'}, including linked notes and documents. This action cannot be undone.`}
        keyword="DELETE"
        confirmLabel="Delete"
        error={del.error}
        onConfirm={handleBulkDelete}
        onClose={() => { setBulkDelete(false); del.clearError(); }}
      />

      <RegisterFormPane
        isOpen={formOpen || !!editTarget}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
        onSaved={(created) => {
          refetch();
          if (['asset', 'information_asset', 'whs', 'gifts_hospitality', 'conflict_of_interest'].includes(created?.register_type)) navigate(`/compliance/registers/${created.id}`);
        }}
        categories={categories}
        register={editTarget}
      />
      <CategoryManagerModal
        isOpen={categoryOpen}
        onClose={() => setCategoryOpen(false)}
        categories={categories}
        registers={registers}
        onChanged={refetch}
      />
    </div>
  );
}