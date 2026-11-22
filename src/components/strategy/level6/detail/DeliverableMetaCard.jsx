import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import SectionCard from './SectionCard';
import InitialsAvatar from '../../InitialsAvatar';
import { healthStyle, HEALTH_OPTIONS } from '../../level3/health';
import { PRIORITY_OPTIONS, STATUS_OPTIONS, priorityStyle, statusStyle } from '../../priority';
import OwnerMultiField from '../../OwnerMultiField';
import OwnerAvatarList from '../../OwnerAvatarList';
import OwnerLabelHint from '../../OwnerLabelHint';
import { parseOwners, serializeOwners } from '@/lib/strategy/ownerUtils';
import { validateMeta, hasErrors } from '@/lib/strategy/requiredMeta';
import StrategyCustomFields from '../../customFields/StrategyCustomFields';
import { getCustomColumns, showPriority } from '@/lib/strategy/levelFields';

const KEYS = ['status', 'health', 'priority'];
const pick = (item) => ({
  ...KEYS.reduce((a, k) => ({ ...a, [k]: item[k] || '' }), {}),
  owners: parseOwners(item),
  custom_fields: item.custom_fields || {}
});

const Field = ({ label, children, hint }) => (
  <div className="space-y-1.5">
    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">{label}{hint}</p>
    {children}
  </div>
);

const Pill = ({ value, style }) =>
  value ? <span className={cn('inline-flex items-center text-xs font-medium rounded-full px-2.5 py-0.5', style(value))}>{value}</span>
    : <p className="text-sm text-foreground">—</p>;

/** Owner / Status / Health / Priority section with its own edit mode. */
export default function DeliverableMetaCard({ item, strategy, onSave, saving }) {
  const customCols = getCustomColumns(strategy, item.level);
  const showPrio = showPriority(strategy, item.level);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(pick(item));
  const [errors, setErrors] = useState({});

  useEffect(() => { setForm(pick(item)); }, [item]);

  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  const save = async () => {
    const next = validateMeta(form);
    if (hasErrors(next)) { setErrors(next); return; }
    setErrors({});
    const { owners, ...rest } = form;
    await onSave({ ...rest, ...serializeOwners(owners) });
    setEditing(false);
  };

  return (
    <SectionCard title="Ownership and Status" onEdit={() => setEditing(true)} showEdit={!editing} className="h-full">
      <div className="grid grid-cols-2 gap-4">
        {editing ? (
          <OwnerMultiField value={form.owners || []} onChange={set('owners')} />
        ) : (
          <Field label="Owner" hint={<OwnerLabelHint />}>
            <OwnerAvatarList owners={parseOwners(item)} />
          </Field>
        )}
        <Field label={<>Health <span className="text-red-500">*</span></>}>
          {editing ? (
            <Select value={form.health || undefined} onValueChange={set('health')}>
              <SelectTrigger className={cn('h-9', errors.health && 'border-red-400')}><SelectValue placeholder="Select health..." /></SelectTrigger>
              <SelectContent>
                {HEALTH_OPTIONS.map((h) => (
                  <SelectItem key={h} value={h}><span className={cn('font-medium', healthStyle(h).text)}>{h}</span></SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : item.health
            ? <span className={cn('text-sm font-medium', healthStyle(item.health).text)}>{item.health}</span>
            : <p className="text-sm text-foreground">—</p>}
          {editing && errors.health && <p className="text-xs text-red-500">{errors.health}</p>}
        </Field>
        <Field label={<>Status <span className="text-red-500">*</span></>}>
          {editing ? (
            <Select value={form.status || undefined} onValueChange={set('status')}>
              <SelectTrigger className={cn('h-9', errors.status && 'border-red-400')}><SelectValue placeholder="Select status..." /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    <span className={cn('inline-flex items-center text-xs font-medium rounded-full px-2 py-0.5', statusStyle(s))}>{s}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : <Pill value={item.status} style={statusStyle} />}
          {editing && errors.status && <p className="text-xs text-red-500">{errors.status}</p>}
        </Field>
        <div className={cn(!showPrio && 'hidden')}>
        <Field label="Priority">
          {editing ? (
            <Select value={form.priority || undefined} onValueChange={set('priority')}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select priority..." /></SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((p) => (
                  <SelectItem key={p} value={p}>
                    <span className={cn('inline-flex items-center text-xs font-medium rounded-full px-2 py-0.5', priorityStyle(p))}>{p}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : <Pill value={item.priority} style={priorityStyle} />}
        </Field>
        </div>
        <StrategyCustomFields
          columns={customCols}
          values={form.custom_fields || {}}
          editing={editing}
          onChange={set('custom_fields')}
          inputClassName="h-9 bg-card"
        />
      </div>
      {editing && (
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => { setEditing(false); setErrors({}); setForm(pick(item)); }}>Cancel</Button>
          <Button onClick={save} disabled={saving}>Save Changes</Button>
        </div>
      )}
    </SectionCard>
  );
}