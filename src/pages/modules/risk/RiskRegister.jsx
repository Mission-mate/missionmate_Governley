import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import LogRiskModal from '@/components/risk/LogRiskModal';
import RiskRegisterGrid from '@/components/risk/register/RiskRegisterGrid';
import RiskSummaryCards from '@/components/risk/register/RiskSummaryCards';
import ActionRegisterGrid from '@/components/risk/register/ActionRegisterGrid';
import ActionSummaryCards from '@/components/risk/register/ActionSummaryCards';
import ControlsRegisterGrid from '@/components/risk/register/ControlsRegisterGrid';
import ControlsSummaryCards from '@/components/risk/register/ControlsSummaryCards';
import { flattenActions } from '@/lib/actionRegisterHelpers';
import { flattenControls } from '@/lib/controlsRegisterHelpers';
import DeleteRiskDialog from '@/components/risk/DeleteRiskDialog';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import RiskFieldConfigPane from '@/components/risk/RiskFieldConfigPane';
import { listRisks, deleteRisk, saveRisk, getRiskFieldConfig, saveRiskFieldConfig } from '@/lib/riskApi';
import { progressForStatus } from '@/components/risk/steps/treatmentConstants';
import LoadError from '@/components/shared/states/LoadError';
import { loadFailure } from '@/lib/readState';

const TABS = [
  { value: 'register', label: 'Risk Register' },
  { value: 'treatment', label: 'Treatment Register' },
  { value: 'monitoring', label: 'Controls Register' },
];

