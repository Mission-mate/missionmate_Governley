import React, { useState, useMemo, useEffect } from 'react';
import { guardAction } from '@/lib/saveGuard';
import { Plus, Search, ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import Pagination from '@/components/shared/Pagination';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import FilterCountBadge from '@/components/shared/table/FilterCountBadge';
import AssetFilterMenu from '@/components/compliance/assets/toolbar/AssetFilterMenu';
import AssetBulkBar from '@/components/compliance/assets/AssetBulkBar';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import { buildRows, credentialFilterFields, deleteCredential, setCredentialStatus, statusOf, STATUS_DOTS } from '@/lib/workforceRegister';
import { exportProfileCredentialsPdf, exportProfileCredentialsExcel } from '@/lib/workforceExport';
import ProfileCredentialsTable from './ProfileCredentialsTable';
import CredentialPane from './CredentialPane';
import WorkforceExportButton from './WorkforceExportButton';

/** A person's Credentials Register on their profile (Active / Archived). New credentials attach to `person`. */
export default function CredentialsRegisterSection({ register, person, credentials, onChanged }) {
  const [tab, setTab] = useState('Active');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedId, setSelectedId] = useState(null);
  const [pane, setPane] = useState(null); // { credential, edit }
  const [deleteOpen, setDeleteOpen] = useState(false);

  const rowsFor = (scope) => buildRows([person], credentials.filter((c) => scope === 'all' || statusOf(c) === scope), { search, filters });
  const rows = useMemo(() => rowsFor(tab), [person, credentials, tab, search, filters]); // eslint-disable-line
  const archivedCount = credentials.filter((c) => statusOf(c) === 'Archived').length;
  useEffect(() => { setPage(1); setSelectedId(null); }, [tab, search, filters, pageSize]);
  // Deep link from the Credentials tab: ?credential=<id> opens that credential's pane in view mode.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('credential');
    const c = id && credentials.find((x) => x.id === id);
    if (c) { setTab(statusOf(c)); setPane({ credential: c, edit: false }); window.history.replaceState(null, '', window.location.pathname); }
  }, [credentials]);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selected = rows.find((r) => r.id === selectedId);
  const filterFields = credentialFilterFields(register).filter((f) => f.id !== 'person_type');
  const applyFilter = (id, v) => setFilters((p) => { const n = { ...p }; if (v) n[id] = v; else delete n[id]; return n; });
  const open = (credential, edit = false) => { setSelectedId(null); setPane({ credential, edit }); };
  const handleExport = (format, scope) => {
    const scoped = scope === 'selected' ? (selected ? [selected] : []) : rowsFor(scope);
    (format === 'pdf' ? exportProfileCredentialsPdf : exportProfileCredentialsExcel)(scoped, `${person.full_name} Credentials Register`);
  };
  const handleStatus = guardAction(async (v) => { await setCredentialStatus(selectedId, v); setSelectedId(null); await onChanged(); }, 'Could not change the status');
  const handleDelete = guardAction(async () => { await deleteCredential(selectedId); setDeleteOpen(false); setSelectedId(null); await onChanged(); }, 'Could not delete the credential');
  const paneCred = pane?.credential ? credentials.find((c) => c.id === pane.credential.id) || pane.credential : null;

  return (
    <section>
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Credentials Register</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage and track licences, checks and credentials held by this person.</p>
        </div>
        <Button onClick={() => open(null)}><Plus className="w-4 h-4" /> Add Credential</Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <CapsuleTabs animated size="sm" value={tab} onChange={setTab}
          tabs={[{ value: 'Active', label: 'Active', count: credentials.length - archivedCount }, { value: 'Archived', label: 'Archived', count: archivedCount }]} />
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search credentials..."
              className="w-full pl-9 pr-3 h-9 border border-input bg-transparent text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50 rounded-[10px]" />
          </div>
          <div className="relative">
            <ToolbarButton icon={ListFilter} label="Filter" active={!!Object.keys(filters).length} badge={<FilterCountBadge count={Object.keys(filters).length} />} onClick={() => setFilterOpen((o) => !o)} />
            {filterOpen && <AssetFilterMenu fields={filterFields} activeFilters={filters} onApply={applyFilter} onClear={() => setFilters({})} onClose={() => setFilterOpen(false)} />}
          </div>
          <WorkforceExportButton selectedCount={selected ? 1 : 0} statusOptions={['Active', 'Archived']} itemLabel="credentials" onExport={handleExport} />
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <ProfileCredentialsTable rows={paged} selectedId={selectedId} onSelect={setSelectedId} onOpen={(r) => open(r)}
          emptyText={credentials.length === 0 ? 'No credentials yet — add the first one.' : 'No credentials found'} />
      </div>
      {rows.length > 0 && <Pagination page={currentPage} totalPages={totalPages} total={rows.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />}

      <CredentialPane isOpen={!!pane} onClose={() => setPane(null)} register={register} personId={person.id} personName={person.full_name}
        credential={paneCred} startInEdit={pane?.edit} onSaved={onChanged} />
      <ConfirmTypeDialog isOpen={deleteOpen} title="Delete Credential"
        message={`Permanently delete "${selected?.credential_name || 'this credential'}"? This cannot be recovered.`}
        keyword="DELETE" confirmLabel="Delete" onConfirm={handleDelete} onClose={() => setDeleteOpen(false)} />
      <AssetBulkBar count={pane ? 0 : selected ? 1 : 0} statusOptions={STATUS_DOTS} onChangeStatus={handleStatus}
        onView={() => open(selected)} onEdit={() => open(selected, true)} onDelete={() => setDeleteOpen(true)} onClear={() => setSelectedId(null)} />
    </section>
  );
}