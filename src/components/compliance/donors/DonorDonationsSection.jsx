import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { getAssetCustomColumns } from '@/lib/assetRegister';
import { DONATION_KIND, DONOR_DONATION_KIND } from '@/lib/donorRegister';
import RecordTab from './RecordTab';

const notArchived = () => false;

/** The donor's own slice of the shared Donations Register — same table, toolbar and pagination. */
export default function DonorDonationsSection({ register, donor }) {
  const qc = useQueryClient();
  const [pane, setPane] = useState(null);
  const key = ['donations', register.id];
  const { data = [], isLoading } = useQuery({ queryKey: key, queryFn: () => DONATION_KIND.api.list(register.id) });
  const items = useMemo(() => data.filter((d) => d.donor_id === donor.id), [data, donor.id]);
  const donorName = useCallback(() => donor.donor_name, [donor.donor_name]);

  // Arriving from the main Donations Register ("Open") — open that donation's pane once loaded.
  const [params, setParams] = useSearchParams();
  const requested = params.get('donation');
  useEffect(() => {
    if (!requested || isLoading) return;
    const target = items.find((d) => d.id === requested);
    if (target) setPane({ record: target });
    setParams((p) => { p.delete('donation'); return p; }, { replace: true });
  }, [requested, isLoading, items, setParams]);

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Donations Register</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Record and track donations received from this donor.</p>
        </div>
        <Button onClick={() => setPane({ record: null })}><Plus className="w-4 h-4" /> Add Donation</Button>
      </div>
      <RecordTab
        kind={DONOR_DONATION_KIND}
        register={register}
        items={items}
        isArchived={notArchived}
        isLoading={isLoading}
        refresh={() => qc.invalidateQueries({ queryKey: key })}
        customColumns={getAssetCustomColumns(register, DONATION_KIND.columnsKey)}
        donors={[donor]}
        donorName={donorName}
        pane={pane} setPane={setPane}
        customOpen={false} setCustomOpen={() => {}}
        newDefaults={{ donor_id: donor.id }}
        showSummary={false}
        showStatusTabs={false}
      />
    </section>
  );
}