export default function RiskRegister() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState('register');
  const [statusTab, setStatusTab] = useState('Open');
  const [controlStatusTab, setControlStatusTab] = useState('Open');
  const [logOpen, setLogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null); // { kind: 'action'|'control', row }
  const [configOpen, setConfigOpen] = useState(false);

  const risksQuery = useQuery({ queryKey: ['risks'], queryFn: listRisks });
  const fieldsQuery = useQuery({ queryKey: ['riskFieldConfig'], queryFn: getRiskFieldConfig });
  const risks = risksQuery.data ?? [];
  const fields = fieldsQuery.data ?? [];
  const isLoading = risksQuery.isLoading || fieldsQuery.isLoading;
  // A failed read must never render as an empty register.
  const failure = loadFailure(risksQuery, fieldsQuery);
  const loadFailed = failure.isLoadingError;

  const actions = React.useMemo(() => flattenActions(risks), [risks]);
  const controls = React.useMemo(() => flattenControls(risks), [risks]);

  const refresh = () => qc.invalidateQueries({ queryKey: ['risks'] });

  const handleSaveConfig = async (next) => {
    await saveRiskFieldConfig(next);
    qc.invalidateQueries({ queryKey: ['riskFieldConfig'] });
  };

  const handleEdit = (risk) => navigate(`/risk/register/${risk.id}?edit=1`);

  // Open the risk detail page on a given tab (identification = Overview).
  const openRisk = (riskId, detailTab) => navigate(`/risk/register/${riskId}?tab=${detailTab}`);

  // Open a treatment action's pane on its parent risk's Treatment tab.
  const openAction = (a, mode = 'view') =>
    navigate(`/risk/register/${a.risk_id}?tab=treatment&action=${encodeURIComponent(a.id)}&mode=${mode}`);

  // Open an existing control's pane on its parent risk's Assessment tab.
  const openControl = (c, mode = 'view') =>
    navigate(`/risk/register/${c.risk_id}?tab=assessment&control=${encodeURIComponent(c.id)}&mode=${mode}`);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteRisk(deleteTarget.id);
    setDeleteTarget(null);
    refresh();
    toast({ title: 'Deleted', description: 'Risk removed successfully.' });
  };

  // Remove treatment actions / controls from their parent risks' arrays.
  const handleConfirmDeleteRow = async () => {
    if (!deleteRow) return;
    const { kind, rows } = deleteRow;
    const byRisk = new Map();
    rows.forEach((row) => {
      if (!byRisk.has(row.risk_id)) byRisk.set(row.risk_id, []);
      byRisk.get(row.risk_id).push(row.id);
    });
    await Promise.all([...byRisk.entries()].map(([riskId, ids]) =>
      saveRisk(riskId, { arrayOps: [{ field: kind === 'action' ? 'treatment_plan' : 'existing_controls', removes: ids }] })));
    setDeleteRow(null);
    refresh();
    toast({ title: 'Deleted', description: `${kind === 'action' ? 'Action' : 'Control'}s removed successfully.` });
  };

  // Update the status of treatment actions inside their parent risks.
  const handleChangeActionStatus = async (rows, status) => {
    const byRisk = new Map();
    rows.forEach((row) => {
      if (!byRisk.has(row.risk_id)) byRisk.set(row.risk_id, []);
      byRisk.get(row.risk_id).push(row.id);
    });
    const auto = progressForStatus(status);
    const patch = {
      status,
      ...(auto !== null ? { progress: auto } : {}),
      // Completed treatments are no longer a priority.
      ...(status === 'Completed' ? { priority: '' } : {}),
    };
    await Promise.all([...byRisk.entries()].map(([riskId, ids]) =>
      saveRisk(riskId, { arrayOps: [{ field: 'treatment_plan', patches: ids.map((id) => ({ id, patch })) }] })));
    refresh();
    toast({ title: 'Status updated', description: `${rows.length} treatment action${rows.length !== 1 ? 's' : ''} set to ${status}.` });
  };

  return (
    <div className="p-6 lg:p-8 w-full max-w-[1400px] mx-auto">
      <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Risk Management Framework</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tab === 'treatment'
              ? 'Monitor risk treatment actions to ensure identified risks are managed effectively'
              : tab === 'monitoring'
              ? 'Maintain oversight of internal and external controls used to manage risks'
              : 'Identify, assess, and mitigate organizational risks'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setConfigOpen(true)} className="gap-2">
            <SlidersHorizontal className="w-4 h-4" /> Customise
          </Button>
          <Button onClick={() => setLogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Log New Risk
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <CapsuleTabs animated tabs={TABS} value={tab} onChange={setTab} />
      </div>

      {loadFailed && (
        <LoadError failure={failure} title="Couldn’t load the register" />
      )}

      {!loadFailed && tab === 'register' && (
        <>
          <RiskSummaryCards
            risks={risks.filter((r) => (r.status === 'Closed' ? 'Closed' : 'Open') === statusTab)}
          />
          <RiskRegisterGrid
            risks={risks}
            isLoading={isLoading}
            statusTab={statusTab}
            onStatusTabChange={setStatusTab}
            fields={fields}
            onView={(r) => openRisk(r.id, 'identification')}
            onEdit={handleEdit}
            onDelete={setDeleteTarget}
          />
        </>
      )}

      {!loadFailed && tab === 'treatment' && (
        <>
          <ActionSummaryCards actions={actions} />
          <ActionRegisterGrid
            actions={actions}
            isLoading={isLoading}
            onView={(a) => openAction(a, 'view')}
            onEdit={(a) => openAction(a, 'edit')}
            onDelete={(rows) => setDeleteRow({ kind: 'action', rows })}
            onChangeStatus={handleChangeActionStatus}
          />
        </>
      )}

      {!loadFailed && tab === 'monitoring' && (
        <>
        <ControlsSummaryCards
          controls={controls.filter((c) => (c.risk_status === 'Closed' ? 'Closed' : 'Open') === controlStatusTab)}
        />
        <ControlsRegisterGrid
          controls={controls}
          isLoading={isLoading}
          statusTab={controlStatusTab}
          onStatusTabChange={setControlStatusTab}
          fields={fields}
          onView={(c) => openControl(c, 'view')}
          onEdit={(c) => openControl(c, 'edit')}
          onDelete={(rows) => setDeleteRow({ kind: 'control', rows })}
        />
        </>
      )}

      <LogRiskModal
        isOpen={logOpen}
        onClose={() => setLogOpen(false)}
        onSaved={refresh}
      />


      <DeleteRiskDialog
        isOpen={!!deleteTarget}
        risk={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      {(() => {
        const n = deleteRow?.rows?.length || 0;
        const isAction = deleteRow?.kind === 'action';
        const noun = isAction
          ? `Treatment Action${n !== 1 ? 's' : ''}`
          : `Risk Control${n !== 1 ? 's' : ''}`;
        return (
          <ConfirmTypeDialog
            isOpen={!!deleteRow}
            title={`Delete ${noun.toLowerCase()}?`}
            message={`Permanently delete ${n} ${noun}? This cannot be undone.`}
            keyword="DELETE"
            confirmLabel="Delete"
            onClose={() => setDeleteRow(null)}
            onConfirm={handleConfirmDeleteRow}
          />
        );
      })()}

      {configOpen && (
        <RiskFieldConfigPane
          fields={fields}
          onClose={() => setConfigOpen(false)}
          onSave={handleSaveConfig}
        />
      )}
    </div>
  );
}