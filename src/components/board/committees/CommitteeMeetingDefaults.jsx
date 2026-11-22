import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InfoTooltip from '@/components/risk/InfoTooltip';
import { TIMEZONES } from '@/lib/boardMeetings';

const NONE = 'none';

const TIPS = {
  timezone: 'When this committee is selected on a new meeting, the meeting time zone is pre-filled with this value. It can still be changed for each meeting.',
  location: 'The usual venue for this committee, such as a room number or level. It pre-fills the location of new meetings and can still be changed for each meeting.',
};

export const timezoneLabel = (key) => TIMEZONES.find((t) => t.key === key)?.label || '';

function FieldLabel({ children, tip }) {
  return (
    <div className="flex items-center gap-1.5">
      <Label>{children}</Label>
      <InfoTooltip text={tip} />
    </div>
  );
}

/** Muted surface wrapping the section — matches the view-pane detail cards. */
function SectionShell({ children }) {
  return (
    <div className="rounded-2xl bg-muted p-5 space-y-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Meeting Defaults</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Pre-fills the time zone and location whenever a new meeting is created for this committee.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

/** Editable default time zone + location for meetings of a committee. */
export default function CommitteeMeetingDefaults({ timezone, location, onTimezoneChange, onLocationChange }) {
  return (
    <SectionShell>
      <div className="space-y-1.5 min-w-0">
        <FieldLabel tip={TIPS.timezone}>Default Time Zone</FieldLabel>
        <Select value={timezone || NONE} onValueChange={(v) => onTimezoneChange(v === NONE ? '' : v)}>
          <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>No default</SelectItem>
            {TIMEZONES.map((tz) => <SelectItem key={tz.key} value={tz.key}>{tz.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5 min-w-0">
        <FieldLabel tip={TIPS.location}>Default Location</FieldLabel>
        <Input className="bg-card" value={location} onChange={(e) => onLocationChange(e.target.value)} placeholder="e.g. Head Office Boardroom" />
      </div>
    </SectionShell>
  );
}

/** Read-only presentation of the committee's meeting defaults. */
export function CommitteeMeetingDefaultsView({ committee }) {
  const rows = [
    { label: 'Default Time Zone', tip: TIPS.timezone, value: timezoneLabel(committee.default_timezone) },
    { label: 'Default Location', tip: TIPS.location, value: committee.default_location },
  ];
  return (
    <SectionShell>
      {rows.map((r) => (
        <div key={r.label} className="space-y-1.5 min-w-0">
          <FieldLabel tip={r.tip}>{r.label}</FieldLabel>
          {r.value ? <p className="text-sm text-foreground break-words">{r.value}</p> : <p className="text-sm text-muted-foreground/60">Not set</p>}
        </div>
      ))}
    </SectionShell>
  );
}