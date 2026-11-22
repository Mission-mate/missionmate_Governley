import React from 'react';
import { ELEVATED_SECTION } from '@/components/shared/cardStyles';
import SectionEditButton from '@/components/shared/SectionEditButton';
import CardEditFooter from '@/components/shared/CardEditFooter';

/** Policy details card with a header Edit action and inline edit mode. */
export default function PolicyDetailCard({ title, editing, disabled, onEdit, onCancel, onSave, saving, error, view, edit }) {
  return (
    <div className={ELEVATED_SECTION}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {!editing && <SectionEditButton onClick={onEdit} disabled={disabled} />}
      </div>
      {editing ? (
        <>
          {edit}
          {error && <p className="text-xs text-destructive mt-3">{error}</p>}
          <CardEditFooter onCancel={onCancel} onSave={onSave} saving={saving} />
        </>
      ) : view}
    </div>
  );
}