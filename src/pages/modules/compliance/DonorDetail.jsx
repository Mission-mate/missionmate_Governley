import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import { getOrNull, loadFailure } from '@/lib/readState';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import AssetBadge from '@/components/compliance/assets/AssetBadge';
import usePageLeaveGuard from '@/hooks/usePageLeaveGuard';
import { getAssetCustomColumns } from '@/lib/assetRegister';
import { DONOR_KIND, DONATION_KIND, STATUS_OPTIONS } from '@/lib/donorRegister';
import DonorDetailCards from '@/components/compliance/donors/DonorDetailCards';
import DonorDonationsSection from '@/components/compliance/donors/DonorDonationsSection';

export default function DonorDetail() {
  const { registerId, donorId } = useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const leave = usePageLeaveGuard();
  const back = `/compliance/registers/${registerId}`;

  const { data: register, ...registerRead } = useQuery({ queryKey: ['complianceManagedRegister', registerId], queryFn: () => getOrNull(() => base44.entities.ComplianceManagedRegister.get(registerId)) });
  const { data: donors = [], isLoading, ...donorsRead } = useQuery({ queryKey: ['donors', registerId], queryFn: () => DONOR_KIND.api.list(registerId) });
  // Same query as the donations section below, so the page shows one loader until both are ready.
  const { isLoading: donationsLoading, ...donationsRead } = useQuery({ queryKey: ['donations', registerId], queryFn: () => DONATION_KIND.api.list(registerId) });
  const donor = donors.find((d) => d.id === donorId);
  const refresh = () => qc.invalidateQueries({ queryKey: ['donors', registerId] });

  const failure = loadFailure(registerRead, donorsRead, donationsRead);
  if (isLoading || donationsLoading || registerRead.isLoading) return <ModuleLoader fullPage />;
  if (failure.isLoadingError) return <LoadError page failure={failure} title="Couldn’t load this donor" />;
  if (!donor || !register) return <div className="p-8 text-sm text-muted-foreground">Donor not found. <Link to={back} className="text-primary">Back to Donor Register</Link></div>;

  return (
    <div className="h-full overflow-auto bg-background">
      {leave.dialog}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <TopBarBack onClick={() => leave.guard(() => navigate(back))}>Back to {register.title || 'Donor Register'}</TopBarBack>
        <div className="flex items-center gap-4">
          <PersonInitialsAvatar name={donor.donor_name} className="h-14 w-14 text-lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground tracking-tight truncate">{donor.donor_name}</h1>
              <AssetBadge value={donor.status || 'Active'} options={STATUS_OPTIONS} />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{[donor.donor_code, donor.email].filter(Boolean).join(' · ')}</p>
          </div>
        </div>
        <DonorDetailCards key={donor.updated_date} donor={donor} register={register} donors={donors}
          customColumns={getAssetCustomColumns(register, DONOR_KIND.columnsKey)} onSaved={refresh} />
        <DonorDonationsSection register={register} donor={donor} />
      </div>
    </div>
  );
}