import React, { useState, useEffect } from 'react';
import { guardSave } from '@/lib/saveGuard';
import { SquarePen } from 'lucide-react';
import EditFooterActions from '@/components/shared/EditFooterActions';
import useNoteActions from '@/hooks/useNoteActions';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import SlidePane from '@/components/ui/SlidePane';
import DateField from '@/components/ui/DateField';
import CloseButton from '@/components/shared/CloseButton';
import ViewModeHint from '@/components/shared/ViewModeHint';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import useFieldErrors from '@/hooks/useFieldErrors';
import FieldError from '@/components/shared/FieldError';

const rpErrors = (f) => Object.fromEntries(Object.entries({
  full_name: !String(f.full_name || '').trim() && 'Full Name is required.',
  appointment_date: !f.appointment_date && 'Date Appointed is required.',
}).filter(([, v]) => v));
import { calcTermRenewalDate } from '@/lib/boardPeopleApi';
import RpField from './RpField';
import RpSelect from './RpSelect';
import ColoredSelect from '@/components/shared/ColoredSelect';
import { RP_STATUS_OPTIONS } from './rpStatus';
import OfficeFields, { newOffice } from './OfficeFields';
import RpSectionHead from './RpSectionHead';
import { BOARD_SECTION, OFFICE_SECTION, TIPS } from './rpHelp';
import ResponsiblePersonOverview from './ResponsiblePersonOverview';
import ResponsiblePersonNotesTab, { RP_OBJECT_TYPE } from './ResponsiblePersonNotesTab';
import DocumentsTab from '@/components/documents/DocumentsTab';
import { cn } from '@/lib/utils';
import AssetCustomFields from '@/components/compliance/assets/AssetCustomFields';
import { rpCommittees, rpCustomColumns } from '@/lib/rpCustomise';

const TABS = [{ value: 'overview', label: 'Overview' }, { value: 'notes', label: 'Notes' }, { value: 'documents', label: 'Documents' }];

const KEYS = ['full_name', 'director_id', 'person_type', 'status', 'date_of_birth', 'email', 'phone', 'address', 'appointment_date', 'appointment_term', 'interval_value', 'interval_unit', 'term_expiry_date', 'date_ceased'];
const DEFAULTS = { person_type: 'Board Member', appointment_term: 'Ongoing', interval_unit: 'Years' };
const toForm = (rec, status) => ({
  ...Object.fromEntries(KEYS.map((k) => [k, rec?.[k] != null ? String(rec[k]) : DEFAULTS[k] || ''])),
  status: rec?.status || status,
  custom_fields: rec?.custom_fields || {},
  offices: rec?.offices?.length ? rec.offices.map((o) => ({ ...newOffice(), ...o })) : [newOffice()],
});
const filled = (o) => o.office_held?.trim() || o.committee || o.date_commenced || o.date_ceased;
const SECTION = 'rounded-xl bg-muted p-5 [&_input]:bg-card';
const HEAD = 'text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4';

