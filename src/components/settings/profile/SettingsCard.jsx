import React from 'react';
import SectionEditButton from '@/components/shared/SectionEditButton';
import CardEditFooter from '@/components/shared/CardEditFooter';

/**
 * Settings section card with optional inline edit mode.
 * Pass `onEdit` to show the header Edit action; while `editing`, the card shows
 * its own Cancel / Save Changes footer.
 */
export default function SettingsCard({
  title, subtitle, children, onEdit, editing = false, editDisabled = false,
  onCancel, onSave, saving = false, saveDisabled = false,
}) {
  return (
    <div className="border border-border rounded-xl p-6 bg-white dark:bg-card h-full flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-semibold text-foreground mb-0.5">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {onEdit && !editing && <SectionEditButton onClick={onEdit} disabled={editDisabled} />}
      </div>
      <div className="space-y-5">{children}</div>
      {editing && (
        <div className="mt-auto">
          <CardEditFooter onCancel={onCancel} onSave={onSave} saving={saving} saveDisabled={saveDisabled} />
        </div>
      )}
    </div>
  );
}