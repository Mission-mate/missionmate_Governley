import React from 'react';
import { ELEVATED_SECTION } from '@/components/shared/cardStyles';
import SectionEditButton from '@/components/shared/SectionEditButton';
import CardEditFooter from '@/components/shared/CardEditFooter';
import DeliverableFormFields from './DeliverableFormFields';
import DeliverableTrackingCard from './DeliverableTrackingCard';
import useDeliverableCardEdit from './useDeliverableCardEdit';
import useCardEditLock from '@/hooks/useCardEditLock';
import { StatusPill, PriorityPill, HealthText } from './DeliverableBadges';
import { customFieldText } from './CustomFieldInput';

const FIELDS = [['title', ''], ['description', ''], ['owner', ''], ['status', ''], ['health', ''], ['priority', ''], ['custom_fields', {}]];
const validate = (f) => {
  const e = {};
  if (!f.title.trim()) e.title = 'Name is required';
  if (!f.status) e.status = 'Status is required';
  if (!f.health) e.health = 'Health is required';
  return e;
};

const Field = ({ label, children, wide }) => (
  <div className={wide ? 'col-span-2' : ''}>
    <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
    <div className="text-sm text-foreground">{children}</div>
  </div>
);

export default function DeliverableOverviewTab({ deliverable, config, onSaved }) {
  const d = deliverable;
  const lock = useCardEditLock();
  const detailsLock = lock('details');
  const edit = useDeliverableCardEdit(d, FIELDS, onSaved, validate, detailsLock.onEditingChange);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <div className={ELEVATED_SECTION}>
        <div className="flex items-start justify-between mb-5">
          <h3 className="text-base font-bold text-foreground">Deliverable Details</h3>
          {!edit.editing && <SectionEditButton onClick={edit.start} disabled={detailsLock.locked} />}
        </div>
        {edit.editing ? (
          <>
            <DeliverableFormFields form={edit.form} set={edit.set} errors={edit.errors} config={config} sections={['details']} />
            <CardEditFooter onCancel={edit.cancel} onSave={edit.save} saving={edit.saving} />
          </>
        ) : (
          <div className="grid grid-cols-2 gap-5">
            <Field label="Name" wide>{d.title}</Field>
            {d.description?.trim() && <Field label="Description" wide><p className="whitespace-pre-wrap">{d.description}</p></Field>}
            <Field label="Owner">{d.owner || '–'}</Field>
            <Field label="Health"><HealthText value={d.health} /></Field>
            <Field label="Status"><StatusPill value={d.status} /></Field>
            {config.show_priority && <Field label="Priority"><PriorityPill value={d.priority} /></Field>}
            {config.custom_columns.map((c) => <Field key={c.id} label={c.title}>{customFieldText(c, d.custom_fields?.[c.id])}</Field>)}
          </div>
        )}
      </div>
      <DeliverableTrackingCard deliverable={d} config={config} onSaved={onSaved} {...lock('tracking')} />
    </div>
  );
}