import React from 'react';
import { useParams } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import LoaderOne from '@/components/ui/loaders/LoaderOne';
import LoadError from '@/components/shared/states/LoadError';
import { getOrNull } from '@/lib/readState';
import AssetRegisterWorkspace from '@/components/compliance/assets/AssetRegisterWorkspace';
import InfoAssetWorkspace from '@/components/compliance/infoAssets/InfoAssetWorkspace';
import DonorWorkspace from '@/components/compliance/donors/DonorWorkspace';
import ResponsiblePeopleWorkspace from '@/components/compliance/responsiblePeople/ResponsiblePeopleWorkspace';
import GiftWorkspace from '@/components/compliance/gifts/GiftWorkspace';
import ComplaintWorkspace from '@/components/compliance/complaints/ComplaintWorkspace';
import WorkforceWorkspace from '@/components/compliance/workforce/WorkforceWorkspace';
import ContractWorkspace from '@/components/compliance/contracts/ContractWorkspace';
import ConflictRegisterWorkspace from '@/components/compliance/conflicts/ConflictRegisterWorkspace';
import WhsWorkspace from '@/components/compliance/whs/WhsWorkspace';

// Register type → workspace. Workspaces span the full width (so header dividers
// run edge to edge) and center their content via the `register-gutter` class.
const WORKSPACES = {
  asset: AssetRegisterWorkspace,
  information_asset: InfoAssetWorkspace,
  donor: DonorWorkspace,
  responsible_people: ResponsiblePeopleWorkspace,
  gifts_hospitality: GiftWorkspace,
  complaints: ComplaintWorkspace,
  contracts: ContractWorkspace,
  conflict_of_interest: ConflictRegisterWorkspace,
  police_check: WorkforceWorkspace,
  whs: WhsWorkspace,
};

export default function ManagedRegisterDetail() {
  const { id } = useParams();
  const { data: register, isLoading, ...read } = useQuery({
    queryKey: ['complianceManagedRegister', id],
    queryFn: () => getOrNull(() => base44.entities.ComplianceManagedRegister.get(id)),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoaderOne size="lg" />
      </div>
    );
  }

  if (read.isLoadingError) {
    return <LoadError page failure={read} title="Couldn’t load this register" />;
  }

  if (!register) {
    return <div className="p-8 text-sm text-muted-foreground">Register not found.</div>;
  }

  const Workspace = WORKSPACES[register.register_type];

  return (
    <div className="w-full h-full">
      {Workspace ? (
        <Workspace register={register} />
      ) : (
        <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
          <TopBarBack to="/compliance/registers">Back to Register Management</TopBarBack>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{register.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{register.category || 'Uncategorised'}</p>
          </div>
          <div className="bg-card border border-border rounded-xl py-16 px-6 text-center">
            <ClipboardList className="w-9 h-9 mx-auto mb-3 text-muted-foreground/50" />
            <h3 className="text-base font-semibold text-foreground">Register content coming soon</h3>
            <p className="text-sm text-muted-foreground mt-1">This register is set up and ready to be built out.</p>
          </div>
        </div>
      )}
    </div>
  );
}