import React from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import usePageLeaveGuard from '@/hooks/usePageLeaveGuard';
import useRecordTabCounts from '@/hooks/useRecordTabCounts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import { getOrNull, loadFailure } from '@/lib/readState';
import ErrorBoundary from '@/components/shared/states/ErrorBoundary';
import NotesTab from '@/components/notes/NotesTab';
import DocumentsTab from '@/components/documents/DocumentsTab';
import AssetBadge from '@/components/compliance/assets/AssetBadge';
import AssetOverviewTab from '@/components/compliance/assets/AssetOverviewTab';
import MaintenanceTab from '@/components/compliance/assets/MaintenanceTab';
import { ASSET_STATUS_OPTIONS } from '@/lib/assetRegister';
import { getAsset } from '@/lib/assetRegisterApi';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'notes', label: 'Notes' },
  { value: 'documents', label: 'Documents' },
];

export default function AssetDetail() {
  const { registerId, assetId } = useParams();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const leave = usePageLeaveGuard();
  const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'overview';

  const { data: register, ...registerRead } = useQuery({
    queryKey: ['complianceManagedRegister', registerId],
    queryFn: () => getOrNull(() => base44.entities.ComplianceManagedRegister.get(registerId)),
  });
  const { data: loaded, isLoading, ...assetRead } = useQuery({
    queryKey: ['assetItem', assetId],
    queryFn: () => getOrNull(() => getAsset(assetId)),
  });
  // An asset from another register is treated as not found, and none of its side data is read.
  const asset = loaded?.register_id === registerId ? loaded : null;
  const counts = useRecordTabCounts('compliance_asset', asset?.id);
  const failure = loadFailure(registerRead, assetRead);
  const { data: currentUser } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const refresh = () => Promise.all([
    qc.invalidateQueries({ queryKey: ['assetItem', assetId] }),
    qc.invalidateQueries({ queryKey: ['assetItems', registerId] }),
  ]);

  if (isLoading || registerRead.isLoading) return <ModuleLoader fullPage />;
  if (failure.isLoadingError) return <LoadError page failure={failure} title="Couldn’t load this asset" />;
  if (!asset || !register) return <div className="p-8 text-center text-sm text-muted-foreground">Asset not found.</div>;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {leave.dialog}
      <TopBarBack onClick={() => leave.guard(() => navigate(`/compliance/registers/${registerId}`))}>Back to {register.title}</TopBarBack>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <Package className="w-6 h-6 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground truncate">{asset.title}</h1>
            <span className="font-mono text-xs font-medium rounded-md px-2 py-0.5 bg-muted text-muted-foreground">{asset.asset_id}</span>
            <AssetBadge value={asset.status} options={ASSET_STATUS_OPTIONS} />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {[asset.asset_type, asset.location].filter(Boolean).join(' · ') || 'Asset'}
          </p>
        </div>
      </div>

      <div className="mb-6 overflow-x-auto">
        <CapsuleTabs animated tabs={TABS.map((t) => ({ ...t, count: counts[t.value] }))} value={tab} onChange={(v) => v !== tab && leave.guard(() => setParams({ tab: v }))} />
      </div>

      <ErrorBoundary resetKey={`${asset.id}:${tab}`}>
        {tab === 'overview' && <AssetOverviewTab asset={asset} register={register} onSaved={refresh} />}
        {tab === 'maintenance' && <MaintenanceTab asset={asset} />}
        {tab === 'notes' && <NotesTab objectType="compliance_asset" objectId={asset.id} currentUser={currentUser} />}
        {tab === 'documents' && <DocumentsTab objectType="compliance_asset" objectId={asset.id} currentUser={currentUser} />}
      </ErrorBoundary>
    </div>
  );
}