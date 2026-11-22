import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import { MapPin, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import SlidePane from '@/components/ui/SlidePane';
import LocationManager from './LocationManager';
import ReportingGuideCard from './ReportingGuideCard';
import SectionCard from '@/components/shared/SectionCard';
import CloseButton from '@/components/shared/CloseButton';
import { useReportStore } from '@/lib/tasks/reportStore';
const LAYOUTS = [
{
  id: 'period',
  title: "Reporting By Period",
  guide: "Categories under each period"
},
{
  id: 'location',
  title: 'Reporting By Category',
  guide: "Periods under each category"
}];


/**
 * Standalone right pane for a Level 6 record's location based reporting settings.
 * Opened from the reporting table footer, keeping the details pane clean.
 */
export default function Level6SettingsPane({ block, isOpen, onClose, onUpdated, onLocationsChange }) {
  const store = useReportStore();
  const [baseline, setBaseline] = useState(() => snapshotOf(block));
  const [enabled, setEnabled] = useState(baseline.enabled);
  const [breakdown, setBreakdown] = useState(baseline.breakdown);
  const [locations, setLocations] = useState(baseline.locations);
  const [saving, setSaving] = useState(false);

  // Re-read the saved setup whenever the pane opens or the block changes.
  useEffect(() => {
    if (!isOpen) return;
    const snap = snapshotOf(block);
    setBaseline(snap);
    setEnabled(snap.enabled);
    setBreakdown(snap.breakdown);
    setLocations(snap.locations);
  }, [isOpen, block]);

  const { requestClose, dialog } = useUnsavedChanges({
    draft: { enabled, breakdown, locations }, baseline, onClose, saving, enabled: isOpen,
    subject: 'reporting settings changes',
  });

  if (!block) return null;

  const toggleEnabled = (v) => setEnabled(v);
  const selectLayout = (id) => setBreakdown(id);
  const changeLocations = (next) => setLocations(next);

  // Apply toggle, layout and category list together, then reconcile rows once.
  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities[store.parent].update(block.id, {
        location_reporting_enabled: enabled, reporting_breakdown: breakdown,
      });
      if (onLocationsChange) await onLocationsChange(locations, enabled);
      else await base44.entities[store.parent].update(block.id, { reporting_locations: locations });
      await onUpdated?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <SlidePane isOpen={isOpen} onClose={requestClose} className="bg-card shadow-2xl flex flex-col font-body">
      <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-border">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-foreground truncate">Reporting Settings</h2>
          <p className="text-xs text-muted-foreground truncate">{block.title}</p>
        </div>
        <CloseButton onClick={requestClose} className="shrink-0" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        {/* Enable toggle */}
        <SectionCard className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-foreground">Enable Category Based Reporting</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Break reporting data down by category. When off, each row is a reporting period.
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={toggleEnabled} />
        </SectionCard>

        {!enabled &&
        <ReportingGuideCard
          title="What is Category Based Reporting?"
          body="By default, every row in your reporting table is a reporting period. Category based reporting lets you split those numbers further by a category — a location, office, division, project or service — so you can see who or where the results came from, not just when."
          example="For “Number of training programs delivered”, instead of one total for Q1, you record Q1 results for Location A, Location B and Location C, each with its own expected and actual figures." />

        }

        {enabled &&
        <div className="space-y-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">Choose reporting layout</h3>
              <p className="text-xs text-muted-foreground mt-0.5">How reporting data should be grouped</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {LAYOUTS.map((l) =>
            <button
              key={l.id}
              onClick={() => selectLayout(l.id)}
              className={cn(
                'text-left rounded-xl border p-4 transition-colors',
                breakdown === l.id ?
                'border-primary bg-primary/5 ring-1 ring-primary' :
                'border-border hover:border-primary/40'
              )}>
              
                  <div className="flex items-start gap-2">
                    <span className={cn(
                      'mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                      breakdown === l.id ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                    )}>
                      {breakdown === l.id && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                    </span>
                    <div className="min-w-0">
                      <p className={cn('text-sm font-bold', breakdown === l.id ? 'text-primary' : 'text-foreground')}>{l.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{l.guide}</p>
                    </div>
                  </div>
                </button>
            )}
            </div>
            {!breakdown &&
          <ReportingGuideCard
            title="Reporting By Period or By Category?"
            body="Both layouts capture the same data. They only change what sits at the top level of your reporting table. ‘By Period’ groups your categories under each reporting period. ‘By Category’ groups your reporting periods under each category."
            example={'By Period: Q1 2028 → Location A, Location B, Location C.\nBy Category: Location A → Q1, Q2, Q3, Q4.'} />

          }
          </div>
        }

        {enabled && breakdown &&
        <div className="border-t border-border pt-4 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-muted-foreground" /> Manage Categories
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Categories added here are automatically added to the reporting table based on the layout above.
              </p>
            </div>
            <LocationManager locations={locations} onChange={changeLocations} />
          </div>
        }
      </div>
      <div className="px-5 py-4 border-t border-border flex items-center justify-between shrink-0">
        <Button variant="outline" onClick={requestClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
      </div>
    </SlidePane>
    {dialog}
    </>);

}

function snapshotOf(block) {
  return {
    enabled: !!block?.location_reporting_enabled,
    breakdown: block?.reporting_breakdown || '',
    locations: (block?.reporting_locations || []).map((l) => ({ ...l })),
  };
}