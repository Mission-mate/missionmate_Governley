import React, { useState } from 'react';
import { Pencil, Trash2, X } from 'lucide-react';
import PersonMetaLine from './PersonMetaLine';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import { isPersonComplete } from '@/lib/conflictScope';

export const PERSON_FIELDS = [
  { key: 'name', label: 'Name', required: true, placeholder: 'Enter full name...' },
  { key: 'role', label: 'Role', required: true, placeholder: 'Enter role...' },
  { key: 'division', label: 'Division', placeholder: 'Enter division...' },
  { key: 'email', label: 'Email', placeholder: 'Enter email...', type: 'email' },
];

/** Selected person profile card — view, inline edit, or remove. */
export default function CoiPersonCard({ member, onChange, onDelete, readOnly, startEditing }) {
  const [editing, setEditing] = useState(!member.user_id || !!startEditing);
  const [snapshot, setSnapshot] = useState(member);
  const set = (key, val) => onChange({ ...member, [key]: val, dirty: true });
  const startEdit = () => { setSnapshot(member); setEditing(true); };
  // Cancel restores the profile as it was when editing began; a brand-new profile is removed.
  const cancel = () => {
    if (!member.user_id) return onChange(null);
    onChange(snapshot);
    setEditing(false);
  };

  if (editing && !readOnly) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">{member.user_id ? 'Edit person profile' : 'New person profile'}</p>
          <button type="button" onClick={() => onChange(null)} className="text-muted-foreground hover:text-destructive" title="Remove person">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {PERSON_FIELDS.map((f) => (
            <div key={f.key}>
              <Label className="mb-1 block text-xs font-medium text-muted-foreground">
                {f.label} {f.required && <span className="text-destructive">*</span>}
              </Label>
              <Input type={f.type || 'text'} value={member[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} className="bg-white" />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={cancel}>Cancel</Button>
          <Button size="sm" onClick={() => setEditing(false)} disabled={!isPersonComplete(member)}>Save Changes</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex items-start gap-3">
      <PersonInitialsAvatar name={member.name} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground truncate">{member.name}</p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
          <PersonMetaLine person={member} />
          {!member.role && <span className="text-xs text-destructive">Role required</span>}
        </div>
      </div>
      {!readOnly && (
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={startEdit} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted" title="Edit person">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          {member.user_id && (
            <button type="button" onClick={() => onDelete(member)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted" title="Delete profile">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button type="button" onClick={() => onChange(null)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted" title="Remove person">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}