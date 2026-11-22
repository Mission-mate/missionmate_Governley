import React, { useState } from 'react';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import DateField from '@/components/ui/DateField';
import RpField from './RpField';
import RpSelect from './RpSelect';
import { TIPS } from './rpHelp';

export const newOffice = () => ({ id: Math.random().toString(36).slice(2, 10), office_held: '', committee: '', date_commenced: '', date_ceased: '' });

/** Repeatable office-holder rows with a "+ Add Additional Office" link. */
export default function OfficeFields({ offices, onChange, committees, savedIds = [] }) {
  const [pending, setPending] = useState(null);
  const update = (id, k, v) => onChange(offices.map((o) => (o.id === id ? { ...o, [k]: v } : o)));
  const remove = (id) => onChange(offices.filter((x) => x.id !== id));
  const requestRemove = (id) => (savedIds.includes(id) ? setPending(id) : remove(id));
  return (
    <div className="col-span-2 space-y-4">
      <ConfirmTypeDialog
        isOpen={!!pending}
        title="Remove Office"
        message="This office will be removed from the committee member when you save. Type DELETE to confirm."
        confirmLabel="Remove"
        onConfirm={() => { remove(pending); setPending(null); }}
        onClose={() => setPending(null)}
      />
      {offices.map((o, i) => (
        <div key={o.id} className={i > 0 ? 'pt-4 border-t border-border' : ''}>
          {i > 0 && (
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground">Additional Office {i}</p>
              <button type="button" onClick={() => requestRemove(o.id)} className="text-muted-foreground hover:text-destructive transition-colors" title="Remove office">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <RpField label="Office Held" tip={TIPS.office_held}><Input value={o.office_held} onChange={(e) => update(o.id, 'office_held', e.target.value)} placeholder="e.g. Treasurer" /></RpField>
            <RpField label="Committee" tip={TIPS.committee}><RpSelect value={o.committee} onChange={(v) => update(o.id, 'committee', v)} options={committees} placeholder="Select committee..." /></RpField>
            <RpField label="Date Commenced As Office Holder" tip={TIPS.office_commenced}><DateField value={o.date_commenced} onChange={(v) => update(o.id, 'date_commenced', v)} /></RpField>
            <RpField label="Date Ceased As Office Holder" tip={TIPS.office_ceased}><DateField value={o.date_ceased} onChange={(v) => update(o.id, 'date_ceased', v)} /></RpField>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...offices, newOffice()])}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors w-fit">
        <Plus className="w-4 h-4" /> Add Additional Office
      </button>
    </div>
  );
}