/** Add / view / edit pane for a responsible person. record=null → add; startInEdit picks edit vs view. */
export default function ResponsiblePersonPane({ isOpen, onClose, register, record, startInEdit, defaultStatus, onSaved }) {
  const isNew = !record;
  const [edit, setEdit] = useState(true);
  const [form, setForm] = useState(() => toForm(null, defaultStatus));
  const [baseline, setBaseline] = useState(form);

  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('overview');
  const [currentUser, setCurrentUser] = useState(null);
  const [notesDirty, setNotesDirty] = useState(false);
  const note = useNoteActions();
  const { requestClose, dialog } = useUnsavedChanges({ draft: { form, notesDirty }, baseline: { form: baseline, notesDirty: false }, onClose, saving, enabled: isOpen && edit, subject: 'committee member changes' });
  const { errors, check, reset } = useFieldErrors(rpErrors, form);

  useEffect(() => {
    if (!isOpen) return;
    const init = toForm(record, defaultStatus);
    setForm(init); setBaseline(init); reset(); setSaving(false); setEdit(isNew || !!startInEdit); setTab('overview');
  }, [isOpen, record?.id]); // eslint-disable-line

  useEffect(() => { base44.auth.me().then(setCurrentUser); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setTerm = (k, v) => setForm((f) => {
    const n = { ...f, [k]: v };
    const date = calcTermRenewalDate(n);
    if (date) n.term_expiry_date = date;
    return n;
  });
  const isCustom = form.appointment_term === 'Custom';
  const customColumns = rpCustomColumns(register);
  const text = (k, ph) => <Input value={form[k]} onChange={(e) => set(k, e.target.value)} placeholder={ph} />;

  const save = guardSave(setSaving, async () => {
    if (!check()) return setTab('overview');
    setSaving(true);
    const data = Object.fromEntries(KEYS.map((k) => [k, form[k] === '' ? null : form[k]]));
    data.custom_fields = form.custom_fields;
    data.offices = form.offices.filter(filled).map((o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '')));
    if (isCustom) data.interval_value = Number(form.interval_value) || null;
    else { data.interval_value = null; data.interval_unit = null; data.term_expiry_date = null; }
    if (isNew) await base44.entities.ResponsiblePerson.create({ ...Object.fromEntries(Object.entries(data).filter(([, v]) => v != null)), register_id: register.id });
    else await base44.entities.ResponsiblePerson.update(record.id, data);
    await onSaved();
    setBaseline(form); setSaving(false);
    if (isNew) onClose(); else setEdit(false);
  });
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);

  const title = isNew ? 'Add Committee Member' : (edit ? 'Edit Committee Member' : record.full_name);

  return (
    <>
      {dialog}
      <SlidePane isOpen={isOpen} onClose={requestClose}>
        <div className="bg-card h-full flex flex-col shadow-2xl">
          <div className="px-6 pt-5 pb-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground truncate">{title}</h2>
              <div className="flex items-center gap-1">
                {!edit && <button onClick={() => setEdit(true)} title="Edit" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><SquarePen className="w-4 h-4" /></button>}
                <CloseButton onClick={() => requestClose()} />
              </div>
            </div>
            {!isNew && <ViewModeHint className="mt-1.5" editing={edit} />}
            {!isNew && <CapsuleTabs animated value={tab} onChange={setTab} className="w-fit mt-4" tabs={TABS} />}
            
          </div>
          <div className={cn('flex-1 min-h-0', tab === 'notes' && !isNew ? 'flex' : 'overflow-y-auto px-6 py-5 space-y-4')}>
            {tab === 'notes' && !isNew ? <ResponsiblePersonNotesTab person={record} readOnly={!edit} onDirtyChange={setNotesDirty} actionsRef={note.actionsRef} />
            : tab === 'documents' && !isNew ? <DocumentsTab objectType={RP_OBJECT_TYPE} objectId={record.id} currentUser={currentUser} hideTitle readOnly={!edit} compact />
            : !edit ? <ResponsiblePersonOverview r={record} customColumns={customColumns} /> : <>
              <section className={SECTION}>
                <p className={HEAD}>Responsible People Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <RpField label="Full Name" required>{text('full_name', 'e.g. Jane Smith')}<FieldError msg={errors.full_name} /></RpField>
                  <RpField label="Director ID" tip={TIPS.director_id}>{text('director_id', 'e.g. 036000000000000')}</RpField>
                  <RpField label="Type"><RpSelect value={form.person_type} onChange={(v) => set('person_type', v)} options={['Board Member', 'Non-Board Member']} /></RpField>
                  <RpField label="Status"><ColoredSelect value={form.status} onChange={(v) => set('status', v)} options={RP_STATUS_OPTIONS} allowClear={false} /></RpField>
                  <RpField label="Date of Birth"><DateField value={form.date_of_birth} onChange={(v) => set('date_of_birth', v)} /></RpField>
                  <RpField label="Email">{text('email', 'name@example.com')}</RpField>
                  <RpField label="Phone">{text('phone', 'e.g. 0400 000 000')}</RpField>
                  <RpField label="Address" className="col-span-2">{text('address', 'Street, suburb, state, postcode')}</RpField>
                </div>
              </section>
              <section className={SECTION}>
                <RpSectionHead {...BOARD_SECTION} />
                <div className="grid grid-cols-2 gap-4">
                  <RpField label="Date Appointed" required tip={TIPS.appointment_date}><DateField value={form.appointment_date} onChange={(v) => setTerm('appointment_date', v)} /><FieldError msg={errors.appointment_date} /></RpField>
                  <RpField label="Appointment Term" tip={TIPS.appointment_term}><RpSelect value={form.appointment_term} onChange={(v) => setTerm('appointment_term', v)} options={['Ongoing', 'Custom']} /></RpField>
                  {isCustom && <>
                    <RpField label="Duration"><Input inputMode="numeric" value={form.interval_value} onChange={(e) => setTerm('interval_value', e.target.value.replace(/\D/g, ''))} placeholder="e.g. 3" /></RpField>
                    <RpField label="Unit"><RpSelect value={form.interval_unit} onChange={(v) => setTerm('interval_unit', v)} options={['Months', 'Years']} /></RpField>
                    <RpField label="Term Expiry" className="col-span-2">
                      <DateField value={form.term_expiry_date} onChange={(v) => set('term_expiry_date', v)} />
                      <p className="text-xs text-muted-foreground">Auto-calculated from appointment date and term. Admins can override to extend term expiry.</p>
                    </RpField>
                  </>}
                  <RpField label="Date Ceased as Board Member" tip={TIPS.date_ceased} className="col-span-2"><DateField value={form.date_ceased} onChange={(v) => set('date_ceased', v)} /></RpField>
                </div>
              </section>
              <section className={SECTION}>
                <RpSectionHead {...OFFICE_SECTION} />
                <OfficeFields offices={form.offices} onChange={(v) => set('offices', v)} committees={rpCommittees(register)} savedIds={(record?.offices || []).map((o) => o.id)} />
              </section>
              {customColumns.length > 0 && (
                <section className={SECTION}>
                  <p className={HEAD}>Additional Fields</p>
                  <AssetCustomFields values={form} set={set} edit columns={customColumns} />
                </section>
              )}
            </>}
          </div>
          {/* On Notes, Save Changes writes the note and any edited fields. */}
          {edit && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
              <EditFooterActions dirty={isNew || notesDirty || (dirty && tab !== 'documents')} saving={saving || note.saving}
                onSave={tab === 'notes' ? () => note.saveThen(() => (dirty ? (setTab('overview'), save()) : setEdit(false))) : save}
                onCancel={() => (isNew ? requestClose()
                  : tab === 'notes' ? requestClose(() => { note.cancel(); setForm(baseline); reset(); setEdit(false); })
                  : (setForm(baseline), reset(), setEdit(false)))} saveLabel={isNew ? 'Add Committee Member' : undefined} />
            </div>
          )}
        </div>
      </SlidePane>
    </>
  );
}