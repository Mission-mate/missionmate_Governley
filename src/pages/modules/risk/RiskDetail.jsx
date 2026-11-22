import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { Plus } from 'lucide-react';
import SectionEditButton from '@/components/shared/SectionEditButton';
import CardEditFooter from '@/components/shared/CardEditFooter';
import useEditMutex from '@/components/shared/useEditMutex';
import { ELEVATED_SECTION } from '@/components/shared/cardStyles';
import { sanitizeRiskHtml } from '@/lib/riskHtml';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { DEFAULT_STATUS_OPTIONS, getRisk, getRiskFieldConfig, fieldOptions, RiskDuplicateIdError } from '@/lib/riskApi';
import LoadError from '@/components/shared/states/LoadError';
import { loadFailure } from '@/lib/readState';
import { getRiskRating, getRiskScore } from '@/lib/riskMatrix';
import RatingBadge from '@/components/risk/RatingBadge';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import RiskStepMonitoring from '@/components/risk/steps/RiskStepMonitoring';
import RiskAssessmentScores from '@/components/risk/detail/RiskAssessmentScores';
import ControlsContainer from '@/components/risk/detail/ControlsContainer';
import RiskIdentificationCards from '@/components/risk/detail/RiskIdentificationCards';
import EditTreatmentActionPane from '@/components/risk/steps/EditTreatmentActionPane';
import { TREATMENT_COLUMNS } from '@/components/risk/detail/riskTableColumns';
import SelectableCardList from '@/components/risk/detail/SelectableCardList';
import TreatmentOptionsGuide from '@/components/risk/detail/TreatmentOptionsGuide';
import InfoTooltip from '@/components/risk/InfoTooltip';
import DeleteActionDialog from '@/components/risk/steps/DeleteActionDialog';
import { newAction } from '@/components/risk/steps/treatmentConstants';
import ReviewHistory from '@/components/risk/review/ReviewHistory';
import useRiskSave from '@/hooks/useRiskSave';
import { LoaderOne } from '@/components/ui/loaders';
import NotesTab from '@/components/notes/NotesTab';
import useRecordTabCounts from '@/hooks/useRecordTabCounts';

const TABS = [
{ value: 'identification', label: 'Overview' },
{ value: 'assessment', label: 'Assessment' },
{ value: 'treatment', label: 'Treatment' },
{ value: 'monitoring', label: 'Monitoring & Review' },
{ value: 'notes', label: 'Notes' }];


