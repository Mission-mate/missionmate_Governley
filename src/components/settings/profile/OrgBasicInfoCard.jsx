import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SettingsCard from '@/components/settings/profile/SettingsCard';
import ProfileField from '@/components/settings/profile/ProfileField';

const TIMEZONE_OPTIONS = [
  'GMT+08:00 Australia/Perth (AWST)',
  'GMT+09:30 Australia/Adelaide (ACST)',
  'GMT+09:30 Australia/Darwin (ACST)',
  'GMT+10:00 Australia/Brisbane (AEST)',
  'GMT+10:00 Australia/Canberra (AEST)',
  'GMT+10:00 Australia/Hobart (AEST)',
  'GMT+10:00 Australia/Sydney (AEST)',
];

export default function OrgBasicInfoCard({ form, onChange, errorFor, cardProps }) {
  const editing = cardProps.editing;
  const set = (field) => (e) => onChange(field, e.target.value);

  return (
    <SettingsCard title="Basic Information" subtitle="Update your organisation details" {...cardProps}>
      <ProfileField label="Organisation Name" required editing={editing} value={form.name} error={errorFor('name')}>
        <Input value={form.name} onChange={set('name')} />
      </ProfileField>

      <div className="grid grid-cols-2 gap-4">
        <ProfileField label="Email" editing={editing} value={form.email}>
          <Input value={form.email} onChange={set('email')} />
        </ProfileField>
        <ProfileField label="Contact Number" editing={editing} value={form.phone}>
          <Input value={form.phone} onChange={set('phone')} />
        </ProfileField>
      </div>

      <ProfileField label="Time Zone" required editing={editing} value={form.timezone} error={errorFor('timezone')}>
        <Select value={form.timezone} onValueChange={(v) => onChange('timezone', v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select time zone" />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONE_OPTIONS.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
          </SelectContent>
        </Select>
      </ProfileField>
    </SettingsCard>
  );
}