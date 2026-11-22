import React, { useState, useMemo, useEffect } from 'react';
import { Search, ListFilter } from 'lucide-react';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import GroupByDropdown from '@/components/board/GroupByDropdown';
import Pagination from '@/components/shared/Pagination';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import FilterCountBadge from '@/components/shared/table/FilterCountBadge';
import AssetFilterMenu from '@/components/compliance/assets/toolbar/AssetFilterMenu';
import AssetBulkBar from '@/components/compliance/assets/AssetBulkBar';
import LoaderOne from '@/components/ui/loaders/LoaderOne';
import { buildRows, groupCredentialRows, credentialFilterFields, statusOf } from '@/lib/workforceRegister';
import { exportCredentialsPdf, exportCredentialsExcel } from '@/lib/workforceExport';
import CredentialsRegisterTable from './CredentialsRegisterTable';
import CredentialPane from './CredentialPane';
import WorkforceExportButton from './WorkforceExportButton';

const GROUPS = [{ key: 'person', label: 'Person' }, { key: 'credential', label: 'Credential' }];
const CARD = 'bg-card border border-border rounded-xl overflow-hidden dark:border-transparent dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.35)] dark:ring-1 dark:ring-white/5';

/** Credentials tab: every credential across people. View only — edits happen in the person's profile. */
export default function CredentialsTab({ register, people, credentials, isLoading, onOpenInProfile }) {
  const [view, setView] = useState('Active');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [groupBy, setGroupBy] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [viewCred, setViewCred] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const archivedCount = credentials.filter((c) => statusOf(c) === 'Archived').length;
  const rowsFor = (scope) => groupCredentialRows(
    buildRows(people, credentials.filter((c) => scope === 'all' || statusOf(c) === scope), { search, filters }), groupBy).rows;
  const rows = useMemo(() => rowsFor(view), [people, credentials, view, search, filters, groupBy]); // eslint-disable-line
  useEffect(() => { setPage(1); setSelectedId(null); }, [view, search, filters, groupBy, pageSize]);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const groups = groupBy ? groupCredentialRows(paged, groupBy).groups : null;
  const selected = rows.find((r) => r.id === selectedId);
  const openView = (r) => { setSelectedId(null); setViewCred(r); };

  const applyFilter = (id, v) => setFilters((f) => { const n = { ...f }; if (v) n[id] = v; else delete n[id]; return n; });
  const handleExport = (format, scope) => {
    const scoped = rowsFor(scope);
    if (format === 'pdf') exportCredentialsPdf(groupBy ? groupCredentialRows(scoped, groupBy).groups : null, scoped, register.title);
    else exportCredentialsExcel(scoped, register.title);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <CapsuleTabs animated size="sm" value={view} onChange={setView}
          tabs={[{ value: 'Active', label: 'Active', count: credentials.length - archivedCount }, { value: 'Archived', label: 'Archived', count: archivedCount }]} />
        <div className="flex-1" />
        <div className="relative w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search people or credentials..."
            className="w-full pl-9 pr-3 h-9 border border-input bg-transparent text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50 rounded-[10px]" />
        </div>
        <GroupByDropdown options={GROUPS} value={groupBy} onChange={(k) => setGroupBy(k && k !== 'none' ? k : null)} />
        <div className="relative">
          <ToolbarButton icon={ListFilter} label="Filter" active={!!Object.keys(filters).length} badge={<FilterCountBadge count={Object.keys(filters).length} />} onClick={() => setFilterOpen((o) => !o)} />
          {filterOpen && <AssetFilterMenu fields={credentialFilterFields(register)} activeFilters={filters} onApply={applyFilter} onClear={() => setFilters({})} onClose={() => setFilterOpen(false)} />}
        </div>
        <WorkforceExportButton selectedCount={0} statusOptions={['Active', 'Archived']} itemLabel="credentials" onExport={handleExport} />
      </div>
      {isLoading ? (
        <div className="border border-border rounded-xl py-12 flex justify-center"><LoaderOne /></div>
      ) : (
        <>
          <div className={CARD}>
            <CredentialsRegisterTable rows={paged} groups={groups} selectedId={selectedId} onSelect={setSelectedId} onView={openView}
              emptyText={search || Object.keys(filters).length ? 'No credentials match your search' : `No ${view.toLowerCase()} credentials`} />
          </div>
          {rows.length > 0 && <Pagination page={currentPage} totalPages={totalPages} total={rows.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />}
        </>
      )}

      <AssetBulkBar count={selected ? 1 : 0} onView={() => openView(selected)} onClear={() => setSelectedId(null)} />
      <CredentialPane isOpen={!!viewCred} onClose={() => setViewCred(null)} register={register} personId={viewCred?.person_id}
        personName={viewCred?.person?.full_name} credential={viewCred} onOpen={() => onOpenInProfile(viewCred)} />
    </>
  );
}