export default function RiskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { save, dialog: conflictDialog } = useRiskSave(id);

  const [tab, setTab] = useState('identification');
  // Page-wide edit mutex — only one section card across all tabs edits at a time.
  const { editingSection, requestEdit, closeEdit, setDirty, editBlocked } = useEditMutex();
  const [draft, setDraft] = useState(null);
  // The record as it was when editing began — what conflict checks compare against.
  const [editBase, setEditBase] = useState(null);
  const [saving, setSaving] = useState(false);
  const [idError, setIdError] = useState('');
  const [openActionId, setOpenActionId] = useState(null);
  const [paneStartInEdit, setPaneStartInEdit] = useState(false);
  const [initialControl, setInitialControl] = useState(null);
  const [deleteAction, setDeleteAction] = useState(null);
  const [newDraftAction, setNewDraftAction] = useState(null);

  const riskQuery = useQuery({ queryKey: ['risk', id], queryFn: () => getRisk(id) });
  const fieldsQuery = useQuery({ queryKey: ['riskFieldConfig'], queryFn: getRiskFieldConfig });
  const risk = riskQuery.data;
  const fields = fieldsQuery.data ?? [];
  const isLoading = riskQuery.isLoading || fieldsQuery.isLoading;
  // Error only when there's nothing loaded to show — a failed background refetch keeps the page (and any open edit).
  const failure = loadFailure(riskQuery, fieldsQuery);

  const { data: currentUser } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const counts = useRecordTabCounts('risk', id, { documents: false });
  const tabs = TABS.map((t) => t.value === 'notes' ? { ...t, count: counts.notes } : t);
  const categoryOpts = fieldOptions(fields, 'category');
  const appetiteOpts = fieldOptions(fields, 'risk_appetite');

  useEffect(() => {
    // Apply the initial tab from URL params once on mount only, so later
    // re-renders (e.g. after saving the treatment strategy) don't reset the tab.
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('tab');
    if (requested && TABS.some((t) => t.value === requested)) {
      setTab(requested);
      // Deep link from the Treatment Register: open that action's pane once the risk loads.
      const actionId = params.get('action');
      if (requested === 'treatment' && actionId) {
        setOpenActionId(actionId);
        setPaneStartInEdit(params.get('mode') === 'edit');
      }
      // Deep link from the Controls Register: open that control's pane on the Assessment tab.
      const controlId = params.get('control');
      if (requested === 'assessment' && controlId) {
        setInitialControl({ id: controlId, mode: params.get('mode') });
      }
    } else if (params.get('edit') === '1') {
      setTab('identification');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="p-16 flex items-center justify-center">
        <LoaderOne size="lg" />
      </div>);

  }

  if (failure.isLoadingError) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <TopBarBack onClick={() => navigate('/risk/register')}>Back to Risk Register</TopBarBack>
        <LoadError failure={failure} title="Couldn’t load this risk" />
      </div>);

  }

  // Only a successful read that returned no record reaches this point.
  if (!risk) {
    return (
      <div className="p-10 text-center text-sm text-muted-foreground">
        Risk not found.
        <div className="mt-3">
          <Button variant="outline" onClick={() => navigate('/risk/register')}>Back to Register</Button>
        </div>
      </div>);

  }

  // Seed the draft from the current record and claim the mutex.
  const startEdit = (section) => {
    setDraft({ ...risk });
    setEditBase(risk);
    requestEdit(section);
  };

  const cancelEdit = () => {
    setDraft(null);
    setIdError('');
    closeEdit();
  };

  // Any field change marks the draft dirty, which blocks other cards' Edit triggers.
  const updateDraft = (fields) => {
    setDirty();
    if ('risk_id' in fields) setIdError('');
    setDraft((prev) => ({ ...prev, ...fields }));
  };

  // Every save goes through the conflict-checked path. Resolves false when the
  // user chose to reload the current data instead of saving.
  const persist = async (request) => {
    try {
      const saved = await save(request);
      if (saved) toast({ title: 'Saved', description: 'Risk updated successfully.' });
      return saved;
    } catch (err) {
      if (!(err instanceof RiskDuplicateIdError)) {
        toast({ title: 'Error', description: 'Failed to save changes.', variant: 'destructive' });
      }
      throw err;
    }
  };

  // Section cards save only the keys they own, checked against the record as
  // it was when editing began.
  const saveDraftKeys = async (keys, derived = {}) => {
    if (keys.includes('risk_id') && !String(draft?.risk_id ?? '').trim()) {
      setIdError('Risk ID is required');
      return;
    }
    setSaving(true);
    try {
      const pick = (src) => Object.fromEntries(keys.map((k) => [k, src?.[k] ?? null]));
      await persist({ fields: pick({ ...draft, ...derived }), base: pick(editBase) });
      cancelEdit();
    } catch (err) {
      // The draft stays open; a duplicate ID is shown inline, other errors as a toast.
      if (err instanceof RiskDuplicateIdError) setIdError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Assessment and Monitoring cards.
  const saveSection = () => editingSection === 'assessment' ?
  saveDraftKeys(
    ['inherent_likelihood', 'inherent_consequence', 'inherent_rating', 'residual_likelihood', 'residual_consequence', 'residual_rating'],
    {
      inherent_rating: getRiskRating(draft.inherent_likelihood, draft.inherent_consequence),
      residual_rating: getRiskRating(draft.residual_likelihood, draft.residual_consequence)
    }) :
  saveDraftKeys(['monitoring_method']);

  const isEditing = (section) => editingSection === section;
  const blockedFor = (section) => editBlocked && editingSection !== section;
  const plan = risk.treatment_plan || [];
  // newDraftAction holds an action being created (not yet in the plan).
  const openAction = newDraftAction || plan.find((a) => a.id === openActionId) || null;

  const closePane = () => {
    setOpenActionId(null);
    setNewDraftAction(null);
    setPaneStartInEdit(false);
  };

  // Persist a single edited or newly created action from the pane.
  const saveAction = async (updated) => {
    const saved = await persist({ arrayOps: [{ field: 'treatment_plan', upserts: [{ item: updated, base: newDraftAction ? null : openAction }] }] });
    // A new action closes once added; an existing one stays open in edit mode. Reloading on a conflict closes the pane.
    if (newDraftAction || !saved) closePane();
    return saved;
  };

  // Open the pane in create mode with a fresh action.
  const addAction = () => {
    setNewDraftAction(newAction());
    setPaneStartInEdit(true);
    setOpenActionId(null);
  };

  // Open existing action in view or edit mode.
  const viewAction = (a) => {setNewDraftAction(null);setPaneStartInEdit(false);setOpenActionId(a.id);};
  const editAction = (a) => {setNewDraftAction(null);setPaneStartInEdit(true);setOpenActionId(a.id);};

  const confirmDeleteAction = async () => {
    await persist({ arrayOps: [{ field: 'treatment_plan', removes: [deleteAction.id] }] });
    setDeleteAction(null);
  };

  // Save just the treatment strategy (independent of actions).
  const saveStrategy = async (value) => {
    setSaving(true);
    try {
      await save({ fields: { treatment_action: value }, base: { treatment_action: risk.treatment_action ?? null } });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to save changes.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // A dirty draft blocks tab switching; a clean one exits edit mode silently.
  const changeTab = (v) => {
    if (editBlocked) return;
    cancelEdit();
    setTab(v);
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <TopBarBack onClick={() => navigate('/risk/register')}>Back to Risk Register</TopBarBack>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-muted-foreground">{risk.risk_id}</span>
          {risk.residual_rating && <RatingBadge rating={risk.residual_rating} />}
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{risk.title}</h1>
      </div>

      <div className="mb-6">
        <CapsuleTabs animated tabs={tabs} value={tab} onChange={changeTab} />
      </div>

      {tab === 'notes' &&
      <NotesTab objectType="risk" objectId={risk.id} currentUser={currentUser} />
      }

      {/* IDENTIFICATION — self-contained card layout */}
      {tab === 'identification' &&
      <RiskIdentificationCards
        risk={risk}
        statusOptions={DEFAULT_STATUS_OPTIONS}
        categoryOptions={categoryOpts}
        appetiteOptions={appetiteOpts}
        draft={draft}
        onDraftChange={updateDraft}
        editingSection={editingSection}
        requestEdit={startEdit}
        closeEdit={cancelEdit}
        editBlocked={editBlocked}
        onSaveKeys={saveDraftKeys}
        idError={idError}
        saving={saving} />
      }

      {/* ASSESSMENT — two independent containers (Risk Assessment + Controls) */}
      {tab === 'assessment' &&
      <div className="space-y-6">
          {/* Risk Assessment container — edits scores only */}
          <div className={ELEVATED_SECTION}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Risk Assessment</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Assess the likelihood and impact of the risk to determine its overall risk rating
                </p>
              </div>
              {!isEditing('assessment') &&
            <SectionEditButton
              onClick={() => startEdit('assessment')}
              disabled={blockedFor('assessment')}
              className="shrink-0" />
            }
            </div>
            {isEditing('assessment') ?
          <RiskAssessmentScores form={draft} update={updateDraft} /> :

          <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border p-4 space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-base text-rose-600">Inherent Risk</h3>
                      <InfoTooltip text="The level of risk before any controls or safeguards are considered. e.g. The risk if no policies, procedures, or controls were in place." />
                    </div>
                    <p className="text-xs text-muted-foreground">Risk Before Controls</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Likelihood: {risk.inherent_likelihood || '—'}</span>
                    <span>Consequence: {risk.inherent_consequence || '—'}</span>
                    <span>Score: {getRiskScore(risk.inherent_likelihood, risk.inherent_consequence) || '—'}</span>
                  </div>
                  <RatingBadge rating={risk.inherent_rating} />
                </div>
                <div className="rounded-lg border border-border p-4 space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-base text-emerald-600">Residual Risk</h3>
                      <InfoTooltip text="The level of risk remaining after controls and safeguards are applied. e.g. The risk that remains after policies, procedures, and controls are operating." />
                    </div>
                    <p className="text-xs text-muted-foreground">Risk After Controls</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Likelihood: {risk.residual_likelihood || '—'}</span>
                    <span>Consequence: {risk.residual_consequence || '—'}</span>
                    <span>Score: {getRiskScore(risk.residual_likelihood, risk.residual_consequence) || '—'}</span>
                  </div>
                  <RatingBadge rating={risk.residual_rating} />
                </div>
              </div>
          }
            {isEditing('assessment') &&
          <CardEditFooter onCancel={cancelEdit} onSave={saveSection} saving={saving} />
          }
          </div>

          {/* Controls container — independent edit/save */}
          <ControlsContainer risk={risk} onSave={persist} initialControl={initialControl} />
        </div>
      }

      {/* MONITORING — shared card layout */}
      {tab === 'monitoring' &&
      <div className={ELEVATED_SECTION}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Risk Monitoring &amp; Review</h2>
            {!isEditing('monitoring') &&
          <SectionEditButton
            onClick={() => startEdit('monitoring')}
            disabled={blockedFor('monitoring')} />
          }
          </div>
          {isEditing('monitoring') ?
        <RiskStepMonitoring form={draft} update={updateDraft} /> :

        <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Monitoring Method</p>
                {risk.monitoring_method ?
            <div className="text-sm text-foreground [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4" dangerouslySetInnerHTML={{ __html: sanitizeRiskHtml(risk.monitoring_method) }} /> :
            <p className="text-sm text-foreground">—</p>}
              </div>
            </div>
        }
          {isEditing('monitoring') &&
        <CardEditFooter onCancel={cancelEdit} onSave={saveSection} saving={saving} />
        }
        </div>
      }

      {/* TREATMENT — two independent containers (Treatment Strategy + Treatment Actions) */}
      {tab === 'treatment' &&
      <div className="space-y-6">
          {/* Risk Treatment Strategy — selectable option cards drive treatment_action */}
          <TreatmentOptionsGuide
          value={risk.treatment_action || ''}
          saving={saving}
          onSelect={(v) => saveStrategy(v)} />

          {/* Treatment Actions container — independent CRUD */}
          <div className={ELEVATED_SECTION}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Risk Treatment</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Implement risk treatments and monitor their progress to manage risk effectively

              </p>
              </div>
              <Button size="sm" className="gap-1.5 text-sm" onClick={addAction}>
                <Plus className="w-4 h-4" /> Add Treatment
              </Button>
            </div>
            {plan.length === 0 ?
          <div className="border border-dashed border-border rounded-xl p-10 text-center">
                <p className="text-sm text-muted-foreground">No treatments yet. Click "Add Treatment" to create one.</p>
              </div> :

          <SelectableCardList
            items={plan}
            onView={viewAction}
            onEdit={editAction}
            onDelete={setDeleteAction}
            columns={TREATMENT_COLUMNS} />
          }
          </div>
        </div>
      }

      {/* REVIEW HISTORY — separate container, monitoring tab only */}
      {tab === 'monitoring' &&
      <ReviewHistory
        reviews={risk.review_log || []}
        onSave={(op) => persist({ arrayOps: [{ field: 'review_log', ...op }] })} />

      }

      <EditTreatmentActionPane
        open={!!openAction}
        action={openAction}
        startInEdit={paneStartInEdit}
        isNew={!!newDraftAction}
        onSave={saveAction}
        onClose={closePane} />
      

      <DeleteActionDialog
        isOpen={!!deleteAction}
        name={deleteAction?.title}
        onClose={() => setDeleteAction(null)}
        onConfirm={confirmDeleteAction} />

      {conflictDialog}
      
    </div>);

}