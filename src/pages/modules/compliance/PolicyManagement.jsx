import React, { useState, useMemo } from 'react';
import { guardAction } from '@/lib/saveGuard';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderPlus, SlidersHorizontal, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import LoaderOne from '@/components/ui/loaders/LoaderOne';
import LoadError from '@/components/shared/states/LoadError';
import RegisterSummaryCards from '@/components/compliance/registers/RegisterSummaryCards';
import CategoryManagerModal from '@/components/compliance/registers/CategoryManagerModal';
import RegisterBulkBar from '@/components/compliance/registers/RegisterBulkBar';
import DeletePolicyDialog from '@/components/compliance/policies/DeletePolicyDialog';
import PolicyTable from '@/components/compliance/policies/PolicyTable';
import PolicyToolbar from '@/components/compliance/policies/PolicyToolbar';
import PolicyFormPane from '@/components/compliance/policies/PolicyFormPane';
import PolicyCustomiserPane from '@/components/compliance/policies/PolicyCustomiserPane';
import ArchiveLinkedDialog from '@/components/compliance/policies/ArchiveLinkedDialog';
import usePolicyData from '@/hooks/usePolicyData';
import { isOverdue } from '@/lib/complianceRegisters';
import { buildTree, childrenOf, deletePolicy, setPolicyStatus, policyCategoryStore } from '@/lib/policies';

export default function PolicyManagement() {
  const navigate = useNavigate();
  const { docs, categories, types, columns, isLoading, failure, refresh } = usePolicyData();
  const [tab, setTab] = useState('active');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(null); // { doc } when open
  const [modal, setModal] = useState(null); // 'categories' | 'types' | 'delete' | 'archive'

  const live = docs.filter((d) => d.status !== 'archived');
  const overdue = live.filter(isOverdue).length;
  const tabDocs = tab === 'active' ? live : docs.filter((d) => d.status === 'archived');
  const tree = useMemo(() => buildTree(tabDocs, { search, filters }), [tabDocs, search, filters]);
  const selected = docs.find((d) => d.id === selectedId);
  const [pendingStatus, setPendingStatus] = useState(null);
  const linked = selected ? childrenOf(docs, selected.id) : [];

  const done = () => { setModal(null); setPendingStatus(null); setSelectedId(null); refresh(); };
  const changeStatus = guardAction(async (status, cascade = false) => { await setPolicyStatus(selectedId, status, cascade); done(); }, 'Could not change the status');
  const onChangeStatus = (status) => {
    if (status === selected?.status) return setSelectedId(null);
    linked.some((c) => c.status !== status) ? setPendingStatus(status) : changeStatus(status);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Policy Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Find, access and manage policy documentation all in one place.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" onClick={() => setModal('types')}><SlidersHorizontal className="w-4 h-4" /> Customise</Button>
          <Button variant="outline" onClick={() => setModal('categories')}><FolderPlus className="w-4 h-4" /> New Category</Button>
          <Button onClick={() => setForm({ doc: null })}><Plus className="w-4 h-4" /> Add New Policy</Button>
        </div>
      </div>

      <div className="mb-6"><RegisterSummaryCards total={docs.length} active={live.length} overdue={overdue} noun="Policy" nounPlural="Policies" /></div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <CapsuleTabs animated tabs={[{ value: 'active', label: 'Active', count: live.length }, { value: 'archived', label: 'Archived', count: docs.length - live.length }]}
          value={tab} onChange={(v) => { setTab(v); setSelectedId(null); }} />
        <PolicyToolbar search={search} onSearch={setSearch} filters={filters} onFilters={setFilters} types={types} categories={categories} />
      </div>

      {isLoading ? <div className="flex justify-center py-16"><LoaderOne size="lg" /></div>
        : failure.isLoadingError ? <LoadError failure={failure} title="Couldn’t load policies" />
        : docs.length === 0 ? (
          <div className="bg-card border border-border rounded-xl py-16 px-6 text-center">
            <ScrollText className="w-9 h-9 mx-auto mb-3 text-muted-foreground/50" />
            <h3 className="text-base font-semibold text-foreground">No policies yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Add your first policy document to get started.</p>
            <Button variant="outline" onClick={() => setForm({ doc: null })}>Add New Policy</Button>
          </div>
        ) : (
          <PolicyTable categories={categories} tree={tree} allDocs={tabDocs} filtering={!!search.trim() || Object.keys(filters).length > 0} columns={columns} selectedId={selectedId} onSelect={setSelectedId} />
        )}

      <RegisterBulkBar count={selectedId ? 1 : 0} onOpen={() => navigate(`/compliance/policy/${selectedId}`)}
        onEdit={() => { setForm({ doc: selected }); setSelectedId(null); }} onChangeStatus={onChangeStatus}
        onDelete={() => setModal('delete')} onClear={() => setSelectedId(null)} openLabel="Open" />

      <PolicyFormPane isOpen={!!form} doc={form?.doc} docs={docs} types={types} columns={columns} categories={categories} onClose={() => setForm(null)} onSaved={refresh} />
      <CategoryManagerModal isOpen={modal === 'categories'} onClose={() => setModal(null)} categories={categories} registers={docs} onChanged={refresh} store={policyCategoryStore} noun="policies" />
      <PolicyCustomiserPane isOpen={modal === 'types'} onClose={() => setModal(null)} types={types} columns={columns} docs={docs} onSaved={refresh} />
      <ArchiveLinkedDialog isOpen={!!pendingStatus} status={pendingStatus} count={linked.length} onChoose={(c) => changeStatus(pendingStatus, c)} onClose={() => setPendingStatus(null)} />
      <DeletePolicyDialog isOpen={modal === 'delete'} title={selected?.title} linkedCount={linked.length}
        onConfirm={guardAction(async (withChildren) => { await deletePolicy(selectedId, withChildren); done(); }, 'Could not delete the policy')} onClose={() => setModal(null)} />
    </div>
  );
}