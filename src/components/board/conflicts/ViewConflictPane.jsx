import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import SlidePane from '@/components/ui/SlidePane';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import OptionBadge from '@/components/board/registers/OptionBadge';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import useRecordTabCounts from '@/hooks/useRecordTabCounts';
import SectionCard from '@/components/shared/SectionCard';
import ViewModeHint from '@/components/shared/ViewModeHint';
import {
  resolveFields, formatDate, STATUS_STYLES, RISK_STYLES, NOTIFIED_STYLES, CONFLICT_TYPE_STYLES, isConflictOverdue,
} from '@/lib/conflictOfInterest';
import FieldLabelHelp from './FieldLabelHelp';
import { LAST_REVIEW_HELP, NEXT_REVIEW_HELP } from './reviewHelpText';
import ConflictActionsTab from './actions/ConflictActionsTab';
import ConflictNotesTab from './ConflictNotesTab';
import PersonMetaLine from '@/components/compliance/conflicts/PersonMetaLine';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import { cn } from '@/lib/utils';
import DocumentsTab from '@/components/documents/DocumentsTab';
import EditConflictForm from './EditConflictForm';
import EditFooterActions from '@/components/shared/EditFooterActions';
import useNoteActions from '@/hooks/useNoteActions';


const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'actions', label: 'Actions' },
  { value: 'notes', label: 'Notes' },
  { value: 'documents', label: 'Documents' },
];

function initialsOf(name) {
  return (name || '').trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('');
}

function Field({ label, help, children }) {
  return (
    <div>
      <FieldLabelHelp label={label} help={help} className="mb-0.5" />
      <div className="text-sm text-foreground">{children ?? <span className="text-muted-foreground/50">—</span>}</div>
    </div>
  );
}

