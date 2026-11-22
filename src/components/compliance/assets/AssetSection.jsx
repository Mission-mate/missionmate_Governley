import React from 'react';
import SectionEditButton from '@/components/shared/SectionEditButton';
import CardEditFooter from '@/components/shared/CardEditFooter';
import { ELEVATED_SECTION } from '@/components/shared/cardStyles';
import { cn } from '@/lib/utils';

/** Overview section card with its own inline edit / save / cancel — matches Contacts cards. */
export default function AssetSection({ title, editing, locked, onEdit, onSave, onCancel, saving, error, className, children }) {
  return (
    <div className={cn(ELEVATED_SECTION, className)}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        {!editing && onEdit && <SectionEditButton onClick={onEdit} disabled={locked} />}
      </div>
      {children}
      {editing && (
        <>
          {error && <p className="text-xs text-destructive mt-4">{error}</p>}
          <CardEditFooter onCancel={onCancel} onSave={onSave} saving={saving} />
        </>
      )}
    </div>
  );
}