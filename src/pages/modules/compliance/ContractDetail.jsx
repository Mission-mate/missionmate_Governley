import React from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import usePageLeaveGuard from '@/hooks/usePageLeaveGuard';
import useRecordTabCounts from '@/hooks/useRecordTabCounts';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import { getOrNull, loadFailure } from '@/lib/readState';
import ErrorBoundary from '@/components/shared/states/ErrorBoundary';
import NotesTab from '@/components/notes/NotesTab';
import DocumentsTab from '@/components/documents/DocumentsTab';
import AssetBadge from '@/components/compliance/assets/AssetBadge';
import ContractCards from '@/components/compliance/contracts/ContractCards';
import ContractObligationsTab from '@/components/compliance/contracts/obligations/ContractObligationsTab';
import { contractObligationsKey } from '@/lib/obligationSources';
import VariationsTab from '@/components/compliance/contracts/variations/VariationsTab';
import { variationsKey, countVariations } from '@/lib/contractVariations';
import { CONTRACT_OBJECT_TYPE, CONTRACT_STATUS_OPTIONS, getContractTypes } from '@/lib/contractRegister';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'financials', label: 'Financials' },
  { value: 'variations', label: 'Variations' },
  { value: 'obligations', label: 'Obligations' },
  { value: 'notes', label: 'Notes' },
  { value: 'documents', label: 'Documents' },
];
const OVERVIEW_CARDS = [
  { key: 'details', title: 'Contract Details' },
  { key: 'parties', title: 'Parties', side: true },
  { key: 'dates', title: 'Key Dates', side: true },
  { key: 'additional', title: 'Additional Details', full: true },
];
const FINANCIAL_CARDS = [{ key: 'financials', title: 'Financials', full: true }];

export default function ContractDetail() {
  const { registerId, contractId } = useParams();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const leave = usePageLeaveGuard();
  const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'overview';
  const back = `/compliance/registers/${registerId}`;

  const { data: register, ...registerRead } = useQuery({
    queryKey: ['complianceManagedRegister', registerId],
    queryFn: () => getOrNull(() => base44.entities.ComplianceManagedRegister.get(registerId)),
  });
  const { data: loaded, isLoading, ...contractRead } = useQuery({
    queryKey: ['contract', contractId],
    queryFn: () => getOrNull(() => base44.entities.Contract.get(contractId)),
  });
  // A contract from another register is treated as not found, and none of its side data is read.
  const contract = loaded?.register_id === registerId ? loaded : null;
  const counts = useRecordTabCounts(CONTRACT_OBJECT_TYPE, contract?.id);
  const failure = loadFailure(registerRead, contractRead);
  const { data: currentUser } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { data: variationCount } = useQuery({
    queryKey: [...variationsKey(contractId), 'count'],
    queryFn: () => countVariations(contractId),
    enabled: !!contract,
  });
  const { data: obligationCount } = useQuery({
    queryKey: [...contractObligationsKey(contractId), 'count'],
    queryFn: () => base44.entities.ContractObligation.count({ contract_id: contractId }),
    enabled: !!contract,
  });
  const tabCounts = { ...counts, variations: variationCount, obligations: obligationCount };

  const refresh = () => Promise.all([
    qc.invalidateQueries({ queryKey: ['contract', contractId] }),
    qc.invalidateQueries({ queryKey: ['contracts', registerId] }),
  ]);

  if (isLoading || registerRead.isLoading) return <ModuleLoader fullPage />;
  if (failure.isLoadingError) return <LoadError page failure={failure} title="Couldn’t load this contract" />;
  if (!contract || !register) return <div className="p-8 text-center text-sm text-muted-foreground">Contract not found.</div>;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {leave.dialog}
      <TopBarBack onClick={() => leave.guard(() => navigate(back))}>Back to {register.title}</TopBarBack>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground truncate">{contract.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className="font-mono text-xs font-medium rounded-md px-2 py-0.5 bg-muted text-muted-foreground">{contract.contract_code}</span>
            <AssetBadge value={contract.status || 'Active'} options={CONTRACT_STATUS_OPTIONS} />
            {contract.contract_type && <AssetBadge value={contract.contract_type} options={getContractTypes(register)} />}
          </div>
        </div>
      </div>

      <div className="mb-6 overflow-x-auto">
        <CapsuleTabs animated tabs={TABS.map((t) => ({ ...t, count: tabCounts[t.value] }))} value={tab}
          onChange={(v) => v !== tab && leave.guard(() => setParams({ tab: v }))} />
      </div>

      <ErrorBoundary resetKey={`${contract.id}:${tab}`}>
        {tab === 'overview' && <ContractCards key="overview" contract={contract} register={register} cards={OVERVIEW_CARDS} onSaved={refresh} />}
        {tab === 'financials' && <ContractCards key="financials" contract={contract} register={register} cards={FINANCIAL_CARDS} onSaved={refresh} />}
        {tab === 'variations' && <VariationsTab contract={contract} onChanged={() => Promise.all([refresh(), qc.invalidateQueries({ queryKey: [...variationsKey(contractId), 'count'] })])} />}
        {tab === 'obligations' && <ContractObligationsTab contract={contract} currentUser={currentUser} />}
        {tab === 'notes' && <NotesTab objectType={CONTRACT_OBJECT_TYPE} objectId={contract.id} currentUser={currentUser} />}
        {tab === 'documents' && <DocumentsTab objectType={CONTRACT_OBJECT_TYPE} objectId={contract.id} currentUser={currentUser} />}
      </ErrorBoundary>
    </div>
  );
}