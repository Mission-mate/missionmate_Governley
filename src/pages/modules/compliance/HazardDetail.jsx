import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import LoaderOne from '@/components/ui/loaders/LoaderOne';
import LoadError from '@/components/shared/states/LoadError';
import { getOrNull, loadFailure } from '@/lib/readState';
import { whsConfig, hazardRating, OPEN_CLOSED } from '@/lib/whsRegister';
import { hazardFields, hazardSections, controlFields } from '@/lib/whsHazardFields';
import { pickFields, invalidateWhsRegister } from '@/lib/whsApi';
import HazardDetailsCard from '@/components/compliance/whs/hazard/HazardDetailsCard';
import HazardLinkedSection from '@/components/compliance/whs/hazard/HazardLinkedSection';
import LinkedActionsSection from '@/components/compliance/whs/hazard/LinkedActionsSection';
import { focusedActionId } from '@/lib/whsActionLinks';
import RatingBadge from '@/components/risk/RatingBadge';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import useLinkedCount from '@/components/compliance/whs/hazard/useLinkedCount';
import { saveWhsSource } from '@/lib/whsLifecycle';
import useRecordTabCounts from '@/hooks/useRecordTabCounts';
import WhsNotesDocsTab, { NOTES_DOCS_TABS } from '@/components/compliance/whs/WhsNotesDocsTab';

const CONTROL_COLUMNS = [
  { key: 'title', label: 'Control', kind: 'title', sub: 'description', width: '55%' },
  { key: 'owner', label: 'Owner', kind: 'person', width: '27%' },
  { key: 'status', label: 'Status', kind: 'pill', width: '18%' },
];

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'controls', label: 'Controls' },
  { value: 'actions', label: 'Actions' },
  ...NOTES_DOCS_TABS,
];

export default function HazardDetail() {
  const { registerId, hazardId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const controlCount = useLinkedCount('WhsHazardControl', { register_id: registerId, hazard_id: hazardId });
  const actionCount = useLinkedCount('WhsAction', { register_id: registerId, source_type: 'hazard', source_id: hazardId });
  const counts = useRecordTabCounts('whs_hazard', hazardId);
  const [tab, setTab] = useState(focusedActionId() ? 'actions' : 'overview');
  const { data: register, isLoading: lr, ...registerRead } = useQuery({
    queryKey: ['managedRegister', registerId],
    queryFn: () => getOrNull(() => base44.entities.ComplianceManagedRegister.get(registerId)),
  });
  const { data: hazard, isLoading: lh, ...hazardRead } = useQuery({
    queryKey: ['whsHazard', hazardId],
    queryFn: () => getOrNull(() => base44.entities.WhsHazard.get(hazardId)),
  });
  const failure = loadFailure(registerRead, hazardRead);

  if (lr || lh) return <div className="h-full flex items-center justify-center"><LoaderOne /></div>;
  if (failure.isLoadingError) return <LoadError page failure={failure} title="Couldn’t load this hazard" />;
  if (!register || !hazard || hazard.register_id !== registerId) {
    return <div className="p-10 text-center text-sm text-muted-foreground">Hazard not found.</div>;
  }

  const back = () => navigate(`/compliance/registers/${registerId}`);
  const cfg = whsConfig(register);
  const hFields = hazardFields(cfg);
  // Section-scoped save: merge the card's fields over the stored hazard so derived rating stays correct.
  const saveSection = async (values) => {
    const clean = pickFields(hFields, { ...hazard, ...values });
    await saveWhsSource('hazard', hazard.id, { ...clean, risk_rating: hazardRating(clean) || null });
    qc.invalidateQueries({ queryKey: ['whsLinked', 'WhsAction'] });
    invalidateWhsRegister(qc);
    await qc.invalidateQueries({ queryKey: ['whsHazard', hazardId] });
  };

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <TopBarBack onClick={back}>Back to {register.title}</TopBarBack>
        <div className="mb-6">
          {hazard.hazard_code && <p className="text-sm font-bold text-muted-foreground mb-1">{hazard.hazard_code}</p>}
          <h1 className="text-2xl font-bold text-foreground tracking-tight break-words">{hazard.title || 'Untitled hazard'}</h1>
          {hazard.risk_rating && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-bold text-foreground">Risk</span>
              <RatingBadge rating={hazard.risk_rating} />
            </div>
          )}
        </div>
        <div className="mb-6">
          <CapsuleTabs animated tabs={TABS.map((t) => ({ ...t, count: { ...counts, controls: controlCount, actions: actionCount }[t.value] }))} value={tab} onChange={setTab} />
        </div>
        {tab === 'overview' && <HazardDetailsCard record={hazard} sections={hazardSections(cfg)} onSave={saveSection} />}
        {tab === 'controls' && <HazardLinkedSection entityName="WhsHazardControl" link={{ register_id: registerId, hazard_id: hazard.id }}
            noun="Control" title="Controls" subtitle="Manage the controls in place for this hazard."
            fields={controlFields(cfg)} columns={CONTROL_COLUMNS} statuses={OPEN_CLOSED} statusTabs={OPEN_CLOSED} displayKey="title"
            newDefaults={async () => ({ status: 'Open' })} />}
        {tab === 'actions' && <LinkedActionsSection cfg={cfg} registerId={registerId} sourceType="hazard" sourceId={hazard.id} focusId={focusedActionId()} sourceCode={hazard.hazard_code} />}
        <WhsNotesDocsTab tab={tab} objectType="whs_hazard" objectId={hazard.id} />
      </div>
    </div>
  );
}