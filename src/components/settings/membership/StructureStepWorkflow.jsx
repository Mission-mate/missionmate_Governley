import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import SectionCard from '@/components/shared/SectionCard';

function ToggleRow({ title, description, checked, onCheckedChange, disabled }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="space-y-1">
        <Label className="text-sm font-semibold text-foreground">{title}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} className="mt-0.5 shrink-0" />
    </div>);

}

export default function StructureStepWorkflow({ form, setForm }) {
  const toggle = (field) => setForm((f) => ({ ...f, [field]: !f[field] }));

  return (
    <div className="space-y-4">
      <SectionCard className="space-y-6">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">APPROVALS

        </h3>
        <ToggleRow
          title="Membership Approval"
          description="New membership applications are marked as Pending upon submission and must be approved by an administrator before they become active."
          checked
          disabled
          onCheckedChange={() => {}} />
        
      </SectionCard>

      <SectionCard className="space-y-6">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Notifications
        </h3>
        <ToggleRow
          title="Welcome Email"
          description="Automatically send welcome emails to new members"
          checked={!!form.welcome_email_enabled}
          onCheckedChange={() => toggle('welcome_email_enabled')} />
        
        <ToggleRow
          title="Renewal Reminder"
          description="Automatically notify members 14 days before membership expiration"
          checked={!!form.renewal_reminder_enabled}
          onCheckedChange={() => toggle('renewal_reminder_enabled')} />
        
        <ToggleRow
          title="Expiry Reminder"
          description="Automatically notify members after their membership expires and the grace period ends"
          checked={!!form.expiry_reminder_enabled}
          onCheckedChange={() => toggle('expiry_reminder_enabled')} />
        
      </SectionCard>
    </div>);

}