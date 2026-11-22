import React from 'react';
import { Input } from '@/components/ui/input';
import SettingsCard from '@/components/settings/profile/SettingsCard';
import ProfileField from '@/components/settings/profile/ProfileField';

export default function PersonalInfoCard({ form, email, onChange, cardProps }) {
  const editing = cardProps.editing;
  const set = (field) => (e) => onChange({ [field]: e.target.value });

  return (
    <SettingsCard title="Personal Information" subtitle="Update your name and contact details." {...cardProps}>
      <div className="grid grid-cols-2 gap-4">
        <ProfileField label="First Name" required editing={editing} value={form.first_name}>
          <Input value={form.first_name} onChange={set('first_name')} />
        </ProfileField>
        <ProfileField label="Last Name" required editing={editing} value={form.last_name}>
          <Input value={form.last_name} onChange={set('last_name')} />
        </ProfileField>
      </div>
      <ProfileField label="Email" required editing={editing} value={email}>
        <Input type="email" value={email} disabled className="opacity-70" />
      </ProfileField>
      <ProfileField label="Contact Number" editing={editing} value={form.phone}>
        <Input value={form.phone} onChange={set('phone')} placeholder="e.g. +61 400 000 000" />
      </ProfileField>
    </SettingsCard>
  );
}