function OverviewContent({ conflict, config }) {
  const fields = resolveFields(config);
  const customFields = fields.filter((f) => !f.system);

  const reviewFreq = conflict.review_frequency === 'Every' && conflict.interval_value
    ? `Every ${conflict.interval_value} ${conflict.interval_unit || 'Months'}`
    : conflict.review_frequency;

  return (
    <div className="space-y-6">
      {/* Conflict of Interest Details */}
      <SectionCard title="Declaration Details">
        <div className="space-y-3">
        <Field label="Date of Declaration">{conflict.date_of_disclosure ? formatDate(conflict.date_of_disclosure) : null}</Field>
        {conflict.register_id && <Field label="Declaration Title">{conflict.title || null}</Field>}
        <Field label="Nature of Interest">
          {conflict.description ? <span className="whitespace-pre-wrap">{conflict.description}</span> : null}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <OptionBadge label={conflict.status || 'Open'} {...(STATUS_STYLES[conflict.status] || STATUS_STYLES.Open)} />
          </Field>
          <Field label="Conflict Type">
            {conflict.conflict_type
              ? <OptionBadge label={conflict.conflict_type} {...CONFLICT_TYPE_STYLES[conflict.conflict_type]} />
              : null}
          </Field>
          <Field label="Risk Exposure">
            {conflict.risk_exposure
              ? <OptionBadge label={conflict.risk_exposure} {...(RISK_STYLES[conflict.risk_exposure] || { bg: 'bg-gray-100', text: 'text-gray-600' })} />
              : null}
          </Field>
          <Field label="Committee Notified">
            {conflict.committee_notified
              ? <OptionBadge label={conflict.committee_notified} {...(NOTIFIED_STYLES[conflict.committee_notified] || { bg: 'bg-gray-100', text: 'text-gray-600' })} />
              : null}
          </Field>
          <Field label="Approved By">
            {conflict.approved_by ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-[11px] font-semibold inline-flex items-center justify-center shrink-0">
                  {initialsOf(conflict.approved_by)}
                </span>
                {conflict.approved_by}
              </span>
            ) : null}
          </Field>
          <Field label="Approved Date">{conflict.approved_date ? formatDate(conflict.approved_date) : null}</Field>
        </div>
        </div>
      </SectionCard>

      {/* Review */}
      <SectionCard title="Review Details">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Review Frequency">{reviewFreq}</Field>
          <Field label="Last Review Date" help={LAST_REVIEW_HELP}>
            {conflict.last_review_date ? formatDate(conflict.last_review_date) : null}
          </Field>
          <Field label="Next Review Date" help={NEXT_REVIEW_HELP}>
            {conflict.next_review_date ? (
              isConflictOverdue(conflict) ? (
                <span className="inline-block">
                  <span className="block text-red-600 font-medium">{formatDate(conflict.next_review_date)}</span>
                  <span className="block text-xs text-red-600 mt-0.5">Overdue</span>
                </span>
              ) : formatDate(conflict.next_review_date)
            ) : null}
          </Field>
        </div>
      </SectionCard>

      {/* Additional Details */}
      {customFields.length > 0 && (
        <SectionCard title="Additional Details">
          <div className="grid grid-cols-2 gap-3">
            {customFields.map((field) => {
              const raw = conflict.custom_fields?.[field.id];
              return (
                <div key={field.id} className={field.type === 'Long Text' ? 'col-span-2' : ''}>
                  <Field label={field.label}>
                    {raw ? (field.type === 'Date' ? formatDate(raw) : <span className="whitespace-pre-wrap">{raw}</span>) : null}
                  </Field>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

export default function ViewConflictPane({
  conflict, config, people = [], allConflicts = [], onClose, onSaved, startInEdit = false, onOpen,
}) {
  // onOpen = read-only pane (main Declarations Register): the header shows Open instead of Edit.
  const [activeTab, setActiveTab] = useState('overview');
  const counts = useRecordTabCounts('conflict_of_interest', conflict?.id, { notes: false });
  const [editing, setEditing] = useState(startInEdit);
  const [saving, setSaving] = useState(false);
  const startEdit = () => setEditing(true);
  const formRef = useRef(null);
  const [pageDirty, setPageDirty] = useState(false);
  const note = useNoteActions();
  const [formDirty, setFormDirty] = useState(false);
  const { data: currentUser } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { requestClose, dialog } = useUnsavedChanges({
    draft: pageDirty || formDirty, baseline: false, onClose, saving, subject: 'changes',
  });
  const close = () => requestClose();
  const pageTab = activeTab === 'notes' || activeTab === 'actions';

  if (!conflict) return null;

  const handleSaveOverview = async () => {
    if (!formRef.current) return;
    setSaving(true);
    // Saved — back to view-only.
    const saved = await formRef.current.save();
    setSaving(false);
    if (saved) exitEdit();
  };
  // Leaving edit mode unmounts the form, so its dirty flag is cleared here.
  const exitEdit = () => { setFormDirty(false); setEditing(false); };

  return (
    <SlidePane isOpen onClose={close}>
      {dialog}
      <div
        className="h-full bg-white border-l border-border shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
          {/* Header */}
          <div className="px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground truncate">{conflict.member_name || 'Conflict of Interest'}</h2>
                {conflict.conflict_id && (
                  <span className="text-xs font-medium border rounded-full px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200 shrink-0">
                    {conflict.conflict_id}
                  </span>
                )}
              </div>
              <PersonMetaLine className="mt-1" person={people.find((p) => p.user_id === conflict.member_user_id)} />
            </div>
            <PaneIconHeaderActions showEdit={!editing} onEdit={startEdit} onOpen={onOpen} onClose={close} />
          </div>
          {onOpen
            ? !editing && <ViewModeHint className="mt-1.5" icon={ExternalLink} action="open" />
            : <ViewModeHint className="mt-1.5" editing={editing} />}
          <div className="mt-4">
            <CapsuleTabs animated tabs={TABS.map((t) => ({ ...t, count: counts[t.value] }))} value={activeTab} onChange={setActiveTab} />
          </div>
          
          </div>

          {/* Content */}
          <div className={cn('flex-1 min-h-0', pageTab ? 'flex' : 'overflow-y-auto px-5 py-4')}>
            {activeTab === 'overview' && (
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={editing ? 'edit' : 'view'}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                >
                  {editing ? (
                    <EditConflictForm
                      ref={formRef}
                      conflict={conflict}
                      people={people}
                      allConflicts={allConflicts}
                      config={config}
                      onSaved={onSaved}
                      onDirtyChange={setFormDirty}
                    />
                  ) : (
                    <OverviewContent conflict={conflict} config={config} />
                  )}
                </motion.div>
              </AnimatePresence>
            )}
            {activeTab === 'actions' && <ConflictActionsTab key={editing ? 'edit' : 'view'} conflictId={conflict.id} breadcrumbRoot={conflict.member_name || 'Conflict of Interest'} readOnly={!editing} flush onDirtyChange={setPageDirty} actionsRef={note.actionsRef} />}
            {activeTab === 'notes' && <ConflictNotesTab key={editing ? 'edit' : 'view'} conflictId={conflict.id} breadcrumbRoot={conflict.member_name || 'Conflict of Interest'} readOnly={!editing} flush onDirtyChange={setPageDirty} actionsRef={note.actionsRef} />}
            {activeTab === 'documents' && <DocumentsTab objectType="conflict_of_interest" objectId={conflict.id} currentUser={currentUser} hideTitle readOnly={!editing} compact />}
          </div>

          {/* Footer — only in edit mode on the overview tab, for saving field changes */}
          {editing && activeTab === 'overview' && (
            <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
              <EditFooterActions dirty={formDirty}
                onCancel={exitEdit} onSave={handleSaveOverview} saving={saving} />
            </div>
          )}
          {/* Actions / Notes pages save from this footer; Documents has nothing to save. */}
          {editing && activeTab !== 'overview' && (
            <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
              <EditFooterActions dirty={pageDirty} onCancel={() => requestClose(exitEdit)}
                onSave={() => note.saveThen(exitEdit)} saving={note.saving} />
            </div>
          )}
      </div>
    </SlidePane>
  );
}