import React from 'react';
import DetailsSection from './DetailsSection';
import { ROLE_LABELS } from '@/lib/staffRoles';

/** Details of the other person in a direct conversation, as recorded under Team members. */
export default function PersonDetails({ person }) {
  const fields = [
    { label: 'First Name', value: person?.first_name },
    { label: 'Last Name', value: person?.last_name },
    { label: 'Email Address', value: person?.email },
    { label: 'Role', value: ROLE_LABELS[person?.role] || person?.role },
  ];
  return (
    <DetailsSection>
      <div className="space-y-3">
        {fields.map((f) => (
          <div key={f.label} className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{f.label}</p>
            <p className="text-sm text-foreground mt-0.5 break-words">{f.value || '—'}</p>
          </div>
        ))}
      </div>
    </DetailsSection>
  );
}