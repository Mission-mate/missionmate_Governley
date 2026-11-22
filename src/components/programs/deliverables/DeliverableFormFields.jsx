import React from 'react';
import { Input } from '@/components/ui/input';
import DescriptionField from '@/components/strategy/DescriptionField';
import OptionSelect from './OptionSelect';
import TrackingMethodPicker from './TrackingMethodPicker';
import { CustomFieldInput } from './CustomFieldInput';
import DirectionLabel from '@/components/strategy/level6/tracking/DirectionLabel';
import { unitLabel } from '@/components/strategy/level6/tracking/trackingConfig';
import {
  STATUS_OPTIONS, HEALTH_OPTIONS, PRIORITY_OPTIONS, UNITS, DIRECTIONS,
  statusClass, healthClass, priorityClass,
} from '@/lib/programs/deliverableOptions';

const LabelCtx = React.createContext(false);
const Label = ({ children, required }) => {
  const compact = React.useContext(LabelCtx);
  return (
    <label className={compact ? 'text-xs font-medium text-muted-foreground block mb-1.5' : 'text-sm font-medium text-foreground block mb-1.5'}>{children}{required && <span className="text-destructive"> *</span>}</label>
  );
};
const Err = ({ msg }) => (msg ? <p className="text-xs text-destructive mt-1">{msg}</p> : null);

/** `sections` limits which groups render: details, tracking, or both (default). `compact` = side-pane label style. */
export default function DeliverableFormFields(props) {
  return <LabelCtx.Provider value={!!props.compact}><Fields {...props} /></LabelCtx.Provider>;
}

function Fields({ form, set, errors, config, sections = ['details', 'tracking'], compact }) {
  const setCustom = (id) => (v) => set('custom_fields')({ ...(form.custom_fields || {}), [id]: v });
  const showData = form.track_enabled && form.track_method !== 'completion';
  const details = sections.includes('details');
  const tracking = sections.includes('tracking');
  return (
    <div className={compact ? 'space-y-4 [&_input]:bg-background [&_textarea]:bg-background [&_[role=combobox]]:bg-background' : 'space-y-4'}>
      {details && <>
      <div>
        <Label required>Name</Label>
        <Input value={form.title} onChange={(e) => set('title')(e.target.value)} placeholder="e.g., Deliver 12 community workshops" className={errors.title ? 'border-destructive' : ''} autoFocus />
        <Err msg={errors.title} />
      </div>
      <DescriptionField value={form.description} onChange={set('description')} />
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Owner</Label><Input value={form.owner} onChange={(e) => set('owner')(e.target.value)} placeholder="Assign an owner" /></div>
        <div><Label required>Health</Label><OptionSelect value={form.health} onChange={set('health')} options={HEALTH_OPTIONS} styleFn={healthClass} invalid={errors.health} placeholder="Select health..." /><Err msg={errors.health} /></div>
        <div><Label required>Status</Label><OptionSelect value={form.status} onChange={set('status')} options={STATUS_OPTIONS} styleFn={statusClass} invalid={errors.status} placeholder="Select status..." /><Err msg={errors.status} /></div>
        {config.show_priority && (
          <div><Label>Priority</Label><OptionSelect value={form.priority} onChange={set('priority')} options={PRIORITY_OPTIONS} styleFn={priorityClass} placeholder="Select priority..." /></div>
        )}
      </div>
      </>}
      {tracking && <TrackingMethodPicker enabled={form.track_enabled} method={form.track_method} onToggle={set('track_enabled')} onMethod={set('track_method')} bare={!details || compact} />}
      {tracking && showData && (
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Unit of Measure</Label><OptionSelect value={form.unit} onChange={set('unit')} options={UNITS.map((u) => ({ value: u, label: unitLabel(u) }))} /></div>
          <div><Label>Direction</Label><OptionSelect value={form.direction} onChange={set('direction')} options={DIRECTIONS.map((d) => ({ value: d, label: <DirectionLabel value={d} /> }))} /></div>
        </div>
      )}
      {details && config.custom_columns.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {config.custom_columns.map((c) => (
            <div key={c.id}><Label>{c.title}</Label><CustomFieldInput column={c} value={form.custom_fields?.[c.id]} onChange={setCustom(c.id)} /></div>
          ))}
        </div>
      )}
    </div>
  );
}