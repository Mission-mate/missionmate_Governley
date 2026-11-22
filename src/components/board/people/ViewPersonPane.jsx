import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import SlidePane from '@/components/ui/SlidePane';
import EditFooterActions from '@/components/shared/EditFooterActions';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import { format, parseISO } from 'date-fns';
import SectionCard from '@/components/shared/SectionCard';
import ViewModeHint from '@/components/shared/ViewModeHint';
import RichTextCell from '@/components/risk/RichTextCell';
import EditPersonForm from './EditPersonForm';
import { PERSON_TYPES } from '@/lib/boardPeopleApi';

function fmtDate(d) {
  if (!d) return '—';
  try {return format(parseISO(d), 'dd MMM yyyy');} catch {return d;}
}

function ViewField({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value || '—'}</p>
    </div>);

}

function DetailsContent({ person }) {
  const typeLabel = PERSON_TYPES.find((t) => t.value === person.type)?.label || person.type;
  const isCustom = person.appointment_term === 'Custom';
  const termLabel = isCustom ?
  `Every ${person.interval_value || ''} ${person.interval_unit || ''}`.trim() :
  'Ongoing';

  return (
    <div className="space-y-4">
      <SectionCard className="grid grid-cols-2 gap-x-4 gap-y-5">
        <ViewField label="Member Type" value={typeLabel} />
        <ViewField label="Position" value={person.position || 'Member'} />
        <ViewField label="Date Commenced" value={fmtDate(person.appointment_date)} />
        <ViewField label="Appointment Term" value={termLabel} />
        <ViewField label="Status" value={person.status === 'inactive' ? 'Inactive' : 'Active'} />
        <ViewField label="Director ID" value={person.director_id} />
        {isCustom &&
        <>
            <ViewField label="Duration" value={person.interval_value} />
            <ViewField label="Unit" value={person.interval_unit} />
            <ViewField label="Term Expiry" value={fmtDate(person.term_renewal_date)} />
          </>
        }
      </SectionCard>
      <SectionCard className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Additional Details</p>
        <RichTextCell html={person.additional_details} clamp={0} />
      </SectionCard>
    </div>);

}

export default function ViewPersonPane({ person, isOpen, onClose, startInEdit = false }) {
  const [editing, setEditing] = useState(startInEdit);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const formRef = useRef(null);
  const { requestClose, dialog } = useUnsavedChanges({
    draft: dirty, baseline: false, onClose, saving, enabled: isOpen && editing, subject: 'committee member changes',
  });

  useEffect(() => {
    if (person && isOpen) setEditing(startInEdit);
  }, [person?.id, isOpen]);

  // Keep the pane mounted (closed) when there's no person so the shared close
  // animation can finish instead of the pane vanishing instantly.
  if (!person) return <SlidePane isOpen={false} onClose={onClose} />;

  const handleSave = async () => {
    if (!formRef.current) return;
    setSaving(true);
    // Saved — back to view-only.
    const saved = await formRef.current.save();
    setSaving(false);
    if (saved) exitEdit();
  };
  // Leaving edit mode unmounts the form, so its dirty flag is cleared here.
  const exitEdit = () => { setDirty(false); setEditing(false); };

  return (
    <>
    {dialog}
    <SlidePane isOpen={isOpen} onClose={requestClose}>
      <div
        className="h-full bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h2 className="font-bold text-lg truncate">{person.member_name}</h2>
              <p className="text-xs text-muted-foreground truncate">{person.member_email}</p>
            </div>
            <PaneIconHeaderActions showEdit={!editing} onEdit={() => setEditing(true)} onClose={() => requestClose()} />
          </div>
          <ViewModeHint className="mt-1.5" editing={editing} />
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
              key={editing ? 'edit' : 'view'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}>

                {editing ?
              <EditPersonForm ref={formRef} person={person} onDirtyChange={setDirty} /> :
              <DetailsContent person={person} />
              }
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer — edit mode only */}
          {editing &&
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
              <EditFooterActions dirty={dirty}
                onCancel={exitEdit} onSave={handleSave} saving={saving} />
            </div>
          }
      </div>
    </SlidePane>
    </>);

}