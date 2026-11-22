import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** Read-only first name / last name / email populated from the selected user. */
export default function MemberIdentityFields({ user }) {
  const parts = (user?.full_name || '').trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ');

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label>First name</Label>
        <Input value={firstName} disabled readOnly className="bg-muted/50" />
      </div>
      <div className="space-y-1.5">
        <Label>Last name</Label>
        <Input value={lastName} disabled readOnly className="bg-muted/50" />
      </div>
      <div className="space-y-1.5 col-span-2">
        <Label>Email</Label>
        <Input value={user?.email || ''} disabled readOnly className="bg-muted/50" />
      </div>
    </div>);

}