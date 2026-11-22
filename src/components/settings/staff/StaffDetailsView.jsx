import React from 'react';
import { ROLE_LABELS } from '@/lib/staffRoles';

/** Read-only staff details — label/value grid on a soft muted card. */
export default function StaffDetailsView({ form }) {
  const fields = [
    { label: 'First Name', value: form.first_name },
    { label: 'Last Name', value: form.last_name },
    { label: 'Email Address', value: form.email },
    { label: 'Role', value: ROLE_LABELS[form.role] || form.role },
  ];
  return (
    <div className="rounded-xl bg-muted/60 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Staff Details</p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {fields.map((f) => (
          <div key={f.label} className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{f.label}</p>
            <p className="text-sm text-foreground mt-0.5 break-words">{f.value || '—'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}