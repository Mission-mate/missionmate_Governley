import React from 'react';
import useEditMutex from '@/components/shared/useEditMutex';
import HazardSectionCard from './HazardSectionCard';

/** WHS record overview: first section (left), remaining sections stacked (right). */
export default function HazardDetailsCard({ record: hazard, sections, onSave }) {
  const { editingSection, requestEdit, closeEdit, setDirty, editBlocked } = useEditMutex();
  const card = (s, children) => (
    <HazardSectionCard key={s.title} title={s.title} subtitle={s.subtitle} record={hazard} fields={s.fields} footer={s.footer}
      editing={editingSection === s.title} blocked={editBlocked && editingSection !== s.title}
      onEdit={() => requestEdit(s.title)} onClose={closeEdit} onDirty={() => setDirty(true)} onSave={onSave}>
      {children}
    </HazardSectionCard>
  );
  const [details, ...rest] = sections;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {card(details)}
      <div className="space-y-6">{rest.map((s) => card(s))}</div>
    </div>
  );
}