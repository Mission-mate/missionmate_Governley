import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StaffDetailsView from './StaffDetailsView';

export default function StaffDetailsStep({ form, set, setSelect, onSendInvite, readOnly = false }) {
  return (
    <div className="space-y-5">
      {readOnly ? <StaffDetailsView form={form} /> : <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm mb-1.5 block">First Name</Label>
          <Input value={form.first_name || ''} onChange={set('first_name')} />
        </div>
        <div>
          <Label className="text-sm mb-1.5 block">Last Name</Label>
          <Input value={form.last_name || ''} onChange={set('last_name')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm mb-1.5 block">Email Address</Label>
          <Input type="email" value={form.email || ''} onChange={set('email')} />
        </div>
        <div>
          <Label className="text-sm mb-1.5 block">Role</Label>
          <Select value={form.role} onValueChange={setSelect('role')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      </>}

      <div className="bg-muted/40 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
        <p><span className="font-semibold text-[hsl(var(--primary))]">Owner</span> — Full access to all settings and data</p>
        <p>Admin — Administrative access</p>
        <p><span className="font-semibold text-gray-700">User</span> — Team member with standard access</p>
        
      </div>

      {!readOnly &&
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Send Login Invite</p>
            <p className="text-xs text-muted-foreground">Email an invitation to access the platform.</p>
          </div>
          <Button variant="outline" size="sm" onClick={onSendInvite}>Send</Button>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Send Password Reset</p>
            <p className="text-xs text-muted-foreground">Email a link to reset their password.</p>
          </div>
          <Button variant="outline" size="sm" onClick={onSendInvite}>Send</Button>
        </div>
      </div>
      }
    </div>);

}