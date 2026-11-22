import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import LoadError from '@/components/shared/states/LoadError';
import { loadFailure } from '@/lib/readState';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import { getAssetCustomColumns } from '@/lib/assetRegister';
import { DONOR_KIND, DONATION_KIND, ARCHIVED, nextDonorId } from '@/lib/donorRegister';
import RecordTab from './RecordTab';

/** Donor Register workspace — Donor Register and Donations Register tabs. */
export default function DonorWorkspace({ register }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState('donor');
  const [pane, setPane] = useState(null); // { record, edit? } — record null = add
  const [customOpen, setCustomOpen] = useState(false);

  const donorKey = ['donors', register.id];
  const donationKey = ['donations', register.id];
  const donorsQ = useQuery({ queryKey: donorKey, queryFn: () => DONOR_KIND.api.list(register.id) });
  const donationsQ = useQuery({ queryKey: donationKey, queryFn: () => DONATION_KIND.api.list(register.id) });
  const donors = donorsQ.data || [];
  const donations = donationsQ.data || [];
  const failure = loadFailure(donorsQ, donationsQ);

  const names = useMemo(() => Object.fromEntries(donors.map((d) => [d.id, d.donor_name])), [donors]);
  const donorName = useCallback((id) => names[id] || '', [names]);
  // Donations have no stored status: they follow their linked donor, so archive/restore is always in sync.
  const archivedDonorIds = useMemo(() => new Set(donors.filter((d) => d.status === ARCHIVED).map((d) => d.id)), [donors]);
  const isDonorArchived = useCallback((d) => d.status === ARCHIVED, []);
  const isDonationArchived = useCallback((d) => archivedDonorIds.has(d.donor_id), [archivedDonorIds]);

  const isDonor = tab === 'donor';
  const kind = isDonor ? DONOR_KIND : DONATION_KIND;
  const switchTab = (t) => { setPane(null); setCustomOpen(false); setTab(t); };
  const openDonor = (d) => navigate(`/compliance/registers/${register.id}/donor/${d.id}`);
  const openDonationInProfile = (d) => navigate(`/compliance/registers/${register.id}/donor/${d.donor_id}?donation=${d.id}`);

  const canDeleteDonors = async (ids) => {
    const linked = await base44.entities.Donation.count({ donor_id: { $in: ids } });
    return linked ? `The selected donor${ids.length === 1 ? ' has' : 's have'} ${linked} linked donation${linked === 1 ? '' : 's'}. Delete or reassign those donations first.` : '';
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="relative z-30 flex items-center justify-between register-gutter py-3 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <TopBarBack onClick={() => navigate('/compliance/registers')}>Back to Register Management</TopBarBack>
          <div>
            <h1 className="text-base font-semibold text-foreground leading-tight">{register.title}</h1>
            <p className="text-xs text-muted-foreground">{donors.length} donor{donors.length !== 1 ? 's' : ''} · {donations.length} donation{donations.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCustomOpen(true)}><SlidersHorizontal className="w-4 h-4" /> Customise</Button>
          {isDonor && <Button onClick={() => setPane({ record: null })}><Plus className="w-4 h-4" /> Add Donor</Button>}
        </div>
      </div>

      <div className="flex-1 overflow-auto register-gutter py-5">
        <CapsuleTabs animated value={tab} onChange={switchTab} className="mb-5"
          tabs={[{ value: 'donor', label: 'Donor Register', count: donors.length }, { value: 'donation', label: 'Donations Register', count: donations.length }]} />
        {failure.isLoadingError ? <LoadError failure={failure} title="Couldn’t load the register" /> : <RecordTab
          key={tab}
          kind={kind}
          register={register}
          items={isDonor ? donors : donations}
          isArchived={isDonor ? isDonorArchived : isDonationArchived}
          isLoading={isDonor ? donorsQ.isLoading : donationsQ.isLoading}
          refresh={() => qc.invalidateQueries({ queryKey: isDonor ? donorKey : donationKey })}
          customColumns={getAssetCustomColumns(register, kind.columnsKey)}
          donors={donors}
          donorName={donorName}
          pane={pane} setPane={setPane}
          customOpen={customOpen} setCustomOpen={setCustomOpen}
          canDelete={isDonor ? canDeleteDonors : undefined}
          onOpenRecord={isDonor ? openDonor : undefined}
          onCreated={isDonor ? openDonor : undefined}
          onOpenInProfile={isDonor ? undefined : openDonationInProfile}
          newDefaults={isDonor ? { donor_code: nextDonorId(donors) } : undefined}
        />}
      </div>
    </div>
  );
}