import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import LoaderOne from '@/components/ui/loaders/LoaderOne';
import LoadError from '@/components/shared/states/LoadError';
import Pagination from '@/components/shared/Pagination';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import { pickFields, invalidateWhsRegister } from '@/lib/whsApi';
import LinkedRecordsTable from './LinkedRecordsTable';
import LinkedBulkBar from './LinkedBulkBar';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import WhsFormPane from './WhsFormPane';

/**
 * Register-style table of records linked to a WHS source (controls or actions).
 * `link` is merged into every create and scopes the list query. `statusTabs` adds a switcher on `tabKey`;
 * `stages` adds a Change Stage menu to the floating bar.
 */
export default function HazardLinkedSection({ entityName, link, createExtra = {}, noun, title, subtitle, fields, columns, statuses, stages, newDefaults, displayKey, statusTabs, tabKey = 'status', focusId }) {
  const qc = useQueryClient();
  const entity = base44.entities[entityName];
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [statusTab, setStatusTab] = useState(statusTabs ? 'All' : undefined);
  const query = statusTab && statusTab !== 'All' ? { ...link, [tabKey]: statusTab } : link;
  const { data: tabCounts = {} } = useQuery({
    queryKey: ['whsLinked', entityName, link, 'tabCounts'],
    enabled: !!statusTabs,
    queryFn: async () => Object.fromEntries(await Promise.all(statusTabs.map(async (s) => [s, await entity.count({ ...link, [tabKey]: s })]))),
  });
  const { data, isLoading, ...read } = useQuery({
    queryKey: ['whsLinked', entityName, query, page, pageSize],
    queryFn: async () => {
      // Walk cursors to the requested page (pages are small; linked sets rarely exceed one page).
      let cursor;
      let res;
      for (let p = 1; p <= page; p += 1) {
        res = await entity.filter(query, { sort: 'created_date', limit: pageSize, cursor });
        if (!res.has_more) break;
        cursor = res.next_cursor;
      }
      return { rows: res.items, total: await entity.count(query) };
    },
  });
  const rows = data?.rows || [];
  const total = data?.total || 0;
  const [pane, setPane] = useState(null); // { record?, initial, readOnly }
  const [selected, setSelected] = useState([]);
  const [deleting, setDeleting] = useState(null); // records[]
  const [processing, setProcessing] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['whsLinked', entityName] });
    invalidateWhsRegister(qc);
  };
  const view = (r) => setPane({ record: r, initial: r, readOnly: true });
  const edit = (r) => setPane({ record: r, initial: r, readOnly: false });
  const selectedRows = rows.filter((r) => selected.includes(r.id));

  // Deep link (?action=<id>): open that record's edit pane once it loads, then drop the param.
  useEffect(() => {
    if (!focusId) return;
    entity.get(focusId).then((r) => {
      if (r && r.source_id === link.source_id) { setStatusTab(r[tabKey]); edit(r); }
      window.history.replaceState(null, '', window.location.pathname);
    });
  }, [focusId]);

  const save = async (draft) => {
    const clean = pickFields(fields, draft);
    if (pane.record) await entity.update(pane.record.id, clean);
    else await entity.create({ ...clean, ...createExtra, ...link });
    refresh();
    setPane(null);
  };
  const changeField = async (key, value) => {
    setProcessing(true);
    await Promise.all(selected.map((id) => entity.update(id, { [key]: value })));
    setProcessing(false);
    setSelected([]);
    refresh();
  };
  const remove = async () => {
    await Promise.all(deleting.map((r) => entity.delete(r.id)));
    setSelected([]);
    setDeleting(null);
    refresh();
  };

  return (
    <section>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <Button onClick={async () => setPane({ initial: await newDefaults(), readOnly: false })} className="shrink-0">
          <Plus className="w-4 h-4" /> Add {noun}
        </Button>
      </div>
      {statusTabs && (
        <CapsuleTabs animated className="mb-4" value={statusTab}
          onChange={(s) => { setStatusTab(s); setPage(1); setSelected([]); }}
          tabs={[
            { value: 'All', label: 'All', count: statusTabs.reduce((n, s) => n + (tabCounts[s] || 0), 0) },
            ...statusTabs.map((s) => ({ value: s, label: s, count: tabCounts[s] })),
          ]} />
      )}
      <div className="rounded-xl border border-border bg-card">
        {isLoading ? <div className="py-12 flex justify-center"><LoaderOne /></div> : read.isLoadingError ? (
          <LoadError failure={read} className="shadow-none dark:ring-0" />
        ) : rows.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No {title.toLowerCase()} added yet.</p>
        ) : (
          <LinkedRecordsTable columns={columns} rows={rows} selected={selected} onOpen={view}
            onToggleOne={(id) => setSelected((s) => (s.includes(id) ? [] : [id]))} />
        )}
      </div>
      {total > 0 && (
        <Pagination page={page} total={total} pageSize={pageSize} totalPages={Math.max(1, Math.ceil(total / pageSize))}
          onPageChange={(p) => { setPage(p); setSelected([]); }} onPageSizeChange={(s) => { setPageSize(s); setPage(1); setSelected([]); }} />
      )}
      <LinkedBulkBar count={selected.length} statuses={statuses} stages={stages} processing={processing}
        onView={() => view(selectedRows[0])} onEdit={() => edit(selectedRows[0])}
        onStatusChange={(v) => changeField('status', v)} onStageChange={(v) => changeField('stage', v)} onDelete={() => setDeleting(selectedRows)} onClear={() => setSelected([])} />
      <WhsFormPane open={!!pane} title={pane?.record ? (pane.readOnly ? pane.record[displayKey] : `Edit ${noun}`) : `Add ${noun}`}
        fields={fields} initial={pane?.initial} readOnly={!!pane?.readOnly}
        onEdit={() => setPane((p) => ({ ...p, readOnly: false }))} onSave={save} onClose={() => setPane(null)} />
      <ConfirmTypeDialog isOpen={!!deleting} title={`Delete ${deleting?.length > 1 ? `${deleting.length} ${title}` : noun}`}
        message={deleting?.length === 1 ? `"${deleting[0][displayKey] || ''}" will be permanently deleted. This cannot be undone.` : `The selected ${title.toLowerCase()} will be permanently deleted. This cannot be undone.`}
        onConfirm={remove} onClose={() => setDeleting(null)} />
    </section>
  );
}