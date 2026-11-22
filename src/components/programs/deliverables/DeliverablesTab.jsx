import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import DeliverableSummaryCards from './DeliverableSummaryCards';
import DeliverableHealthTabs from './DeliverableHealthTabs';
import DeliverableToolbar from './DeliverableToolbar';
import DeliverableTable from './DeliverableTable';
import DeliverableSelectionBar from './DeliverableSelectionBar';
import DeliverableFormModal from './DeliverableFormModal';
import DeliverableCustomiserPane from './DeliverableCustomiserPane';
import { DeliverableApiProvider } from '@/lib/programs/deliverableApiContext';
import { normalizeConfig } from '@/lib/programs/deliverableOptions';
import { deliverableFields, applyView, groupRows, healthCounts } from '@/lib/programs/deliverableView';
import { exportDeliverables } from '@/lib/programs/deliverableExport';

/** Deliverables register for one owner (Program or Project). `api` fixes which owner's records are used. */
export default function DeliverablesTab({ api, ownerRecord, onOwnerSaved }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState(null); // { deliverable } — null deliverable = add
  const [configOpen, setConfigOpen] = useState(false);
  const [health, setHealth] = useState('');
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState('');
  const [filters, setFilters] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const config = useMemo(() => normalizeConfig(ownerRecord.deliverable_config), [ownerRecord.deliverable_config]);
  const fields = useMemo(() => deliverableFields(config), [config]);

  const { data: deliverables = [], isLoading, ...read } = useQuery({ queryKey: api.keys.list(ownerRecord.id), queryFn: () => api.list(ownerRecord.id) });
  const refresh = () => qc.invalidateQueries({ queryKey: api.keys.list(ownerRecord.id) });

  const rows = applyView(deliverables, { search, health, filters });
  const selected = deliverables.find((d) => d.id === selectedId);
  const open = (d) => navigate(api.owner.detailPath(d.id));
  const [moveMode, setMoveMode] = useState(false);
  const canMove = !search && !health && !groupBy && !Object.values(filters).some((v) => (Array.isArray(v) ? v.length : v));
  const clearSelection = () => { setSelectedId(null); setMoveMode(false); };
  const onReorder = async (next) => {
    await api.reorder(next);
    refresh();
  };
  const onExport = (format) => exportDeliverables(format, { ownerTitle: ownerRecord.title, config, rows: selected ? [selected] : rows });

  return (
    <DeliverableApiProvider value={api}>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{api.owner.heading || 'Deliverables'}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">The outputs this {api.owner.kind} commits to deliver, with their tasks, milestones and data.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setConfigOpen(true)}><SlidersHorizontal className="w-4 h-4" /> Customise</Button>
          <Button className="gap-2" onClick={() => setForm({ deliverable: null })}><Plus className="w-4 h-4" /> Add Deliverable</Button>
        </div>
      </div>

      {isLoading ? <ModuleLoader /> : read.isLoadingError ? <LoadError failure={read} /> : (<>
        <DeliverableSummaryCards deliverables={deliverables} />
        <div className="flex items-center gap-2 mb-4 justify-between flex-wrap">
          <DeliverableHealthTabs value={health} onChange={setHealth} counts={healthCounts(deliverables)} />
          <div className="ml-auto">
            <DeliverableToolbar rows={deliverables} fields={fields} search={search} onSearch={setSearch} groupBy={groupBy} onGroup={setGroupBy}
              filters={filters} onFilter={(k, v) => setFilters((f) => ({ ...f, [k]: v }))} onClearFilters={() => setFilters({})} onExport={onExport} />
          </div>
        </div>
        <DeliverableTable groups={groupRows(rows, groupBy)} config={config} color={api.owner.iconColor || ownerRecord.color} columnLabel={api.owner.columnLabel} selectedId={selectedId}
          onSelect={(id) => { setMoveMode(false); setSelectedId((cur) => (cur === id ? null : id)); }} onOpen={open}
          reorderable={canMove} moveMode={moveMode} onReorder={onReorder}
          empty={deliverables.length ? 'No deliverables match the current view.' : 'No deliverables records yet. Click "Add Deliverable" to create one.'} />
      </>)}

      <DeliverableSelectionBar show={!!selected && !form && !toDelete} moveMode={moveMode} canMove={canMove}
        onOpen={() => open(selected)} onToggleMove={() => setMoveMode((v) => !v)} onDelete={() => setToDelete(selected)} onClear={clearSelection} />
      <DeliverableFormModal isOpen={!!form} onClose={() => setForm(null)} ownerId={ownerRecord.id} deliverable={form?.deliverable} config={config} onSaved={refresh} />
      <DeliverableCustomiserPane isOpen={configOpen} onClose={() => setConfigOpen(false)} ownerRecord={ownerRecord} config={config} onSaved={onOwnerSaved} />
      <ConfirmTypeDialog
        isOpen={!!toDelete}
        title="Delete Deliverable"
        message="This permanently deletes the deliverable with its tasks, milestones, data, notes and documents."
        onConfirm={async () => { await api.deleteDeliverables([toDelete.id]); setToDelete(null); clearSelection(); refresh(); }}
        onClose={() => setToDelete(null)}
      />
    </DeliverableApiProvider>
  );
}