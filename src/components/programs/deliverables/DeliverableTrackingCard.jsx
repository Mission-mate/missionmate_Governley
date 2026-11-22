import React from 'react';
import { ELEVATED_SECTION } from '@/components/shared/cardStyles';
import SectionEditButton from '@/components/shared/SectionEditButton';
import CardEditFooter from '@/components/shared/CardEditFooter';
import DeliverableFormFields from './DeliverableFormFields';
import useDeliverableCardEdit from './useDeliverableCardEdit';
import { TrackProgressRow } from './TrackingMethodPicker';
import DirectionLabel from '@/components/strategy/level6/tracking/DirectionLabel';
import { unitLabel } from '@/components/strategy/level6/tracking/trackingConfig';
import { TRACK_METHODS, tracksEnabled, tracksData } from '@/lib/programs/deliverableOptions';

const FIELDS = [['track_enabled', true], ['track_method', 'completion'], ['unit', '#'], ['direction', 'Higher is Better']];

const ViewBlock = ({ label, title, text }) => (
  <div className="rounded-xl bg-muted/50 px-4 py-3">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="text-sm font-semibold text-foreground mt-1">{title}</p>
    {text && <p className="text-xs text-muted-foreground mt-0.5">{text}</p>}
  </div>
);

/** Tracking and Monitoring card: selected method in view mode, inline editing on demand. */
export default function DeliverableTrackingCard({ deliverable: d, config, onSaved, locked, onEditingChange }) {
  const edit = useDeliverableCardEdit(d, FIELDS, onSaved, undefined, onEditingChange);
  const method = TRACK_METHODS.find((m) => m.value === (d.track_method || 'completion'));
  return (
    <div className={ELEVATED_SECTION}>
      <div className="flex items-start justify-between mb-5">
        <h3 className="text-base font-bold text-foreground">Tracking and Monitoring</h3>
        {!edit.editing && <SectionEditButton onClick={edit.start} disabled={locked} />}
      </div>
      {edit.editing ? (
        <>
          <DeliverableFormFields form={edit.form} set={edit.set} errors={edit.errors} config={config} sections={['tracking']} />
          <CardEditFooter onCancel={edit.cancel} onSave={edit.save} saving={edit.saving} />
        </>
      ) : (
        <div className="space-y-5">
          <TrackProgressRow enabled={tracksEnabled(d)} bare />
          {tracksEnabled(d) && <div className="space-y-3">
          <ViewBlock label="Tracking and Monitoring Method" title={method?.label} text={method?.description} />
          {tracksData(d) && (
            <div className="grid grid-cols-2 gap-3">
              <ViewBlock label="Unit of Measure" title={unitLabel(d.unit || '#')} />
              <ViewBlock label="Direction" title={<DirectionLabel value={d.direction || 'Higher is Better'} />} />
            </div>
          )}
          </div>}
        </div>
      )}
    </div>
  );
}